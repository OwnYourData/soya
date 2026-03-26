import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 80);
const BUILD_DIR = path.join(__dirname, 'build');

const REPO_BASE_URL = (process.env.REPO_BASE_URL || '').replace(/\/+$/, '');
const REPO_AUTH_MODE = (process.env.REPO_AUTH_MODE || 'public').trim();

const OAUTH_TOKEN_URL = process.env.OAUTH_TOKEN_URL || '';
const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID || '';
const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || '';
const OAUTH_SCOPE = process.env.OAUTH_SCOPE || '';

if (!REPO_BASE_URL) {
  console.error('Missing required environment variable: REPO_BASE_URL');
  process.exit(1);
}

if (
  REPO_AUTH_MODE === 'private' ||
  REPO_AUTH_MODE === 'oauth2' ||
  REPO_AUTH_MODE === 'oauth2_client_credentials'
) {
  if (!OAUTH_TOKEN_URL) {
    console.error('Missing required environment variable for private repo: OAUTH_TOKEN_URL');
    process.exit(1);
  }
  if (!OAUTH_CLIENT_ID) {
    console.error('Missing required environment variable for private repo: OAUTH_CLIENT_ID');
    process.exit(1);
  }
  if (!OAUTH_CLIENT_SECRET) {
    console.error('Missing required environment variable for private repo: OAUTH_CLIENT_SECRET');
    process.exit(1);
  }
}

const runtimeConfig = {
  repoBaseUrl: REPO_BASE_URL,
  repoMode:
    REPO_AUTH_MODE === 'private' ||
    REPO_AUTH_MODE === 'oauth2' ||
    REPO_AUTH_MODE === 'oauth2_client_credentials'
      ? 'private'
      : 'public',
};

let cachedToken = null;
let cachedTokenExpiresAt = 0;
let tokenPromise = null;

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function sendText(res, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function getContentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.ico')) return 'image/x-icon';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  if (filePath.endsWith('.txt')) return 'text/plain; charset=utf-8';
  return 'application/octet-stream';
}

async function getAccessToken() {
  if (runtimeConfig.repoMode !== 'private') {
    return null;
  }

  const now = Date.now();
  if (cachedToken && cachedTokenExpiresAt > now + 30_000) {
    return cachedToken;
  }

  if (tokenPromise) {
    return tokenPromise;
  }

  tokenPromise = (async () => {
    const form = new URLSearchParams();
    form.set('grant_type', 'client_credentials');
    form.set('client_id', OAUTH_CLIENT_ID);
    form.set('client_secret', OAUTH_CLIENT_SECRET);

    if (OAUTH_SCOPE) {
      form.set('scope', OAUTH_SCOPE);
    }

    const res = await fetch(OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`OAuth token request failed (HTTP ${res.status}): ${body}`);
    }

    const json = await res.json();
    if (!json?.access_token) {
      throw new Error('OAuth token response does not contain access_token');
    }

    const expiresIn = Number(json.expires_in || 300);
    cachedToken = String(json.access_token);
    cachedTokenExpiresAt = Date.now() + expiresIn * 1000;

    return cachedToken;
  })();

  try {
    return await tokenPromise;
  } finally {
    tokenPromise = null;
  }
}

async function fetchFromRepo(upstreamUrl, accept) {
  const headers = {
    Accept: accept,
  };

  const token = await getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(upstreamUrl, {
    method: 'GET',
    headers,
  });

  return res;
}

async function handleRuntimeConfig(req, res) {
  sendJson(res, 200, runtimeConfig);
}

async function handleRepoQuery(req, res, url) {
  const q = (url.searchParams.get('name') || '').trim();
  if (!q) {
    return sendJson(res, 200, []);
  }

  const upstream = `${REPO_BASE_URL}/api/soya/query?name=${encodeURIComponent(q)}`;

  try {
    const upstreamRes = await fetchFromRepo(upstream, 'application/json');
    const body = await upstreamRes.text();

    res.writeHead(upstreamRes.status, {
      'Content-Type': upstreamRes.headers.get('content-type') || 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch (e) {
    sendJson(res, 502, {
      error: 'Failed to query configured SOyA repository',
      details: String(e?.message || e),
    });
  }
}

async function handleRepoYaml(req, res, soyaName) {
  const upstream = `${REPO_BASE_URL}/${encodeURIComponent(soyaName)}/yaml`;

  try {
    const upstreamRes = await fetchFromRepo(upstream, 'text/plain');
    const body = await upstreamRes.text();

    res.writeHead(upstreamRes.status, {
      'Content-Type': upstreamRes.headers.get('content-type') || 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch (e) {
    sendJson(res, 502, {
      error: 'Failed to fetch YAML from configured SOyA repository',
      details: String(e?.message || e),
    });
  }
}

function safeJoin(base, target) {
  const targetPath = path.normalize(target).replace(/^(\.\.[/\\])+/, '');
  return path.join(base, targetPath);
}

function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === '/') {
    pathname = '/index.html';
  }

  const filePath = safeJoin(BUILD_DIR, pathname);

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      fs.readFile(filePath, (readErr, content) => {
        if (readErr) {
          sendText(res, 500, 'Internal Server Error');
          return;
        }

        res.writeHead(200, {
          'Content-Type': getContentType(filePath),
          'Content-Length': content.length,
        });
        res.end(content);
      });
      return;
    }

    const indexPath = path.join(BUILD_DIR, 'index.html');
    fs.readFile(indexPath, (indexErr, content) => {
      if (indexErr) {
        sendText(res, 500, 'index.html not found');
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': content.length,
      });
      res.end(content);
    });
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/api/runtime-config') {
      return await handleRuntimeConfig(req, res);
    }

    if (req.method === 'GET' && url.pathname === '/api/repo/query') {
      return await handleRepoQuery(req, res, url);
    }

    const yamlMatch = url.pathname.match(/^\/api\/repo\/(.+)\/yaml$/);
    if (req.method === 'GET' && yamlMatch) {
      const soyaName = decodeURIComponent(yamlMatch[1]);
      return await handleRepoYaml(req, res, soyaName);
    }

    return serveStatic(req, res, url);
  } catch (e) {
    sendJson(res, 500, {
      error: 'Internal server error',
      details: String(e?.message || e),
    });
  }
});

server.listen(PORT, () => {
  console.log(`soya-form server listening on port ${PORT}`);
  console.log(`Configured repository: ${REPO_BASE_URL}`);
  console.log(`Repository mode: ${runtimeConfig.repoMode}`);
});