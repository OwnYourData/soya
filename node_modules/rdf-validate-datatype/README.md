
# rdf-validate-datatype

Validate literal value of an RDF term based on its declared datatype.

[![npm version](https://badge.fury.io/js/rdf-validate-datatype.svg)](https://badge.fury.io/js/rdf-validate-datatype)


## Install

`$ npm install rdf-validate-datatype`


## Usage

### `validateTerm`

```javascript
import validateDatatype from 'rdf-validate-datatype'
import rdf from '@rdfjs/data-model'
import { xsd } from '@tpluscode/rdf-ns-builders'

const { validateTerm } = validateDatatype

const term = rdf.literal('test')
const isValid = validateTerm(term) // -> true

const term = rdf.literal('2019-01-01', xsd.date)
const isValid = validateTerm(term) // -> true

const term = rdf.literal('invalid date', xsd.date)
const isValid = validateTerm(term) // -> false
```

### `validateQuad`

`validateQuad` validates that the `.object` of a given quad is valid in regards
to its declared datatype.

```javascript
import validateDatatype from 'rdf-validate-datatype'
import rdf from '@rdfjs/data-model'
import { schema, xsd } from '@tpluscode/rdf-ns-builders'

const { validateQuad } = validateDatatype

const quad = rdf.quad(
  rdf.namedNode('bob'),
  schema.birthDate,
  rdf.literal('2019-01-01', xsd.date)
)
const isValid = validateQuad(term) // -> true

const quad = rdf.quad(
  rdf.namedNode('bob'),
  schema.birthDate,
  rdf.literal('invalid date', xsd.date)
)
const isValid = validateQuad(term) // -> false
```

### Configuring validators

Datatype validators are stored in a registry. They can be changed at runtime.

```javascript
import validateDatatype from 'rdf-validate-datatype'
import rdf from '@rdfjs/data-model'
import { xsd } from '@tpluscode/rdf-ns-builders'

const { validators, validateTerm } = validateDatatype

// Register a new datatype
const myDatatype = rdf.namedNode('my-datatype')
validators.register(myDatatype, value => value.startsWith('X-'))
validateTerm(rdf.literal('X-test', myDatatype)) // -> true
validateTerm(rdf.literal('test', myDatatype)) // -> false

// Override an existing datatype
validators.register(xsd.date, value => true)
validateTerm(rdf.literal('banana', xsd.date)) // -> true
```
