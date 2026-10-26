# soya-cli (Developer View)

The SOyA CLI is a thin wrapper around [`soya-js`](soya-js.md). Sources:
[`cli2/`](../../cli2) (Node 24 stack, ≥ 0.18) — legacy Node 16 version in
[`cli/`](../../cli). Both provide the binary `soya`.

Most commands read from **stdin** and write results to **stdout**, so they can
be freely combined in pipes:

```bash
soya template base | soya init | soya push
```

---

## Commands

| Command | Input (stdin) | Description |
|---------|---------------|-------------|
| `template <name>` | — | Prints a predefined YAML template (`base`, `validation`, `transformation.jq`, `transformation.handlebars`, `transformation.senml`, `annotation`, `alignment`, `classification`, `encoding`, `form`, `format`, ...). |
| `init` | YAML | Converts a SOyA YAML structure to JSON-LD. |
| `push` | JSON-LD | Pushes a document/instance to the repository, prints the DRI. |
| `init-push` | YAML | `init` + `push`; additionally stores the original YAML in the repository. |
| `pull <name \| DRI>` | — | Pulls a structure; `--type=yaml` fetches the original YAML. |
| `query [name]` | — | Lists structures in the repository. |
| `info <name \| DRI>` | — | Prints name, DRI, history, bases, and overlays. |
| `similar` | JSON-LD | Finds similarly shaped structures. |
| `calculate-dri` | JSON(-LD) | Canonicalizes the input and prints its DRI. |
| `canonical` | JSON-LD | Prints the canonical (URDNA2015) form. |
| `acquire <name \| DRI>` | flat JSON | Transforms flat JSON into JSON-LD guided by the structure. |
| `validate <name \| DRI>` | JSON-LD | SHACL validation against a validation overlay. |
| `transform <name \| DRI>` | JSON | Applies a transformation overlay (`jq`, `handlebars`, or `senml`). |
| `form` | JSON-LD | Generates a JSON Forms schema + UI schema (`--language`, `--tag`). |
| `map <target> <source>` | — | Derives a Handlebars mapping template from alignment overlays: keys follow the first structure, placeholders reference attributes of the second. |
| `playground` | JSON-LD | Opens the JSON-LD playground with the input document. |

### Global options

* `--repo <url>` / `-r` — SOyA repository to use (default: `https://soya.ownyourdata.eu`)
* `--verbose` / `-v` … `-vvvv` — log level (error → warn → info → debug → silly); logs go to stderr
* `--help` / `-h`, `--version`

> **Removed in 0.18 (Node 24 stack):** `soya transform --executable` — this
> existed only to point at an external JOLT binary; JOLT is no longer supported.

---

## Authentication / Protected Repositories

**The CLI does not authenticate.** `cli2/src/index.ts` builds its repository
service as `new RepoService(repo)`, and `RepoServiceConfig.defaultAuth` defaults
to `false` — "never send auth". Every write therefore leaves the CLI without an
`Authorization` header, and there is no flag, environment variable or
configuration file to supply a token, client credentials or a repository user.

Against a repository whose `/api/active` reports `"auth": true`, this surfaces as:

```console
$ cat person.yaml | soya init-push --repo https://soya-did.go-data.at
POST https://soya-did.go-data.at/api/data failed: 401
Could not push SOyA document
```

```http
www-authenticate: Bearer realm="Doorkeeper", error="invalid_token"
{"error":"Not authorized"}
```

Two details are worth knowing when debugging this:

* Only the `/api/*` routes are behind Doorkeeper. Resolving a structure
  (`GET /<name>`, `/<name>/yaml`, `/<name>/info`) is served by an unprotected
  controller, so `soya pull` succeeds while `push`, `query`, `info` and
  `similar` return `401`.
* When `/api/active` reports `"auth": true`, `semcon-js` does issue a
  `POST /oauth/token` — but with an **empty body**, because its `_authorize()`
  only fills a request body for the authorization-code/OIDC flows. The client
  credentials grant is not implemented in `semcon-js` 0.4.0, which is why
  passing `APP_KEY`/`APP_SECRET` as `credentials` does not yield a token.

The supported workaround, and the shape of the request the CLI would have sent
(`{data, mimeType, soya_yaml}` to `POST /api/data`), are documented in
[`Protected Repositories`](../users/protected-repositories.md). The design for
removing the workaround — `--token` / `--client-id` / `--client-secret`,
`SOYA_*` environment variables, `~/.soya/credentials.json`, and the
client-credentials path in `semcon-js` — is specified in
[`CLI Authentication (Design)`](cli-authentication.md).

---

## Testing

The CLI is verified with an end-to-end pytest suite in
[`cli2/docker/pytest/`](../../cli2/docker/pytest) that pipes documents through
the real binary against a live repository:

```bash
cd cli2/docker/pytest
pip install -r requirements.txt
REPO=https://soya.ownyourdata.eu pytest
```

* `test_general.py` — push/pull/validate/acquire/info round-trips (`01_*`)
* `test_init.py` — YAML → JSON-LD conversion against expected outputs (`03_*`)
* `test_validation.py` — acquire+validate pipelines (`04_*`)
* `test_validation_local.py` — `soya init` + `soya validate` against a structure compiled from YAML and served by a local HTTP server (`05_*`; nothing is published)
* `test_usecases.py` — senml transform + soya-web-cli HTTP API (`02_*`; use `WEBCLI=<url>` for a local instance)
* `test_tutorial.py` — tutorial examples (needs access to the playground service)

The tests compare **exact stdout**, so they are sensitive to formatting and to
dependency-version changes in validation reports (blank-node labels). When a
dependency upgrade changes non-semantic output details, regenerate the affected
expected files and review the diff (see
[migration-node24.md](migration-node24.md) for examples).

The same applies to **live repository data**: several expected files mirror
structures stored on the live repo (e.g. `Did`). Whenever such a structure is
changed deliberately, run the pytest suite and regenerate the affected
expected files (reviewing the diff) — those failures are data maintenance,
not client bugs.
