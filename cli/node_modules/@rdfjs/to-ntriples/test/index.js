/* global describe, it */

const assert = require('assert')
const quad = require('../lib/quad')
const term = require('../lib/term')
const lib = require('..')

describe('to-ntriples', () => {
  it('should expose quadToNTriples', () => {
    assert.equal(typeof lib.quadToNTriples, 'function')
    assert.equal(quad, lib.quadToNTriples)
  })

  it('should expose termToNTriples', () => {
    assert.equal(typeof lib.termToNTriples, 'function')
    assert.equal(term, lib.termToNTriples)
  })
})
