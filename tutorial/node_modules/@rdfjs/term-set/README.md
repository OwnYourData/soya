# @rdfjs/term-set

A Set for RDFJS Terms.

This package implements the JavaScript Set interface exclusively for RDFJS Terms and treats Terms with the same N-Triples representation as they are the same object.

## Usage

The package exports the constructor of the Term-Set.
New instances can be created just like JavaScript Sets:

```js
const rdf = require('@rdfjs/data-model')
const TermSet = require('@rdfjs/term-set')

const terms = new TermSet([
  rdf.namedNode('http://example.org/'),
  rdf.literal('test')
])

// The rdf factory will return a new instance of the literal,
// but the Term-Set will check for the N-Triple representation.
// That's why the output will be: "true"
console.log(terms.has(rdf.literal('test')))
```
