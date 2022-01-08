/* global describe, it */

const assert = require('assert')
const quad = require('../lib/quad')
const rdf = require('@rdfjs/data-model')

describe('quad', () => {
  it('should be a function', () => {
    assert.equal(typeof quad, 'function')
  })

  it('should convert a Quad to a N-Triples string', () => {
    const q = rdf.quad(
      rdf.blankNode(),
      rdf.namedNode('http://example.org/predicate'),
      rdf.literal('object'),
      rdf.namedNode('http://example.org/graph')
    )

    const expected = `_:${q.subject.value} <${q.predicate.value}> "${q.object.value}" <${q.graph.value}> .`

    assert.equal(quad(q), expected)
  })

  it('should convert a Quad with Default Graph to a N-Triples string', () => {
    const q = rdf.quad(
      rdf.blankNode(),
      rdf.namedNode('http://example.org/predicate'),
      rdf.literal('object')
    )

    const expected = `_:${q.subject.value} <${q.predicate.value}> "${q.object.value}" .`

    assert.equal(quad(q), expected)
  })
})
