# SOyA 🌱 form

Render forms with SOyA!

Built with Vite, React 18, MUI v7, and [JSON Forms](https://jsonforms.io/) v3.

## Local development

The app loads its runtime configuration and repository data via `/api/*`
endpoints that are served by `server.mjs`. For development, start both —
the Vite dev server proxies `/api` to `server.mjs` (see `vite.config.ts`):

```bash
# terminal 1: API/runtime-config server
PORT=8080 REPO_BASE_URL=https://soya.ownyourdata.eu node server.mjs

# terminal 2: Vite dev server with hot reload
npm run dev            # -> http://localhost:3000
```

### Default forms for structures without form overlay

If a SOyA structure contains no `OverlayForm`, the app falls back to a
**generated** default form: `server.mjs` proxies `/api/form/<name>` to a
[soya-web-cli](../web-cli) instance, which runs soya-js' `getSoyaForm` —
the same logic as `soya form` on the command line. The instance is
configured via the environment variable `WEBCLI_BASE_URL`
(default: `https://soya-web-cli.ownyourdata.eu`).

## Production build

```bash
npm run build          # -> ./build (served by server.mjs / Dockerfile)
npm run docker         # build + docker image oydeu/oyd-forms
```

## About  

Supported by the Federal Ministry for Climate Protection, Environment, Energy, Mobility, Innovation and Technology (Bundesministerium für Klimaschutz, Umwelt, Energie, Mobilität, Innovation und Technologie [BMK]) through FFG funding in the program “IKT der Zukunft” under [grant number 887052](https://projekte.ffg.at/projekt/4125456).

<img align="left" src="https://raw.githubusercontent.com/OwnYourData/oyd-form/main/res/210614_FFG-BM-Logoleisten_CMYK_01_BMDW-BMK-FFG_128mm.jpg" height="150">

<br clear="both" />

## License

[Apache 2.0 License - OwnYourData.eu](https://raw.githubusercontent.com/OwnYourData/soya/main/LICENSE)
