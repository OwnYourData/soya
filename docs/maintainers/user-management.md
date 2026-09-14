# User Management

The SOyA repository (`repo2/`) provides a lightweight user management on top
of OAuth 2.0 client-credentials (Doorkeeper). It is used to attribute pushed
structures to an author and to control write access on non-public deployments.

## Concepts

| Entity | Purpose |
|--------|---------|
| **Organization** | Groups users; created on demand during registration. |
| **User** | Belongs to one organization (`name` is unique per organization); carries an optional `full_name`; soft-deleted via the `deleted` flag. |
| **OAuth application** (Doorkeeper) | One per user — its `uid`/`secret` are the user's **APP_KEY / APP_SECRET**; linked to the organization via `organization_id`. |

Authentication is the standard client-credentials flow:

```bash
curl -X POST https://<repo>/oauth/token \
  -d grant_type=client_credentials \
  -d client_id=$APP_KEY \
  -d client_secret=$APP_SECRET
# -> { "access_token": "...", ... }
```

Pushed structures are attributed to the authenticated user via a write hook
(`Store.user_id`), and `GET /api/data/:id` reports the author and organization.

## Web UI

### Registration — `GET /soya/register`

A public form asking for **organization**, **user name** (letters, digits,
`.` `_` `-`; unique within the organization), and an optional **full name**.
Submitting (`POST /soya/register`):

1. reuses or creates the `Organization`,
2. creates the `User`,
3. creates the user's Doorkeeper application with the default scopes,
4. shows **APP_KEY and APP_SECRET exactly once** — they must be stored by the
   user; the secret is not retrievable later (create a new user if lost).

### Profile — `GET /soya/user`

Requires a bearer token in the `Authorization` cookie (as set after an OAuth
login, e.g. through SOyA-Bud). Shows user name, organization, and scopes, and
offers a form (`POST /soya/user`) to update the **full name**. Unauthenticated
or invalid/expired tokens are redirected to `/`.

## Configuration

| Environment variable | Effect |
|----------------------|--------|
| `AUTH` | Unset or `false`: the `/api/*` endpoints are open. Any other value enables `doorkeeper_authorize! :read, :write, :admin` on `ApiController`, i.e. the repository runs protected. The value is also reported to clients as `auth` in `GET /api/active`. |
| `REGISTRATION=closed` | Disables the registration form and endpoint (both redirect to `/`). Use this for curated deployments where users are created by an administrator. |
| `USER_SCOPES` | Scopes assigned to newly registered users (default: `read write`). |

Enabling `AUTH` protects `POST /api/data` (push), `GET /api/soya/query`,
`POST /api/soya/info` and `POST /api/soya/similar`. It does **not** protect
`DriController` — `GET /<name>`, `/<name>/yaml`, `/<name>/ttl`,
`/<name>/context.jsonld` and `/<name>/info` inherit from `ApplicationController`
and stay readable without a token. Unauthenticated calls to the protected routes
answer `401` with `{"error":"Not authorized"}` and
`www-authenticate: Bearer realm="Doorkeeper", error="invalid_token"`.

Note for users of such a deployment: **soya-cli cannot authenticate** (no token
option, no environment variable, no config file), so publishing has to go
through `/oauth/token` and a direct `POST /api/data`. Point them at
[`Protected Repositories`](../users/protected-repositories.md).

## Administrative notes

- Users are **soft-deleted** (`deleted = true`); helper lookups
  (`doorkeeper_user`) ignore soft-deleted users. Revoking access additionally
  requires destroying (or revoking tokens of) the user's Doorkeeper
  application.
- Organizations are also soft-deletable (`deleted` flag); registration only
  matches non-deleted organizations.
- The relevant code lives in `repo2/app/controllers/static_pages_controller.rb`
  (form actions), `app/helpers/users_helper.rb` (token→user resolution used by
  the write hooks), and the views under `app/views/static_pages/`.
- Database tables come from `db/migrate/*create_users*`,
  `*create_organizations*`, `*add_organization_id_to_application*`, and
  `*add_user_to_stores*`.
