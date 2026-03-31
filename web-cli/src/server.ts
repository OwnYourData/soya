import express, { Express } from 'express';
import { Soya, Overlays, RepoService } from 'soya-js';
import swaggerUi from 'swagger-ui-express';
import { promises as fs } from 'fs';
import path from 'path';
import http from 'http';
import { getFileRoot } from './utils/fs';

type RepoMode = 'public' | 'private';

type AppConfig = {
  port: number;
  repoProxyPort: number;
  repoBaseUrl: string;
  repoMode: RepoMode;
  oauthTokenUrl?: string;
  oauthClientId?: string;
  oauthClientSecret?: string;
  oauthScope?: string;
  oauthAudience?: string;
};

type CachedToken = {
  accessToken: string;
  expiresAt: number;
};

const PRIVATE_REPO_AUTH_MODES = new Set([
  'private',
  'oauth2',
  'oauth2_client_credentials',
]);

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, '');

const getTrimmedEnv = (name: string): string | undefined => {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
};

const getConfig = (): AppConfig => {
  const port = Number(process.env['PORT'] ?? '8080');

  const repoBaseUrl = normalizeBaseUrl(
    process.env['REPO_BASE_URL'] ??
      process.env['SOYA_REPO'] ??
      'https://soya.ownyourdata.eu'
  );

  const rawMode = (process.env['REPO_AUTH_MODE'] ?? 'public')
    .trim()
    .toLowerCase();

  const repoMode: RepoMode = PRIVATE_REPO_AUTH_MODES.has(rawMode)
    ? 'private'
    : 'public';

  const config: AppConfig = {
    port,
    repoProxyPort: Number(process.env['REPO_PROXY_PORT'] ?? String(port + 1)),
    repoBaseUrl,
    repoMode,
  };

  if (repoMode === 'private') {
    const oauthTokenUrl = getTrimmedEnv('OAUTH_TOKEN_URL');
    const oauthClientId = getTrimmedEnv('OAUTH_CLIENT_ID');
    const oauthClientSecret = getTrimmedEnv('OAUTH_CLIENT_SECRET');
    const oauthScope = getTrimmedEnv('OAUTH_SCOPE');
    const oauthAudience = getTrimmedEnv('OAUTH_AUDIENCE');

    if (!oauthTokenUrl) {
      throw new Error('Missing OAUTH_TOKEN_URL for private repository mode');
    }
    if (!oauthClientId) {
      throw new Error('Missing OAUTH_CLIENT_ID for private repository mode');
    }
    if (!oauthClientSecret) {
      throw new Error('Missing OAUTH_CLIENT_SECRET for private repository mode');
    }

    config.oauthTokenUrl = oauthTokenUrl;
    config.oauthClientId = oauthClientId;
    config.oauthClientSecret = oauthClientSecret;

    if (oauthScope) {
      config.oauthScope = oauthScope;
    }

    if (oauthAudience) {
      config.oauthAudience = oauthAudience;
    }
  }

  return config;
};

let cachedToken: CachedToken | undefined;
let pendingTokenRequest: Promise<string> | undefined;

const getAccessToken = async (
  config: AppConfig
): Promise<string | undefined> => {
  if (config.repoMode !== 'private') {
    return undefined;
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.accessToken;
  }

  if (pendingTokenRequest) {
    return pendingTokenRequest;
  }

  pendingTokenRequest = (async () => {
    const body = new URLSearchParams();
    body.set('grant_type', 'client_credentials');
    body.set('client_id', config.oauthClientId!);
    body.set('client_secret', config.oauthClientSecret!);

    if (config.oauthScope) {
      body.set('scope', config.oauthScope);
    }

    if (config.oauthAudience) {
      body.set('audience', config.oauthAudience);
    }

    const response = await fetch(config.oauthTokenUrl!, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(
        `OAuth token request failed (${response.status}): ${errorBody}`
      );
    }

    const tokenResponse = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };

    if (!tokenResponse.access_token) {
      throw new Error('OAuth token response does not contain access_token');
    }

    const expiresInSeconds = Number(tokenResponse.expires_in ?? 300);

    cachedToken = {
      accessToken: tokenResponse.access_token,
      expiresAt: Date.now() + expiresInSeconds * 1000,
    };

    return cachedToken.accessToken;
  })();

  try {
    return await pendingTokenRequest;
  } finally {
    pendingTokenRequest = undefined;
  }
};

