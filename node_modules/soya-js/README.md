# soya-js 🌱

[SOyA (**S**emantic **O**verla**y** **A**rchitecture)](https://www.ownyourdata.eu/en/soya/) provides a framework to manage layers of semantic description for a dataset enabling well-defined annotation, validation, transformation, and human-readable display & data capture.

`soya-js` provides easy-to-use interfaces for handling SOyA structures and interacting with SOyA respositories.

* Creation of SOyA JSON-LD structures using simple YAML files
* Finding similarly shaped SOyA structures
* Communication with [SOyA repositories](https://github.com/OwnYourData/soya/tree/main/repository) (e.g. for pushing and pulling SOyA structures and data)
* Data validation through [SHACL](https://www.w3.org/TR/shacl/)
* Data acquisition (transforming flat JSON data into rich JSON-LD data)
* Data transformation using popular [`jq`](https://stedolan.github.io/jq/) processor
* Forms generation based on SOyA structures using [JSONForms](https://jsonforms.io/) (React, Angular, Vue)

## Installation

Install dependencies with node package manager (npm)

```bash
# install dependencies
npm install

# build project sources
npm run build
```

## Dev note

This project is a prototype, therefore under development. \
`soya-js` may not behave as expected and should not be used in production! \
Also code does surely not satisfy most of best practices in coding :-)