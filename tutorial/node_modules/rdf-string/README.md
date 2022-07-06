# RDF String

[![Build status](https://github.com/rubensworks/rdf-string.js/workflows/CI/badge.svg)](https://github.com/rubensworks/rdf-string.js/actions?query=workflow%3ACI)
[![Coverage Status](https://coveralls.io/repos/github/rubensworks/rdf-string.js/badge.svg?branch=master)](https://coveralls.io/github/rubensworks/rdf-string.js?branch=master)
[![npm version](https://badge.fury.io/js/rdf-string.svg)](https://www.npmjs.com/package/rdf-string)

This package contains utility functions to convert between the string-based
and [RDFJS](https://github.com/rdfjs/representation-task-force/) representations of RDF terms, quads and triples.

_If you are looking for a Turtle-based string syntax, have a look at [RDF String Turtle](https://github.com/rubensworks/rdf-string-ttl.js)_

This allows for convenient and compact interaction with RDF terms and quads,
as they can be serialized as plain JSON.

This string-based representation is based on the
[*old* triple representation of N3.js](https://github.com/rdfjs/N3.js/tree/v0.11.0#triple-representation).
Namely, quads are represented as follows:
```
{
  subject:   'http://example.org/cartoons#Tom',
  predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
  object:    'http://example.org/cartoons#Cat'
  graph:     'http://example.org/myGraph'
}
```
Different terms types in quads are represented as follows:
* **URLs, URIs and IRIs are simple strings**: `'http://example.org/cartoons#Tom'`
* **Literals are represented as double quoted strings**: `'"Tom"'`, `'"Tom"@en-gb'`, `'"1"^^http://www.w3.org/2001/XMLSchema#integer'`
* **Variables are prefixed by `?`**: `'?variableName'`

## Usage

The following examples assume the following imports:
```javascript
import * as RdfDataModel from "rdf-data-model";
import * as RdfString from "rdf-string";
```

### Term to string

Convert an RDFJS term to the string-based representation.

```javascript
// Prints http://example.org
console.log(RdfString.termToString(RdfDataModel.namedNode('http://example.org')));

// Prints _:b1
console.log(RdfString.termToString(RdfDataModel.blankNode('b1')));

// Prints "abc"
console.log(RdfString.termToString(RdfDataModel.literal('abc')));

// Prints "abc"@en-us
console.log(RdfString.termToString(RdfDataModel.literal('abc', 'en-us')));

// Prints "abc"^^http://example.org/
console.log(RdfString.termToString(RdfDataModel.literal('abc', namedNode('http://example.org/'))));

// Prints ?v1
console.log(RdfString.termToString(RdfDataModel.variable('v1')));

// Prints empty string
console.log(RdfString.termToString(RdfDataModel.defaultGraph()));
```

### String to term

Convert an string-based term to the RDFJS representation.

_Optionally, a custom RDFJS DataFactory can be provided as second argument to create terms instead of the built-in DataFactory._

```javascript
// Outputs a named node
RdfString.stringToTerm('http://example.org');

// Outputs a blank node
RdfString.stringToTerm('_:b1');

// Outputs a literal
RdfString.stringToTerm('"abc"');

// Outputs a literal with a language tag
RdfString.stringToTerm('"abc"@en-us');

// Outputs a literal with a datatype
RdfString.stringToTerm('"abc"^^http://example.org/');

// Outputs a variable
RdfString.stringToTerm('?v1');

// Outputs a default graph
RdfString.stringToTerm('');
```

### Quad to string-based quad

Convert an RDFJS quad to a string-based quad.

```javascript
// Prints { subject: 'http://example.org', predicate: 'http://example.org', object: '"abc"', graph: '' }
console.log(RdfString.quadToStringQuad(RdfDataModel.triple(
  namedNode('http://example.org'),
  namedNode('http://example.org'),
  literal('abc'),
)));
```

### String-based quad to quad

Converts a string-based quad to an RDFJS quad.

_Optionally, a custom RDFJS DataFactory can be provided as second argument to create quads and terms instead of the built-in DataFactory._

```javascript
// Outputs a quad
RdfString.stringQuadToQuad({
  subject: 'http://example.org',
  predicate: 'http://example.org',
  object: '"abc"',
  graph: '',
});
```

## License
This software is written by [Ruben Taelman](http://rubensworks.net/).
These utility functions are inspired by the implementation of [N3.js](https://github.com/RubenVerborgh/N3.js).

This code is released under the [MIT license](http://opensource.org/licenses/MIT).