const buildUpstreamUrl = (config: AppConfig, requestUrl: string): string => {
  const base = config.repoBaseUrl;
  const pathAndQuery = requestUrl.startsWith('/') ? requestUrl : `/${requestUrl}`;
  return `${base}${pathAndQuery}`;
};

const copyHeaderIfPresent = (
  source: express.Request['headers'],
  target: Headers,
  name: string
) => {
  const value = source[name.toLowerCase()];
  if (typeof value === 'string' && value.length > 0) {
    target.set(name, value);
  }
};

const createRepoProxyApp = (config: AppConfig): Express => {
  const app = express();

  app.use(
    express.raw({
      type: () => true,
      limit: '20mb',
    })
  );

  app.all('*', async (req, res) => {
    const upstreamUrl = buildUpstreamUrl(config, req.originalUrl);

    try {
      const headers = new Headers();

      copyHeaderIfPresent(req.headers, headers, 'Accept');
      copyHeaderIfPresent(req.headers, headers, 'Content-Type');

      if (config.repoMode === 'private') {
        const token = await getAccessToken(config);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
      }

      const hasBody = !['GET', 'HEAD'].includes(req.method.toUpperCase());
      const rawBody =
        hasBody && req.body && Buffer.isBuffer(req.body) && req.body.length > 0
          ? req.body
          : null;

      const fetchInit: RequestInit = {
        method: req.method,
        headers,
        redirect: 'manual',
      };

      if (rawBody !== null) {
        fetchInit.body = rawBody;
      }

      const upstreamResponse = await fetch(upstreamUrl, fetchInit);

      const responseBody = Buffer.from(await upstreamResponse.arrayBuffer());

      res.status(upstreamResponse.status);

      const contentType = upstreamResponse.headers.get('content-type');
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }

      const contentDisposition =
        upstreamResponse.headers.get('content-disposition');
      if (contentDisposition) {
        res.setHeader('Content-Disposition', contentDisposition);
      }

      const location = upstreamResponse.headers.get('location');
      if (location) {
        res.setHeader('Location', location);
      }

      return res.send(responseBody);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return res.status(502).send({
        message: 'Failed to proxy request to configured SOyA repository',
        error: msg,
        upstream: upstreamUrl,
      });
    }
  });

  return app;
};

