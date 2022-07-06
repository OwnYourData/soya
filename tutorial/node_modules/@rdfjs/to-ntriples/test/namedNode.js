/* global describe, it */

const assert = require('assert')
const namedNode = require('../lib/namedNode')
const rdf = require('@rdfjs/data-model')

describe('namedNode', () => {
  it('should be a function', () => {
    assert.equal(typeof namedNode, 'function')
  })

  it('should convert a Named Node to a N-Triples string', () => {
    const node = rdf.namedNode('http://example.org/namedNode')

    assert.equal(namedNode(node), `<${node.value}>`)
  })
})
