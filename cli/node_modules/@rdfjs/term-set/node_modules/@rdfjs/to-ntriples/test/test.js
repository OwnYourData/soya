const { strictEqual, throws } = require('assert')
const rdf = require('@rdfjs/data-model')
const { describe, it } = require('mocha')
const toNT = require('../index.js')

describe('@rdfjs/to-ntriples', () => {
  it('should be a function', () => {
    strictEqual(typeof toNT, 'function')
  })

  it('should return null if a falsy value is given', () => {
    strictEqual(toNT(null), null)
  })

  it('should throw an error if an unknown object is given', () => {
    throws(() => {
      toNT({})
    })
  })

  describe('BlankNode', () => {
    it('should convert a BlankNode to a N-Triples string', () => {
      const term = rdf.blankNode()

      strictEqual(toNT(term), `_:${term.value}`)
    })
  })

  describe('Dataset', () => {
    it('should convert a Dataset to a N-Triples string', () => {
      const quad1 = rdf.quad(
        rdf.blankNode(),
        rdf.namedNode('http://example.org/predicate'),
        rdf.literal('1'),
        rdf.namedNode('http://example.org/graph')
      )
      const quad2 = rdf.quad(
        rdf.blankNode(),
        rdf.namedNode('http://example.org/predicate'),
        rdf.literal('2'),
        rdf.namedNode('http://example.org/graph')
      )
      const expected = [
        `_:${quad1.subject.value} <${quad1.predicate.value}> "${quad1.object.value}" <${quad1.graph.value}> .`,
        `_:${quad2.subject.value} <${quad2.predicate.value}> "${quad2.object.value}" <${quad2.graph.value}> .`
      ].join('\n') + '\n'

      const result = toNT([quad1, quad2])

      strictEqual(result, expected)
    })
  })

  describe('DefaultGraph', () => {
    it('should convert a DefaultGraph to a N-Triples string', () => {
      strictEqual(toNT(rdf.defaultGraph()), '')
    })
  })

  describe('Literal', () => {
    it('should convert a Literal to a N-Triples string', () => {
      const term = rdf.literal('test')

      strictEqual(toNT(term), `"${term.value}"`)
    })

    it('should convert a Literal with language to a N-Triples string', () => {
      const term = rdf.literal('test', 'en')

      strictEqual(toNT(term), `"${term.value}"@en`)
    })

    it('should convert a Literal with a non-string datatype to a N-Triples string', () => {
      const datatype = rdf.namedNode('http://example.org/datatype')
      const term = rdf.literal('test', datatype)

      strictEqual(toNT(term), `"${term.value}"^^<${datatype.value}>`)
    })

    it('should convert a Literal with line breaks to an escaped N-Triples string', () => {
      const term = rdf.literal('test\ntest')

      strictEqual(toNT(term), '"test\\ntest"')
    })
  })

  describe('Quad', () => {
    it('should convert a Quad to a N-Triples string', () => {
      const subject = rdf.blankNode()
      const predicate = rdf.namedNode('http://example.org/predicate')
      const object = rdf.literal('object')
      const graph = rdf.namedNode('http://example.org/graph')
      const quad = rdf.quad(subject, predicate, object, graph)

      const expected = `_:${subject.value} <${predicate.value}> "${object.value}" <${graph.value}> .`

      strictEqual(toNT(quad), expected)
    })

    it('should convert a Quad with a DefaultGraph to a N-Triples string', () => {
      const subject = rdf.blankNode()
      const predicate = rdf.namedNode('http://example.org/predicate')
      const object = rdf.literal('object')
      const quad = rdf.quad(subject, predicate, object)

      const expected = `_:${subject.value} <${predicate.value}> "${object.value}" .`

      strictEqual(toNT(quad), expected)
    })

    it('should convert a legacy Quad without .termType to a N-Triples string', () => {
      const subject = rdf.blankNode()
      const predicate = rdf.namedNode('http://example.org/predicate')
      const object = rdf.literal('object')
      const graph = rdf.namedNode('http://example.org/graph')
      const quad = { subject, predicate, object, graph }

      const expected = `_:${subject.value} <${predicate.value}> "${object.value}" <${graph.value}> .`

      strictEqual(toNT(quad), expected)
    })
  })

  describe('variable', () => {
    it('should convert a Variable to a N-Triples string', () => {
      const term = rdf.variable('test')

      strictEqual(toNT(term), `?${term.value}`)
    })
  })
})
