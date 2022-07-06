/* global describe, it */

const assert = require('assert')
const defaultGraph = require('../lib/defaultGraph')
const rdf = require('@rdfjs/data-model')

describe('defaultGraph', () => {
  it('should be a function', () => {
    assert.equal(typeof defaultGraph, 'function')
  })

  it('should convert a Default Graph to a N-Triples string', () => {
    assert.equal(defaultGraph(rdf.defaultGraph()), '')
  })
})
