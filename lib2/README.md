# soya-js 🌱 (Node 24 stack)

[SOyA (**S**emantic **O**verla**y** **A**rchitecture)](https://www.ownyourdata.eu/en/soya/) provides a framework to manage layers of semantic description for a dataset enabling well-defined annotation, validation, transformation, and human-readable display & data capture.

`soya-js` provides easy-to-use interfaces for handling SOyA structures and interacting with SOyA repositories.

* Creation of SOyA JSON-LD structures using simple YAML files
* Finding similarly shaped SOyA structures
* Communication with [SOyA repositories](https://github.com/OwnYourData/soya/tree/main/repository) (e.g. for pushing and pulling SOyA structures and data)
* Data validation through [SHACL](https://www.w3.org/TR/shacl/)
* Data acquisition (transforming flat JSON data into rich JSON-LD data)
* Data transformation using the [`jq`](https://jqlang.github.io/jq/) processor, [Handlebars](https://handlebarsjs.com/) templates, or [SenML](https://datatracker.ietf.org/doc/html/rfc8428) normalization
* Forms generation based on SOyA structures using [JSONForms](https://jsonforms.io/) v3 (React, Angular, Vue)

> **Note:** This directory (`lib2`) contains the modernized **Node ≥ 20 / Node 24** version
> of `soya-js` (version ≥ 0.9). The legacy Node 16 version is kept in [`lib`](../lib)
> until the migration is fully completed. See
> [docs/developers/migration-node24.md](../docs/developers/migration-node24.md) for details.

## Requirements

* Node.js ≥ 20 (developed and tested with Node 24)

## Breaking changes compared to soya-js 0.8 (lib)

* **jolt transformations are no longer supported.** The `jolt` engine has been
  removed; use `jq` or `handlebars` instead. Structures with `engine: jolt`
  now raise an error at transformation time.
* **`vaultifier` was replaced by its successor [`semcon-js`](https://github.com/OwnYourData/semcon)**
  (soya-js ≥ 0.10). `RepoService.getSemcon()`/`fromSemcon()` replace
  `getVaultifier()`/`fromVaultifier()` — the old names remain available as
  deprecated aliases. DRI calculation now uses semcon-js' native `crypto`
  module (byte-identical results, no dependency on the unmaintained
  `hashlink`/`esm` packages anymore).
* TypeScript 5, ES2022 output. The module format remains **CommonJS**, so the
  public API and `require()`/`import` usage are unchanged.

## Implementation notes

* `semcon-js` is consumed from npm (`^0.4.0`). For developing both libraries
  in parallel, link a local checkout with
  `npm link ../../semcon/semcon-js` (or temporarily switch the dependency to
  `file:../../semcon/semcon-js`).

## Installation

Install dependencies with node package manager (npm)

```bash
# install dependencies
npm install

# build project sources
npm run build
```

## License

[Apache 2.0 License - OwnYourData.eu](https://raw.githubusercontent.com/OwnYourData/soya/main/LICENSE)
