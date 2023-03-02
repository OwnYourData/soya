# SOyA web-cli 🌱

This is the repo for the soya web-cli. It aims to provide similar functionality to the command line cli and uses implementation from the soya javascript library. It should make it easier for other applications to use soya functionality, by exposing SOyA functions through a documented HTTP interface.

## Get started

```bash
# install dependencies
npm install
# build from sources
npm run build
# start dev server
npm start
```

The dev server will start on port `8080`. API docs can be found at `http://localhost:8080/api-docs`

## Docker support

Docker containers can be built by using:

```bash
npm run docker
```