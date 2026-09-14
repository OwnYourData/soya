# CLI Authentication for Protected Repositories (Design)

> **Status: planned, not implemented.** Nothing described here exists in
> soya-cli 0.18.1 / soya-js 0.10.1 / semcon-js 0.4.0 yet. The current, purely
> manual workaround is documented in
> [`Protected Repositories`](../users/protected-repositories.md).
>
> **Scope:** `cli2/`, `lib2/`, `web-cli/` and the external `semcon-js`
> repository. The Node 16 branch (`cli/`, `lib/`) is explicitly out of scope.

## Goal

`soya push`, `soya init-push`, `soya query`, `soya info`, `soya similar` and
`soya delete` must work against a repository whose `/api/active` reports
`"auth": true`, using OAuth 2.0 client credentials or a pre-issued bearer
token — without changing the behaviour of the public repository in any way.

Secondary goal, and arguably the more valuable half: a failed or missing
authentication must produce a message that names the cause. Today the only
signal is `POST https://…/api/data failed: 401`.

### Non-goals

* No authorization-code / interactive browser login in the CLI (that is
  soyabud's job).
* No credential storage helper (`soya login`) in the first iteration.
* No token cache on disk — see [Decisions](#decisions).

---

## Current State

Three layers are involved; the blocker sits in the lowest one.

### semcon-js 0.4.0 — no client credentials

`Semcon._authorize()` only builds a request body for the authorization-code
and OIDC flows. `SemconCredentials` has `clientId`, `authorizationCode`,
`state` and `scope` — there is no `clientSecret`, and no branch for
`grant_type=client_credentials` even though `OAuthType.CLIENT_CREDENTIALS`
is defined in `interfaces.ts`.

Two defects sit next to it:

1. `let body;` stays `undefined` when no authorization code is present, so the
   library sends an **empty** `POST /oauth/token`. This is what makes a
   protected repository answer `400` at the token endpoint during an ordinary
   `soya init-push`.
2. Still in that path, `if (this.options.credentials?.scope) body.scope = …`
   would throw a `TypeError` on the undefined body.

There is also no public way to hand a ready-made token to the library:
`Communicator.setTokenCallback()` is reachable only through the private
`communicator` field of `Semcon`.

### semcon-js 0.4.0 — 401 handling is dead code

`Communicator._placeNetworkCall()` contains a retry that refreshes the token
once on `401` and maps a final `401` to `UnauthorizedError`. With the built-in
network adapter neither branch can ever run: the adapter throws
``new Error(`POST ${url} failed: ${res.status}`)`` on `!res.ok`, the thrown
error carries no `response`, and `_placeNetworkCall` therefore hits
`if (!nro.response) throw nro.error` first.

This is the direct cause of the unhelpful error message, and fixing it also
enables automatic recovery from an expired token.

### soya-js 0.10.1 — capable, but not reachable

`RepoService` already supports the three modes that are needed:
`defaultAuth: false | true | 'optional'` (`lib2/src/services/repo.ts`), and
`RepoService.fromSemcon(semcon, 'optional')` exists. What is missing is a
factory that accepts credentials directly, so that a caller does not have to
depend on `semcon-js` — `soya-js` does not re-export `Semcon`
(`lib2/src/index.ts`).

Two smaller issues:

* `RepoService.getSemcon()` swallows initialization failures with `catch { }`.
  A wrong client secret therefore produces no message at all, only a later,
  unexplained `401`.
* `Soya.push()` (`lib2/src/soya.ts`) creates a second `RepoService` when an
  instance targets a different repository and forwards only `defaultAuth`, not
  the credentials.

### soya-cli 0.18.1 — no surface

`cli2/src/index.ts` builds `new RepoService(repo)`, which keeps the default
mode `false` ("never send auth"), so `POST /api/data` never carries an
`Authorization` header even if a token exists in the same process.
`globalDefinition` in `cli2/src/utils/cmd.ts` defines only `default`, `repo`,
`verbose`, `help` and `version`. `semcon-js` is not a dependency of `cli2`.

### Server — nothing to do

Doorkeeper is configured and the client-credentials grant is active. Verified
against `https://soya-did.go-data.at` (2026-09-13): `/api/active` returns
`{"active":true,"auth":true,"repos":false}`; `grant_type=client_credentials`
with unknown credentials returns `401 invalid_client`, while
`grant_type=password` returns `400 unsupported_grant_type`. Credentials are
issued through `GET /soya/register` or by an administrator, see
[`User Management`](../maintainers/user-management.md).

### Prior art inside this repository

`web-cli/src/server.ts` already implements the whole token flow: mode
detection (`REPO_AUTH_MODE`), form-encoded `client_credentials` request, a
token cache with a 30-second margin before expiry, single-flight de-duplication
via `pendingTokenRequest`, and header injection in a local reverse proxy in
front of the repository. It is roughly 120 lines and it is correct — it simply
lives one layer too high. That web-cli had to put a proxy in front of the
repository at all is the clearest evidence that the capability belongs in the
library.

---

## Target Architecture

**Token handling moves down into `semcon-js`; the CLI only contributes
options.** Consequences: `soya-js` gains one factory, the CLI gains three
flags, soyabud keeps working unchanged, and web-cli can eventually drop its
proxy.

The rejected alternative was to obtain the token in the CLI and inject it with
`Semcon.setNetworkAdapter()`. It avoids touching `semcon-js`, but it bypasses
the library's token lifecycle (no refresh on 401), adds a `semcon-js`
dependency to `cli2`, and would leave soyabud and web-cli with their own
separate implementations. Since `semcon-js` is OwnYourData's own package
(`github.com/OwnYourData/semcon`), there is no reason to work around it.

---

## Changes per Package

### 1. semcon-js (external repository, critical path)

* Extend `SemconCredentials` with `clientSecret?: string`.
* Add a `client_credentials` branch to `_authorize()`: when `clientId` and
  `clientSecret` are set and no `authorizationCode` is present, post
  `grant_type=client_credentials`, `client_id`, `client_secret` and the
  optional `scope` to `urls.token` as
  `application/x-www-form-urlencoded`. Doorkeeper accepts JSON as well, but
  form encoding is what web-cli proved against the live repository.
* Fix the `undefined` body: bail out with a clear error instead of sending an
  empty request when no flow can be satisfied.
* Add a public `setToken(token: string)` on `Semcon` for pre-issued tokens
  (the `--token` path), so the private `Communicator` stays private.
* Make the built-in network adapter attach `status`, the response body and the
  `www-authenticate` header to the thrown error. This revives the existing
  401-refresh/`UnauthorizedError` logic in `_placeNetworkCall()` and is a
  prerequisite for every error message below.
* Surface token-endpoint failures (`invalid_client`, `invalid_scope`) instead
  of collapsing them into a bare `UnauthorizedError`.

### 2. soya-js (`lib2/`)

* New factory:

  ```ts
  RepoService.fromCredentials(
    repo: string,
    credentials: { token: string } | { clientId: string, clientSecret: string, scope?: string },
    defaultAuth: MaybeAuthenticated = 'optional',
  ): RepoService
  ```

  It constructs and initializes the `Semcon` internally, so callers never need
  a `semcon-js` import.
* `getSemcon()` must not swallow initialization errors when credentials were
  supplied — otherwise a wrong secret is indistinguishable from no
  authentication at all.
* `Soya.push()` must forward credentials, not only `defaultAuth`, when it
  builds the secondary `RepoService` for a cross-repository instance push.
* Add `AuthenticationError` to `lib2/src/errors.ts` so integrators can branch
  on it.

### 3. soya-cli (`cli2/`)

* Three new entries in `globalDefinition` (`cli2/src/utils/cmd.ts`):
  `--token`, `--client-id`, `--client-secret`, plus `--auth`.
* Credential resolution in `cli2/src/index.ts` before the `RepoService` is
  built; `new RepoService(repo)` becomes `RepoService.fromCredentials(...)`
  when credentials were resolved, and stays as it is otherwise.
* A `~/.soya/credentials.json` reader.
* The error messages listed below.
* `getGeneralOptions()` shows the new flags in every help page automatically,
  since it renders `globalDefinition`.

### 4. web-cli

`getConfig()` reads `SOYA_TOKEN`, `SOYA_CLIENT_ID`, `SOYA_CLIENT_SECRET`,
`SOYA_SCOPE` first and falls back to the existing `OAUTH_TOKEN_URL`,
`OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `OAUTH_SCOPE`, `OAUTH_AUDIENCE`, so
deployed containers keep working unchanged. `REPO_AUTH_MODE`, `REPO_BASE_URL`
and `SOYA_REPO` stay as they are. Replacing the internal proxy with
`RepoService.fromCredentials()` is a follow-up, not part of this change.

---

## Configuration

| Purpose | CLI flag | Environment variable | Config file key |
|---------|----------|----------------------|-----------------|
| Pre-issued bearer token | `--token` | `SOYA_TOKEN` | `token` |
| OAuth client id (APP_KEY) | `--client-id` | `SOYA_CLIENT_ID` | `clientId` |
| OAuth client secret (APP_SECRET) | `--client-secret` | `SOYA_CLIENT_SECRET` | `clientSecret` |
| Requested scope | — | `SOYA_SCOPE` | `scope` |
| Repository | `--repo` / `-r` | `SOYA_REPO` | (map key) |
| Authentication mode | `--auth` | — | — |

**Resolution order**, evaluated per field: CLI flag → environment variable →
config file → unset. If a token is resolved from any source, it wins over
client credentials; the CLI then makes no token request at all.

### Config file

`~/.soya/credentials.json`, one entry per repository so that the public and a
protected repository can be used from the same shell:

```json
{
  "https://soya-did.go-data.at": {
    "clientId": "…",
    "clientSecret": "…"
  },
  "https://soya.example.org": {
    "token": "…"
  }
}
```

The lookup key is the effective `--repo` URL with trailing slashes removed
(`normalizeBaseUrl()` in `web-cli/src/server.ts` already does exactly this and
should be shared). A missing file is not an error. If the file is readable by
group or others, the CLI warns on stderr but continues.

### Authentication mode

`--auth` maps onto `RepoService`'s existing three-valued `defaultAuth`:

| Credentials resolved | `--auth` | `defaultAuth` | Behaviour |
|----------------------|----------|---------------|-----------|
| no | *(omitted)* | `false` | exactly as today — public repositories are unaffected |
| no | `required` | — | fails immediately with "no credentials configured" |
| yes | *(omitted)* | `'optional'` | token is sent where the repository asks for it |
| yes | `optional` | `'optional'` | same, explicit |
| yes | `required` | `true` | every repository call must be authenticated |

`required` exists for deployments that will also protect **reads**. No such
deployment exists today — every current instance leaves `DriController` open,
so `soya pull` works without a token — but the mode is built in now rather than
retrofitted through three packages later.

### Security

`--client-secret` and `--token` are visible in `ps` output and in shell
history. The help text must mark them as intended for CI and non-interactive
use, and point to the environment variables or the config file otherwise. The
CLI must never log a token or secret, not even at `-vvvv`; `logger.debug` calls
that dump request bodies have to redact them.

---

## Error Messages

The table lists the message the CLI must emit; today every one of these cases
produces the same `POST https://…/api/data failed: 401`.

| Situation | Message |
|-----------|---------|
| `401`, no credentials configured | `Repository requires authentication (401 invalid_token). No credentials configured — use --token or --client-id/--client-secret, or set SOYA_TOKEN. See docs/users/protected-repositories.md` |
| `401` although a token was sent, refresh failed | `Authentication rejected by <repo> (401 invalid_token). The token is expired or revoked.` |
| Token endpoint `401 invalid_client` | `Token request rejected by <repo>: invalid_client. Check SOYA_CLIENT_ID / SOYA_CLIENT_SECRET.` |
| Token endpoint unreachable | `Could not reach the token endpoint <repo>/oauth/token: <cause>` |
| `--auth required` without credentials | `--auth required needs credentials; none were configured.` |
| Scope insufficient (`403`) | `Repository accepted the token but denied the operation (403). The credentials likely lack the "write" scope.` |

All of them keep the existing failure path (`exitWithError`, exit code 255).
Introducing a distinct exit code for authentication failures is listed under
open points, because the pytest suite asserts on the current behaviour.

---

## Reach

Everything that goes through `RepoService` is covered automatically:
`push`, `init-push`, `query`, `info`, `similar`, `delete`. `pull` continues to
work without credentials and simply carries the token when one is present.

---

## Testing

**semcon-js** — unit tests against a local mock HTTP server: `/api/active`
returning `auth: true`, a `/oauth/token` that asserts
`grant_type=client_credentials` and form encoding, and a `/api/data` that
returns `401` once and `200` afterwards to exercise the revived refresh path.

**soya-cli** — the pytest suite in `cli2/docker/pytest` currently targets a
live repository through the `REPO` environment variable. Add a second target
(`REPO_PRIVATE` plus `SOYA_CLIENT_ID` / `SOYA_CLIENT_SECRET`) and four cases:

1. `init-push` without credentials → non-zero exit and the message from the
   table above,
2. `init-push` with credentials → DRI on stdout, and `pull --type=yaml`
   returns the original YAML (i.e. `soya_yaml` still travels),
3. `pull` without credentials against the protected repository → succeeds,
4. expired token → transparent refresh instead of failure.

Tests skip when `REPO_PRIVATE` is unset, so the suite stays runnable against
the public repository alone.

---

## Documentation Follow-up

* [`Protected Repositories`](../users/protected-repositories.md): the CLI
  becomes the main path, the manual `curl` route stays as the fallback for
  older CLI versions.
* [`CLI (Developer View)`](cli.md): the new options in the global option list,
  and the "Authentication / Protected Repositories" section rewritten from
  "cannot" to "how".
* [`Repository Usage`](../users/repository.md) and [`FAQ`](../users/faq.md): remove the
  "the CLI has no authentication flags" statements.
* [`Documentation Playbook`](../maintainers/documentation.md): add a source of
  truth row for authentication.

---

## Release Order

`semcon-js` → npm, then `lib2/` (`soya-js`, which depends on `semcon-js` via
`^0.4.0`), then `cli2/` (which depends on `soya-js` via `file:../lib2`). The
`semcon-js` publication is the critical path; nothing downstream can ship
before it.

Rough effort: about one day for `semcon-js` including tests, half a day for
`soya-js`, half to one day for the CLI (options, config file, help texts,
messages), half to one day for tests and documentation.

---

## Decisions

Taken 2026-09-13, after the analysis of the current state:

| Question | Decision |
|----------|----------|
| Environment variable naming | `SOYA_*`, consistent with the already existing `SOYA_REPO`. |
| web-cli compatibility | Keeps its `OAUTH_*` names as a fallback; `SOYA_*` takes precedence. No breaking change for deployed containers. |
| Read-protected repositories | None exist today, but they are planned — therefore the three-valued `--auth` is implemented now instead of being retrofitted. |
| Token cache on disk | No. One token request per CLI invocation; an in-process cache is enough. A file holding a valid bearer token is not worth the saved round-trip. |
| Node 16 branch (`cli/`, `lib/`) | Out of scope. |

Rejected alternatives: obtaining the token in the CLI and injecting it via
`Semcon.setNetworkAdapter()` (bypasses the token lifecycle, duplicates logic
across CLI, soyabud and web-cli); a `soya login` subcommand writing a token
file (follows from the no-disk-cache decision).

---

## Open Points

* A dedicated exit code for authentication failures would let scripts
  distinguish "wrong credentials" from "malformed document", but the pytest
  suite asserts on the current behaviour — decide together with the test
  update.
* Doorkeeper's token lifetime for the deployed instances is configured in the
  base image, not in `repo2/`. The refresh logic does not depend on the value,
  but the documentation should state it.
* Whether `web-cli` drops its internal proxy in favour of
  `RepoService.fromCredentials()` once the library can authenticate — a
  follow-up with its own risk profile.
* Whether `soya-js` should re-export `Semcon` so that integrators can build
  advanced flows without a second dependency.
