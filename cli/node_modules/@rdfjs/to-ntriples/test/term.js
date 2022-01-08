/* global describe, it */

const assert = require('assert')
const term = require('../lib/term')
const rdf = require('@rdfjs/data-model')

describe('term', () => {
  it('should be a function', () => {
    assert.equal(typeof term, 'function')
  })

  it('should convert a Blank Node to a N-Triples string', () => {
    const blankNode = rdf.blankNode()

    assert.equal(term(blankNode), `_:${blankNode.value}`)
  })

  it('should convert a Default Graph to a N-Triples string', () => {
    assert.equal(term(rdf.defaultGraph()), '')
  })

  it('should convert a Literal to a N-Triples string', () => {
    const literal = rdf.literal('test')

    assert.equal(term(literal), `"${literal.value}"`)
  })

  it('should convert a Named Node to a N-Triples string', () => {
    const namedNode = rdf.namedNode()

    assert.equal(term(namedNode), `<${namedNode.value}>`)
  })

  it('should convert a Variable to a N-Triples string', () => {
    const variable = rdf.variable()

    assert.equal(term(variable), `?${variable.value}`)
  })
})
