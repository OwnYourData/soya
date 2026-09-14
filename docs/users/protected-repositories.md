# Protected (Write-Protected) Repositories

The public repository `https://soya.ownyourdata.eu` and most self-hosted
instances are openly readable and writable. Some deployments — for example
`https://soya-did.go-data.at` — run in **protected mode**: writing (and part of
the read API) requires an OAuth 2.0 bearer token.

This page describes what protected mode changes, how the failure looks, how to
obtain a token, and which workflow replaces `soya push` / `soya init-push`
while the CLI has no authentication support.

---

## The Short Version

| Question | Answer |
|----------|--------|
| Can `soya push` / `soya init-push` authenticate? | **No.** soya-cli (as of 0.18.1) has no token option, no config file and no environment variable for credentials. |
| How do I publish anyway? | Fetch a token from `/oauth/token` (client credentials) and `POST` the document to `/api/data` yourself — see [Publishing without the CLI](#publishing-without-the-cli). |
| Where do credentials come from? | From `GET /soya/register` on the repository, or from the repository's administrator. |
| What still works without a token? | `soya pull` (by name, tag or DRI, including `--type=yaml`). Reads of structures are not protected. |

---

## How a Protected Repository Announces Itself

Every repository publishes its mode at `/api/active`:

```bash
curl -s https://soya-did.go-data.at/api/active
```

```json
{"active":true,"auth":true,"repos":false}
```

`"auth": true` means the `/api/*` endpoints are behind Doorkeeper (the OAuth 2.0
provider used by the repository). On the public repository the same call returns
`"auth": false`.

---

## What the Failure Looks Like

Pushing to a protected repository fails during the `POST /api/data` step:

```console
$ cat person.yaml | soya init-push --repo https://soya-did.go-data.at
POST https://soya-did.go-data.at/api/data failed: 401
Could not push SOyA document
```

The response carries the Doorkeeper signature:

```http
HTTP/2 401
www-authenticate: Bearer realm="Doorkeeper", error="invalid_token", error_description="The access token is invalid"

{"error":"Not authorized"}
```

The same 401 body and header appear for a **missing**, an **expired** and a
**revoked** token — the repository does not distinguish these cases. If you sent
a token and still get `invalid_token`, request a fresh one before looking for
other causes.

A related error comes from the token endpoint itself and means something
different:

| Response from `/oauth/token` | Meaning |
|------------------------------|---------|
| `400` with `{"error":"invalid_request"}` | Required parameters are missing (this is also what an empty `POST /oauth/token` returns — the endpoint exists). |
| `401` with `{"error":"invalid_client"}` | `client_id` / `client_secret` are unknown, wrong or were not sent. |
| `400` with `{"error":"unsupported_grant_type"}` | Wrong `grant_type` — the repository accepts `client_credentials`. |

---

## Which Operations Need a Token

Authentication applies to the `/api/*` routes only. Resolving a structure by
name, tag or DRI is handled by a separate, unprotected controller.

| CLI command | Endpoint | Protected? |
|-------------|----------|------------|
| `soya pull <name \| DRI>` | `GET /<name>` | no |
| `soya pull <name> --type=yaml` | `GET /<name>/yaml` | no |
| `soya push`, `soya init-push` | `POST /api/data` | **yes** |
| `soya query` | `GET /api/soya/query` | **yes** |
| `soya info` | `POST /api/soya/info` | **yes** |
| `soya similar` | `POST /api/soya/similar` | **yes** |

So on a protected repository `soya pull` keeps working unchanged, while
publishing and discovery return `401`.

---

## Obtaining Credentials

Each user of a repository owns one OAuth application; its `uid` / `secret` pair
is the **APP_KEY / APP_SECRET**.

**Self-service.** If registration is open, `GET /soya/register` shows a form
asking for organization, user name (letters, digits, `.`, `_`, `-`) and an
optional full name. On submit the repository creates the organization (if
needed), the user and the OAuth application, and displays **APP_KEY and
APP_SECRET exactly once**. Store them immediately — the secret cannot be
retrieved later.

**Closed deployments.** With `REGISTRATION=closed` the form redirects to `/` and
credentials are issued by the administrator. New users receive the scopes from
`USER_SCOPES` (default `read write`); publishing requires `write`.

See [`User Management`](../maintainers/user-management.md) for the
administrative side.

---

## Obtaining a Token

The repository accepts the OAuth 2.0 **client credentials** grant:

```bash
export REPO=https://soya-did.go-data.at
export APP_KEY=<uid from registration>
export APP_SECRET=<secret from registration>

export TOKEN=$(curl -s -X POST "$REPO/oauth/token" \
  -d grant_type=client_credentials \
  -d client_id="$APP_KEY" \
  -d client_secret="$APP_SECRET" | jq -r '.access_token')
```

The endpoint also accepts a JSON body (`{"grant_type":"client_credentials",
"client_id":"...","client_secret":"..."}`); all three fields are required. The
response is a standard token document:

```json
{"access_token":"...","token_type":"Bearer","expires_in":7200,"created_at":1789000000,"username":"..."}
```

Tokens expire (`expires_in`); this grant issues no refresh token — request a new
one when calls start returning `invalid_token`. Two companion endpoints help
while debugging:

```bash
curl -s "$REPO/oauth/token/info" -H "Authorization: Bearer $TOKEN"
curl -s -X POST "$REPO/oauth/revoke" \
  -d token="$TOKEN" -d client_id="$APP_KEY" -d client_secret="$APP_SECRET"
```

`/oauth/token/info` returns the token's scopes and expiry, and answers `401`
with `{"error":"invalid_token", ...}` once it is no longer valid — the quickest
way to tell an expired token from a wrong request. `/oauth/revoke` invalidates a
token and needs the client credentials alongside it (without them it answers
`403 unauthorized_client`). Both are described in the repository's OpenAPI
definition (`repo2/swagger/v1/swagger.yml`).

---

## Publishing without the CLI

`soya init-push` performs three steps: it compiles the YAML to JSON-LD, posts
the result to `/api/data`, and reads the created item back to print its DRI. Only
the compilation step needs the CLI — the rest is a plain HTTP request you can
make yourself with a bearer token.

**1 — Compile the YAML locally** (no repository contact, works offline):

```bash
cat person.yaml | soya init --repo "$REPO" > person.jsonld
```

Passing `--repo` matters: the repository URL ends up in the `@base` of the
generated document, so compiling against the default repository and pushing to
another one produces a structure with the wrong base IRI.

**2 — Build the request body.** The CLI posts exactly this shape, and
`init-push` adds `soya_yaml`:

```bash
jq -n \
  --slurpfile data person.jsonld \
  --rawfile yaml person.yaml \
  '{data: $data[0], mimeType: "application/json", soya_yaml: $yaml}' \
  > push.json
```

**3 — Post it with the token:**

```bash
curl -s -X POST "$REPO/api/data" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data @push.json
```

The response contains the `id` and `dri` of the stored structure:

```json
{"id":42,"dri":"zQm..."}
```

**4 — Verify:**

```bash
curl -s "$REPO/MockPerson" | head
curl -s "$REPO/MockPerson/yaml"
```

### The `soya_yaml` field is what keeps `--type=yaml` working

`soya push` sends only `data` and `mimeType`; `soya init-push` additionally
sends `soya_yaml` with the untouched YAML source, and that is the **only**
reason `soya pull <name> --type=yaml` can return the original file later.

If you omit `soya_yaml` in the manual request, the structure is published
correctly, but:

* `soya pull <name> --type=yaml` returns nothing for it,
* `soya info <name>` reports `yaml: false` for that version,
* the YAML view in the web frontend stays empty.

This is the one behavioural difference between the manual route and
`init-push` — and including `soya_yaml` as shown above removes it. Pass the YAML
byte-for-byte as it was compiled; a re-indented or re-serialized copy will be
stored and handed back later instead of your source file.

---

## Using `soya-js` Instead

For an application rather than a shell script, the library is the better entry
point. `RepoService` supports three authentication modes — `false` (never send
auth), `'optional'` (send a token if one is available) and `true` (require one)
— and `RepoService.fromSemcon(semcon)` defaults to `'optional'`:

```ts
import { RepoService, Soya } from 'soya-js';
import { Semcon } from 'semcon-js';

const semcon = new Semcon(process.env.REPO!);
await semcon.initialize();

const soya = new Soya({ service: RepoService.fromSemcon(semcon, true) });
```

Note the current limitation: the bundled `semcon-js` (0.4.0) implements the
authorization-code/OIDC flows in its `_authorize()` step, **not** the client
credentials grant — passing `APP_KEY`/`APP_SECRET` as `credentials` does not
produce a token. Until that is added, obtain the token as shown above and inject
it through a custom network adapter (`semcon.setNetworkAdapter(...)`) that adds
the `Authorization: Bearer` header, or use the plain HTTP route.

The CLI does not offer this at all: it constructs its repository service as
`new RepoService(repo)`, which keeps the default mode `false`, so `POST
/api/data` never carries an `Authorization` header even if a token has been
issued in the same session.

---

## What to Keep in Mind

* A repository is protected when `/api/active` reports `"auth": true`.
* soya-cli 0.18.1 **cannot** authenticate — there is no flag, environment
  variable or config file for credentials; this is a known gap, not a
  misconfiguration on your side.
* `401` + `www-authenticate: Bearer realm="Doorkeeper", error="invalid_token"`
  means missing, expired or revoked token.
* Credentials come from `GET /soya/register` (shown once) or the administrator;
  tokens come from `POST /oauth/token` with `grant_type=client_credentials`.
* Publish manually with `soya init` + `curl POST /api/data`, and include
  `soya_yaml` so `soya pull --type=yaml` keeps working.
* `soya pull` needs no token; `push`, `query`, `info` and `similar` do.

---

## What to do next

→ Back to [`Repository Usage`](repository.md), or see
[`User Management`](../maintainers/user-management.md) for issuing credentials
on your own deployment.
