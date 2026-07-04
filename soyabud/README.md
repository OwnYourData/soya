# SOyA-Bud 🌱

Web UI for browsing and editing **SOyA structures** in a
[SOyA repository](../repo2): schema view, raw data/YAML editing
(Monaco editor), form rendering, and data visualization.

SOyA-Bud started as the `soyabud` variant of
[OYD-DataBud](https://github.com/OwnYourData/databud) (SemCon) and is
maintained as a standalone component of the SOyA ecosystem since v0.6.

## Stack

* Vue 2.7 + bootstrap-vue, built with **Vite** (Node ≥ 20, developed with Node 24)
* [`soya-js`](../lib2) (local reference `file:../lib2` during the transition phase)
* [`semcon-js`](https://www.npmjs.com/package/semcon-js) for repository/container access

## Development

```bash
npm install
npm run dev            # Vite dev server
npm run typecheck      # tsc --noEmit
```

Note: `soya-js` pulls in some node-only modules; for the browser bundle they
are replaced with stubs (`src/stubs/`, wired up in `vite.config.ts`) —
jq/SenML transformations are executed server-side, not in the browser.

## Build & Docker

```bash
npm run build          # -> ./dist
./build.sh             # builds docker image oydeu/soya-bud
```

## License

[Apache 2.0 License - OwnYourData.eu](https://raw.githubusercontent.com/OwnYourData/soya/main/LICENSE)
