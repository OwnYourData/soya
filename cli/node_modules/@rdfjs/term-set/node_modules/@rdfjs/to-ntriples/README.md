# @rdfjs/to-ntriples

[![Build Status](https://travis-ci.org/rdfjs/to-ntriples.svg?branch=master)](https://travis-ci.org/rdfjs/to-ntriples)

[![npm version](https://img.shields.io/npm/v/@rdfjs/to-ntriples.svg)](https://www.npmjs.com/package/@rdfjs/to-ntriples)

Converts [RDF/JS](http://rdf.js.org/) Terms, Quads and Datasets to N-Triple strings. 

## Examples

```javascript
const rdf = require('@rdfjs/data-model')
const toNT = require('@rdfjs/to-ntriples')

// convert a Term/Literal to a N-Triple string (output: "example"@en)
console.log(toNT(rdf.literal('example', 'en')))

// convert a Quad to a N-Triple string (output: _:b1 <http://example.org/predicate> "example" .) 
console.log(toNT(rdf.quad(
  rdf.blankNode(),
  rdf.namedNode('http://example.org/predicate'),
  rdf.literal('example')
)))


/*
  convert an Array/Dataset to a N-Triple string
  output:
    _:b2 <http://example.org/predicate> "1" .
    _:b3 <http://example.org/predicate> "2" .
  Any object with Symbol.iterator is supported
*/
console.log(toNT([
  rdf.quad(
    rdf.blankNode(),
    rdf.namedNode('http://example.org/predicate'),
    rdf.literal('1')
  ),
  rdf.quad(
    rdf.blankNode(),
    rdf.namedNode('http://example.org/predicate'),
    rdf.literal('2')
  )
]))
```