const createMainApp = async (config: AppConfig): Promise<Express> => {
  const app = express();

  app.use(
    express.json({
      type: () => true,
    })
  );

  const swaggerDoc = await fs.readFile(
    path.join(getFileRoot(), 'http-openapi.json'),
    { encoding: 'utf-8' }
  );
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(JSON.parse(swaggerDoc)));

  const router = express.Router();
  app.use('/api/v1', router);

  const internalRepoBaseUrl = `http://127.0.0.1:${config.repoProxyPort}`;
  const repoService = new RepoService(internalRepoBaseUrl);
  const soya = new Soya({ service: repoService });

  router.get('/version', async (_, res) => {
    const content = await fs.readFile(
      path.join(getFileRoot(), 'package.json'),
      { encoding: 'utf-8' }
    );
    const packageJson = JSON.parse(content) as {
      name: string;
      version: string;
      dependencies?: Record<string, string>;
    };

    return res.status(200).send({
      name: packageJson.name,
      version: packageJson.version,
      soyaJsVersion: packageJson.dependencies?.['soya-js'] ?? null,
      repo: {
        baseUrl: config.repoBaseUrl,
        mode: config.repoMode,
        internalProxyBaseUrl: internalRepoBaseUrl,
      },
    });
  });

  router.get('/form/:schemaDri', async (req, res) => {
    const schemaDri = req.params['schemaDri'];

    try {
      const soyaDoc = await soya.pull(schemaDri);
      const form = await soya.getForm(soyaDoc, {
        language: req.query['language'] as string,
        tag: req.query['tag'] as string,
      });

      return res.status(200).send(form);
    } catch (e: unknown) {
      return res.status(500).send(String(e));
    }
  });

  router.post('/validate/jsonld', async (req, res) => {
    const content = req.body;

    if (!content) {
      return res.status(400).send();
    }

    try {
      await soya.toCanonical(content);
      return res.status(200).send({ message: 'Validation success' });
    } catch (e: unknown) {
      console.dir(e);
      return res.status(400).send({ message: String(e), error: e });
    }
  });

  router.post('/validate/:schemaDri', async (req, res) => {
    const content = req.body;
    const schemaDri = req.params['schemaDri'];

    if (!schemaDri || !content) {
      return res.status(400).send();
    }

    try {
      const soyaDoc = await soya.pull(schemaDri);
      const resVal = await new Overlays.SoyaValidate().run(soyaDoc, content);

      return res.status(200).send(resVal.data);
    } catch (e: unknown) {
      return res.status(500).send(String(e));
    }
  });

  router.post('/transform/:schemaDri', async (req, res) => {
    const content = req.body;
    const schemaDri = req.params['schemaDri'];

    if (!schemaDri || !content) {
      return res.status(400).send();
    }

    try {
      const soyaDoc = await soya.pull(schemaDri);
      const resVal = await new Overlays.SoyaTransform().run(soyaDoc, content);

      return res.status(200).send(resVal.data);
    } catch (e: unknown) {
      return res.status(500).send(String(e));
    }
  });

  router.post('/acquire/:schemaDri', async (req, res) => {
    const content = req.body;
    const schemaDri = req.params['schemaDri'];

    if (!schemaDri || !content) {
      return res.status(400).send();
    }

    try {
      const doc = await soya.acquire(schemaDri, content);
      return res.status(200).send(doc);
    } catch (e: unknown) {
      return res.status(500).send(String(e));
    }
  });

  router.get('/map/:from/:to', async (req, res) => {
    const from = req.params['from'];
    const to = req.params['to'];

    if (!from || !to) {
      return res.status(400).send();
    }

    try {
      const fromDoc = await soya.pull(from);
      const toDoc = await soya.pull(to);

      const doc = await soya.map(fromDoc, toDoc);
      return res.status(200).send(doc);
    } catch (e: unknown) {
      return res.status(500).send(String(e));
    }
  });

  router.post('/canonical', async (req, res) => {
    const doc = req.body;

    try {
      const canonical = await soya.toCanonical(doc);
      return res
        .status(200)
        .setHeader('Content-Type', 'text/turtle')
        .send(canonical);
    } catch (e: unknown) {
      console.error(e);
      return res.status(500).send(String(e));
    }
  });

  return app;
};

export const init = async () => {
  const config = getConfig();

  const repoProxyApp = createRepoProxyApp(config);
  const mainApp = await createMainApp(config);

  const repoProxyServer = http.createServer(repoProxyApp);
  const mainServer = http.createServer(mainApp);

  await new Promise<void>((resolve, reject) => {
    repoProxyServer.once('error', reject);
    repoProxyServer.listen(config.repoProxyPort, '127.0.0.1', () => resolve());
  });

  await new Promise<void>((resolve, reject) => {
    mainServer.once('error', reject);
    mainServer.listen(config.port, () => resolve());
  });

  console.log(`SOyA web-cli listening on port ${config.port}`);
  console.log(
    `Internal repository proxy listening on 127.0.0.1:${config.repoProxyPort}`
  );
  console.log(`Configured repository: ${config.repoBaseUrl}`);
  console.log(`Repository mode: ${config.repoMode}`);
};