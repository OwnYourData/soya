/* global describe, it */

const assert = require('assert')
const literal = require('../lib/literal')
const rdf = require('@rdfjs/data-model')

describe('literal', () => {
  it('should be a function', () => {
    assert.equal(typeof literal, 'function')
  })

  it('should convert a Literal to a N-Triples string', () => {
    const l = rdf.literal('test')

    assert.equal(literal(l), `"${l.value}"`)
  })
})
