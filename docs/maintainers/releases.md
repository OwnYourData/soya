# Release Process

This document describes how SOyA components are versioned and released.

## Versioning

All components follow [Semantic Versioning](https://semver.org/) (currently
with a `0.x` major, i.e. minor bumps may contain breaking changes — these must
be documented in the component README and in the migration notes):

| Component | Package / Image | Current line |
|-----------|-----------------|--------------|
| `lib2/`   | npm `soya-js` | 0.9.x (Node 24 stack) |
| `cli2/`   | npm `soya-cli`, Docker `oydeu/soya-cli` | 0.18.x (Node 24 stack) |
| `web-cli/`| Docker `oydeu/soya-web-cli` | 0.5.x |
| `form/`   | Docker `oydeu/oyd-forms` | 0.6.x |
| `soyabud/`| Docker `oydeu/soya-bud` | 0.6.x |
| `repo2/`  | Docker `oydeu/soya-base` | see `repo2/` |

## Releasing soya-js (lib2)

0. **Prerequisite:** if `semcon-js` received changes, publish it (from the
   semcon repository) first and update the version range in
   `lib2/package.json` (currently `^0.4.0`).
1. Bump `version` in `lib2/package.json`.
2. `npm install && npm run build` (also refreshes `package-lock.json`).
3. Run the CLI pytest suite against a locally linked `soya-cli` build
   (see below) — the library has no own test suite; the CLI tests are the
   verification layer.
4. `npm publish` (runs `prepublishOnly` → build).

## Releasing soya-cli (cli2)

1. Ensure the required `soya-js` version is published, then switch the
   dependency in `cli2/package.json` from the development reference
   `file:../lib2` to the published version (e.g. `^0.9.0`).
2. Bump `version` in `cli2/package.json`, `npm install && npm run build`.
3. Verify: `npm run bin` (links `soya`), then

   ```bash
   cd cli2/docker/pytest
   REPO=https://soya.ownyourdata.eu pytest
   ```

4. `npm publish`.
5. Docker image: `./build.sh --dockerhub` (build context is the repository
   root; the image builds `lib2` and `cli2` from source).

> **Important:** revert the `soya-js` dependency to `file:../lib2` on the
> development branch after publishing, or keep the published version if the
> side-by-side phase (lib/cli vs. lib2/cli2) has ended.

## Releasing soya-web-cli and soya-form

1. Bump `version` in `package.json`.
2. `npm run build` (web-cli: `tsc`; form: `tsc --noEmit && vite build`).
3. `npm run docker` builds the respective image; push to Docker Hub.
4. web-cli uses `soya-js` via `file:../lib2` during the transition — switch to
   the published version for reproducible image builds (same rule as cli2).

## Release checklist

- [ ] Version bumped, lockfile updated
- [ ] pytest suite green (`cli2/docker/pytest`, incl. `WEBCLI=<local>` run for web-cli changes)
- [ ] Breaking changes documented (README + `docs/developers/migration-node24.md`)
- [ ] Docker images built for both architectures where applicable (`Dockerfile`, `Dockerfile.arm64v8`)
- [ ] Git tag created (`<component>-v<version>`)
