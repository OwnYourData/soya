/* global describe, it */

const assert = require('assert')
const blankNode = require('../lib/blankNode')
const rdf = require('@rdfjs/data-model')

describe('blankNode', () => {
  it('should be a function', () => {
    assert.equal(typeof blankNode, 'function')
  })

  it('should convert a Blank Node to a N-Triples string', () => {
    const node = rdf.blankNode()

    assert.equal(blankNode(node), `_:${node.value}`)
  })
})
