/* global describe, it */

const assert = require('assert')
const variable = require('../lib/variable')
const rdf = require('@rdfjs/data-model')

describe('variable', () => {
  it('should be a function', () => {
    assert.equal(typeof variable, 'function')
  })

  it('should convert a Variable to a N-Triples string', () => {
    const v = rdf.variable('test')

    assert.equal(variable(v), `?${v.value}`)
  })
})
