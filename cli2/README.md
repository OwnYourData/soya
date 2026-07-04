# soya-cli 🌱 (Node 24 stack)

[SOyA (**S**emantic **O**verla**y** **A**rchitecture)](https://www.ownyourdata.eu/en/soya/) provides a framework to manage layers of semantic description for a dataset enabling well-defined annotation, validation, transformation, and human-readable display & data capture.

`soya-cli` provides easy-to-use interfaces for handling SOyA structures and interacting with SOyA repositories.

`soya-cli` is built on top of [`soya-js`](../lib2) and exposes most of its features as commands on the command line. In addition there are features like:

* DRI calculation for SOyA structures
* Data transformation using [`jq`](https://jqlang.github.io/jq/), [Handlebars](https://handlebarsjs.com/), or [SenML](https://datatracker.ietf.org/doc/html/rfc8428)
* Fast prototyping with quick links to [JSON-LD Playground](https://json-ld.org/playground/)

> **Note:** This directory (`cli2`) contains the modernized **Node ≥ 20 / Node 24**
> version of `soya-cli` (version ≥ 0.18). The legacy Node 16 version is kept in
> [`cli`](../cli) until the migration is fully completed. Both versions provide
> the same `soya` binary — install/link only one of them at a time, or use the
> respective Docker images. See
> [docs/developers/migration-node24.md](../docs/developers/migration-node24.md) for details.

## Requirements

* Node.js ≥ 20 (developed and tested with Node 24)

## Breaking changes compared to soya-cli 0.17 (cli)

* **jolt transformations are no longer supported.** The `--executable` option of
  `soya transform` (used to point to a jolt binary) has been removed, as have the
  `transformation.jolt` template and the jolt tooling in the Docker image.
  Use `jq` or `handlebars` transformation overlays instead.

## Install and build from source

`soya-cli` depends on `soya-js` via a local file reference (`file:../lib2`),
so build the library first:

```bash
# build the library
cd ../lib2 && npm install && npm run build

# install all dependencies
cd ../cli2 && npm install

# build project sources
npm run build

# register soya-cli in path
npm run bin
```

## Install from npmjs.com

soya-cli is also available from [npmjs.com](https://www.npmjs.com/package/soya-cli) as a prebuilt package that can be installed with:

```bash
# install or update soya-cli globally with -g
npm install -g soya-cli@latest
```

## Build Docker image

To package soya-cli with additional tools ([jq](https://jqlang.github.io/jq/) and [OYDID](https://ownyourdata.github.io/oydid/)) in a ready-to-use Docker container run:

```bash
./build.sh
```

(The docker build context is the repository root because the image also builds `../lib2`.)

The current `oydeu/soya-cli` Docker image is available here: https://hub.docker.com/r/oydeu/soya-cli

### Verify with automated tests

Use the following command to run the automated tests in the `oydeu/soya-cli` Docker image:

```bash
docker run -it --rm -w /usr/src/app/docker/pytest oydeu/soya-cli pytest
```

The pytest suite in `cli2/docker/pytest` can also be executed locally against a
globally linked `soya` binary:

```bash
cd cli2/docker/pytest
pip install -r requirements.txt
REPO=https://soya.ownyourdata.eu pytest
# optionally test against a locally running soya-web-cli:
# WEBCLI=http://localhost:8080 pytest test_usecases.py
```

## Run soya-cli

Use `soya --help` or `soya -h` to get more information about soya-cli.

## License

[Apache 2.0 License - OwnYourData.eu](https://raw.githubusercontent.com/OwnYourData/soya/main/LICENSE)
