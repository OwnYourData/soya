# soya-js Library (Developer View)

`soya-js` is the core library of the SOyA ecosystem. All other JavaScript-based
components (CLI, web-cli) delegate their logic to it. Sources:
[`lib2/`](../../lib2) (Node 24 stack, ≥ 0.9) — legacy Node 16 version in
[`lib/`](../../lib).

The library is written in TypeScript and published as a **CommonJS** package,
so it can be consumed with both `require()` and `import`.

```bash
npm install soya-js
```

---

## Entry point: the `Soya` class

```typescript
import { Soya, RepoService } from 'soya-js';

// default repository (https://soya.ownyourdata.eu)
const soya = new Soya();

// custom repository and/or custom logger
const soya = new Soya({
  service: new RepoService('https://my-repo.example.com'),
  logger: myWinstonLikeLogger,
});
```

### Methods

| Method | Description |
|--------|-------------|
| `init(yaml)` | Converts a SOyA YAML structure into its JSON-LD representation (`yaml2soya`). |
| `pull(path, options?)` | Pulls a structure from the repository; `options.pullType: 'yaml'` fetches the original YAML. |
| `push(input, additionalProperties?)` | Pushes a SOyA document or instance to the repository. Instances are routed based on `@context/@vocab`. |
| `delete(path)` | Deletes an item in the repository. |
| `similar(input)` | Finds similarly shaped structures (`POST /api/soya/similar`). |
| `query(query?)` | Queries the repository for structures (`GET /api/soya/query`). |
| `info(path \| path[])` | Fetches name, DRI, history, bases, and overlays of a structure. |
| `calculateDri(content)` | Canonicalizes a document and calculates its DRI (hashlink). |
| `acquire(path, flatJson)` | Transforms flat JSON into JSON-LD guided by a pulled structure (`flat2ld`). |
| `getForm(soyaDoc, options?)` | Generates a [JSON Forms](https://jsonforms.io/) v3 schema + UI schema; `options`: `language`, `tag`. |
| `getSparqlBuilder(soyaDoc)` | Returns a `SparqlQueryBuilder` for querying the document with SPARQL. |
| `toCanonical(soyaDoc)` | Returns the canonical (URDNA2015) N-Quads form of a JSON-LD document. |
| `map(from, to)` | Aligns two structures and derives a Handlebars mapping template. |

### Overlay plugins

Transformation and validation are implemented as overlay plugins
(`Overlays.OverlayPlugin` with a single `run(overlayDoc, data)` method):

```typescript
import { Overlays } from 'soya-js';

const result = await new Overlays.SoyaTransform().run(transformOverlayDoc, data);
const report = await new Overlays.SoyaValidate().run(validationOverlayDoc, data);
```

* **SoyaTransform** dispatches on the overlay's `engine` property:
  `jq` (via `node-jq`), `handlebars` (recursive template rendering),
  `senml` (RFC 8428 normalization). `jolt` is **no longer supported** (≥ 0.9).
* **SoyaValidate** runs SHACL validation (`rdf-validate-shacl`) plus additional
  class-presence checks and returns `{ isValid, results, classChecks }`.

### Other exports

* `RepoService` — repository access (built on `vaultifier`); supports optional
  authentication (`RepoService.fromVaultifier(...)`, `defaultAuth`).
* `getSoyaForm`, `SoyaFormResponse`, `SoyaFormOptions` — form generation without a `Soya` instance.
* `Errors` — `JsonParseError`, `FormRenderError`.
* `SoyaDocument`, `SoyaInstance` — TypeScript interfaces for SOyA JSON-LD documents.
* `DEFAULT_REPO`, `DEFAULT_SOYA_NAMESPACE`, `DEFAULT_XSD` — defaults.

### Peer dependencies

`handlebars`, `node-jq`, and `@gebsl/senml-js` are peer dependencies — they are
only needed when the corresponding transform engine is used.

---

## Debugging

`lib2/src/test.ts` is a scratch entry point for debugging library behavior:
put an input file into `tmp/input.json`, run `npm run dev` (watch build), and
execute `node dist/test.js`.
