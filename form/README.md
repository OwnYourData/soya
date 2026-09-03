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

### Form appearance (`variant` / `density`)

JSON Forms v3 picks its input component from the MUI theme
(`useThemeProps({ name: 'MuiTextField' })`) and falls back to `outlined` —
v2 ran on MUI v4, where `standard` (underline) was the default. That single
change is what makes v3 forms considerably taller than their v2 counterparts.

`src/formTheme.ts` restores the compact look and makes it declarative: it reads
`options.variant` (`standard` | `outlined` | `filled`) and `options.density`
(`compact` | `comfortable`) from the **root element** of the form's UI schema
and derives a MUI theme from them. `App.tsx` applies that theme through a nested
`ThemeProvider` around `<JsonForms/>` only, so the surrounding app chrome
(search field, buttons) is unaffected.

Defaults are `standard` + `compact`. Besides the input variant, `compact`
tightens `TableCell` padding, hides the empty `FormHelperText` elements that
`MaterialTableControl` renders for every cell, and shrinks the array toolbar
buttons.

See [`docs/users/forms.md`](../docs/users/forms.md) for the overlay-side
documentation.

## Production build

```bash
npm run build          # -> ./build (served by server.mjs / Dockerfile)
npm run docker         # build + docker image oydeu/soya-forms
```

The canonical way to produce and publish the image is `build.sh`, which also
covers the arm64 variant:

```bash
sh ./build.sh                      # npm i + npm run build + oydeu/soya-forms:latest
sh ./build.sh --clean --dockerhub  # build without cache and push
sh ./build.sh --arm --dockerhub    # arm64v8 image (Dockerfile.arm64v8)
```

## About  

Supported by the Federal Ministry for Climate Protection, Environment, Energy, Mobility, Innovation and Technology (Bundesministerium für Klimaschutz, Umwelt, Energie, Mobilität, Innovation und Technologie [BMK]) through FFG funding in the program “IKT der Zukunft” under [grant number 887052](https://projekte.ffg.at/projekt/4125456).

<img align="left" src="https://raw.githubusercontent.com/OwnYourData/oyd-form/main/res/210614_FFG-BM-Logoleisten_CMYK_01_BMDW-BMK-FFG_128mm.jpg" height="150">

<br clear="both" />

## License

[Apache 2.0 License - OwnYourData.eu](https://raw.githubusercontent.com/OwnYourData/soya/main/LICENSE)
