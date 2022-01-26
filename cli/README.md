# soya-cli 🌱

[SOyA (**S**emantic **O**verla**y** **A**rchitecture)](https://www.ownyourdata.eu/en/soya/) provides a framework to manage layers of semantic description for a dataset enabling well-defined annotation, validation, transformation, and human-readable display & data capture.

`soya-cli` provides easy-to-use interfaces for handling SOyA structures and interacting with SOyA respositories.

`soya-cli` is built on top of [`soya-js`](https://github.com/OwnYourData/soya/tree/main/lib) and exposes most of its [features](https://github.com/OwnYourData/soya/blob/main/lib/README.md) as commands on the command line. In addition there are features like:

* DRI calculation for SOyA structures
* Data transformation using 
  * [`jq`](https://stedolan.github.io/jq/)
  * [`jolt`](https://github.com/bazaarvoice/jolt)
* Fast prototyping with quick links to [JSON-LD Playground](https://json-ld.org/playground/)

## Installation

Install all dependencies with node package manager (npm)

```bash
# install all dependencies
npm install

# build project sources
npm run build

# register soya-cli in path
npm run bin
```

## Run soya-cli

Use `soya --help` or `soya -h` to get more information about soya-cli.

## Dev note

This project is a prototype, therefore under development. \
`soya-cli` may not behave as expected and should not be used in production! \
Also code does surely not satisfy most of best practices in coding :-)