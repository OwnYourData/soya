# Migration to the Node 24 Stack

This document describes the migration of the SOyA JavaScript/TypeScript
components from **Node 16** to **Node ≥ 20 / Node 24** (July 2026) and how the
old and new stacks can be operated side by side during the transition.

---

## Directory layout during the transition

| Component | Legacy (Node 16) | Modernized (Node 24) | npm package |
|-----------|------------------|----------------------|-------------|
| Library   | `lib/`  (soya-js 0.8.x)  | `lib2/`  (soya-js 0.9.x)  | `soya-js` |
| CLI       | `cli/`  (soya-cli 0.17.x) | `cli2/` (soya-cli 0.18.x) | `soya-cli` |
| Web CLI   | `web-cli/` (updated **in place**, 0.5.x) | — | private |
| Forms     | `form/` (updated **in place**, 0.6.x) | — | private |
| SOyA-Bud  | `soyabud/` (**new component**, 0.6.x — extracted from SemCon's DataBud) | — | private |

`web-cli` and `form` were updated in place because they are deployed services
without downstream consumers of their code. `lib` and `cli` are published npm
packages, therefore the modernized versions live in parallel directories until
the migration is validated — afterwards `lib2`/`cli2` are meant to replace
`lib`/`cli`.

**Once the transition is complete:** delete `lib/` and `cli/`, rename
`lib2` → `lib` and `cli2` → `cli`, and change the `soya-js` dependency in
`cli2/package.json` and `web-cli/package.json` from `file:../lib2` back to a
published version (`^0.9.0`).

---

## What changed

### lib2 (soya-js 0.9)

* Node ≥ 20 required (`engines` field), TypeScript 5, ES2022 output.
  The module format remains **CommonJS** — the public API is unchanged.
* **jolt transform engine removed** (`engine: jolt` now raises an error;
  `jq`, `handlebars`, and `senml` remain). The jolt code path shelled out to a
  Java binary and was the only consumer of `utils/core.ts` (`makeTempDir`,
  which also contained a missing-`await` bug on `fs.mkdir`); the file and the
  `find-root` dependency were removed with it.
* Dependency upgrades (all still CommonJS-compatible):
  * `jsonld` 8 → 9, `jsonld-streaming-parser` 2 → 5, `jsonld-streaming-serializer` 1 → 4
  * `rdf-validate-shacl` 0.3 → 0.4.5 (last CJS version; 0.5+ is ESM-only)
  * `js-yaml` 3 → 4 (`load()` is safe-by-default now)
  * `node-jq` 2 → 6 (peer), `axios`/`winston` latest
  * `rdf-ext` stays at 1.x and `sparql-engine` at 0.8.x (newer majors are ESM-only)
  * `@jsonforms/core` 2 → 3 (types for form generation; generated
    schema/ui-schema output is unchanged)
* **`vaultifier` → `semcon-js` (soya-js 0.10):** repository access and DRI
  calculation now use [`semcon-js`](https://github.com/OwnYourData/semcon)
  (successor of vaultifier, fetch-based, minimal dependencies).
  `RepoService.getSemcon()`/`fromSemcon()` replace
  `getVaultifier()`/`fromVaultifier()` (old names kept as deprecated aliases);
  `RepoServiceConfig.semcon` replaces `.vaultifier` (deprecated alias kept).
  DRI generation is byte-identical (verified by golden-vector tests in
  semcon-js and by the pytest suite). semcon-js is consumed from npm
  (`^0.4.0`, published 2026-07-03).
* **`soya map` fixed (soya-js 0.10.1):** alignment values (compact IRIs like
  `oyd_organisation:phone`) ended up as string literals in the RDF graph —
  cross-structure matching failed and invalid IRIs crashed follow-up SPARQL
  queries (`Cannot resolve relative IRI`). Values are now expanded via the
  document's `@context` prefixes before parsing; the mapping query only
  considers actual structure properties (with `rdfs:domain`). See
  `docs/users/transformation.md` → "Deriving Transformations from Alignments".
* ~~npm override `esm` → `esm-wallaby`~~ **(obsolete since soya-js 0.10):**
  the broken `esm` package entered the tree via `vaultifier` → `hashlink`;
  with the switch to semcon-js the whole chain (vaultifier, hashlink, esm,
  libsodium, axios-in-vaultifier) is gone and the override was removed from
  lib2, cli2, and web-cli.

### cli2 (soya-cli 0.18)

* Same runtime/TypeScript baseline as lib2; depends on `soya-js` via `file:../lib2`.
* `soya transform --executable` option removed (jolt-only feature).
* `transformation.jolt` template removed.
* `command-line-args`/`command-line-usage` and `open` intentionally stay on
  their last CommonJS majors.
* Docker image (`cli2/docker/Dockerfile`): Node 24 build stage, jolt/Java
  removed; build context is the repository root (needs `lib2`).

### web-cli (0.5, in place)

* TypeScript 5, `@types/node` 24, Express 4.21, swagger-ui-express 5.
* `soya-js` via `file:../lib2`.
* Fix: request bodies are passed to `fetch` as `Uint8Array` (Buffer is not a
  valid `BodyInit` with @types/node ≥ 22).
* HTTP API (`/api/v1/...`) is unchanged.
* Dockerfiles: node:18 → node:24; since 2026-07-04 the build context is the
  **repository root** (the builder stage compiles `lib2` from source because
  of the `file:../lib2` dependency): `docker build -f web-cli/Dockerfile -t
  oydeu/soya-web-cli .` or `npm run docker` from within `web-cli/`. A root
  `.dockerignore` excludes `node_modules`/`dist`/`tsconfig.tsbuildinfo`
  (a copied tsbuildinfo silently produces empty builds). Once soya-js ≥ 0.10
  is published, this can be simplified back to a single-directory build.

### form (0.6, in place)

* react-scripts 4 → **Vite**, React 17 → 18, TypeScript 5.
* JSON Forms 2.5 → **3.8**; its material renderers require **MUI v7**
  (`@mui/material` + emotion), so Material-UI v4 was replaced accordingly.
* Custom renderers (`MultiSelect`, `SearchAsYouType`) migrated to the JSON
  Forms v3 / MUI v7 APIs; URL parameters, postMessage integration, and runtime
  config behavior are unchanged.
* The unused `soya-js` dependency was removed (the app talks to the repository
  directly via HTTP).
* Build output stays in `build/` so `server.mjs` and the Dockerfile keep working.
* Vendor code splitting via rolldown `advancedChunks` (app/react/jsonforms/mui/
  vendor chunks — group order matters, first match wins) and a Vite dev proxy
  for `/api` → local `server.mjs` (see `form/README.md` for the dev workflow).
* **Default-form generation restored (2026-07-04):** when the soya-js
  dependency was cut from the form app, structures WITHOUT a form overlay
  could no longer be rendered (previously soya-js generated a default form
  client-side). Now `server.mjs` proxies `/api/form/<name>` to a soya-web-cli
  instance (`WEBCLI_BASE_URL` env, default: the deployed one), and the app
  falls back to this generated form when the structure has no usable
  `OverlayForm`.
* **Compact rendering restored (2026-08-07):** JSON Forms 3.x selects its input
  component from the MUI theme (`useThemeProps({ name: 'MuiTextField' })`) and
  defaults to `outlined`, whereas 2.x on MUI v4 defaulted to `standard`
  (underline) — which made every form, and array tables in particular,
  considerably taller. The new `form/src/formTheme.ts` reads `options.variant`
  (`standard` | `outlined` | `filled`) and `options.density`
  (`compact` | `comfortable`) from the root element of a form's UI schema and
  derives a MUI theme from them; `App.tsx` applies it via a nested
  `ThemeProvider` around `<JsonForms/>` only. Defaults are `standard` +
  `compact`, so existing structures render compactly without any change.
  `compact` additionally tightens `TableCell` padding, hides the always-rendered
  but usually empty `FormHelperText` elements of `MaterialTableControl`, and
  shrinks the array toolbar buttons. Documented in `docs/users/forms.md`.

### soyabud (0.6, new component, 2026-07-04)

* **SOyA-Bud is now a standalone component** in this repository — previously
  it was maintained as the `soyabud` variant of SemCon's DataBud. DataBud
  remains in SemCon as the generic Semantic-Container browser; shared fixes
  must be applied to both from now on.
* Extracted from the freshly modernized DataBud state: Vue 2.7 + bootstrap-vue
  built with **Vite** (`@vitejs/plugin-vue2`), TypeScript 5.9, `vaultifier`
  replaced by `semcon-js` (^0.4.0 from npm), `soya-js` via `file:../lib2`
  (0.10.x), E2E-encryption feature removed (not carried over to semcon-js).
* soya-js in the browser: node-only transitive modules are stubbed
  (`src/stubs/` for winston/node-jq/senml, plus node polyfills for the RDF
  dependency chain) — jq/SenML transformations run server-side.
* Standalone changes: package `soya-bud` 0.6.0 (continues the former
  `subVersion` line), `BUDDY_TYPE` deploy switch removed, Docker image
  `oydeu/soya-bud` (via `./build.sh`), nginx-based Dockerfile serving `dist/`.
* Follow-up: the browser bundle is a single ~5.4 MB chunk (soya-js + RDF
  stack + Monaco); vendor chunking analogous to `form/` is advisable.

---

## Interfaces that did NOT change

* **SOyA repository API** (`repo2`): `GET /<name>`, `GET /<name>/info`,
  `GET /api/soya/query`, `POST /api/soya/similar`, `POST /api/soya/info`,
  `POST /api/data` — all calls and payloads are identical.
* **soya-js public API**: all exports (`Soya`, `RepoService`, `Overlays`,
  `Errors`, `getSoyaForm`, …) and their signatures.
* **soya-cli commands** and their stdout formats (verified by pytest), except
  the removed `--executable` option.
* **soya-web-cli HTTP API** (`/api/v1/version|form|validate|transform|acquire|map|canonical`).

---

## Side-by-side testing

Both CLIs provide the binary `soya`, so only one can be linked at a time:

```bash
# new stack
cd lib2 && npm install && npm run build
cd ../cli2 && npm install && npm run build && npm link

# old stack (requires Node 16, e.g. via nvm)
cd cli && npm install && npm run build && npm link
```

Each CLI has its own pytest suite (expected outputs differ slightly, see below):

```bash
cd cli2/docker/pytest          # or cli/docker/pytest for the legacy stack
pip install -r requirements.txt
REPO=https://soya.ownyourdata.eu pytest
```

`test_usecases.py` accepts `WEBCLI=<url>` to run the soya-web-cli tests against
a local instance instead of the deployed one.

### Expected-output changes in `cli2/docker/pytest`

The suite was copied from `cli/docker/pytest` and adapted:

* `01_input/08c-transformation_setup.*` (jolt overlay) and
  `examples/overlay_transformation.jolt.jsonld` removed.
* `03_output/05_CardinalitySet.jsonld` and `examples/overlay_validation.jsonld`
  regenerated: the expected files predated the current `yaml2soya` overlay
  handling (`sh:path` list-paths for `set<>` cardinalities, explicit
  `sh:minCount: 0`/`sh:minLength: 0` for open ranges).
* `04_output/*.json` regenerated: `rdf-validate-shacl` 0.4 produces different
  (non-semantic) blank-node labels (`df_0_1` vs. `df_2_1`) in validation
  reports. Semantics (`isValid`, messages, severities) are identical.
* `02_input/*.cmd` now use `$WEBCLI` instead of the hard-coded deployed
  soya-web-cli URL.

---

## Known follow-ups

* `sparql-engine` 0.8 is unmaintained; a future migration to Comunica would
  allow upgrading `rdf-ext`/`rdf-validate-shacl` to their ESM-only majors
  (which implies switching soya-js to ESM — a breaking change for consumers).
  Decision 2026-07-04: keep as-is; act on security advisories, SHACL feature
  needs, or as part of a planned ESM major. The SPARQL usage is fully
  encapsulated in `lib2/src/utils/sparql.ts` and covered end-to-end by the
  pytest suite, so a later swap is well contained.

Resolved follow-ups (vaultifier → semcon-js replacement, the repaired
`/api/soya/similar` endpoint, realignment of pytest expected files after the
intentional `Did` structure change) are documented in the sections above and
in the READMEs next to the affected tests
(`cli2/docker/pytest/01_input/README_similar.md`,
`cli2/docker/pytest/02_input/README_invalid_shacl.md`).
