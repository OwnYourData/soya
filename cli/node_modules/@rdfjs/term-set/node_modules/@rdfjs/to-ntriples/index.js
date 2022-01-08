const blankNode = require('./lib/blankNode.js')
const dataset = require('./lib/dataset.js')
const defaultGraph = require('./lib/defaultGraph.js')
const literal = require('./lib/literal.js')
const namedNode = require('./lib/namedNode.js')
const quad = require('./lib/quad.js')
const variable = require('./lib/variable.js')

function toNT (term) {
  if (!term) {
    return null
  }

  if (term.termType === 'BlankNode') {
    return blankNode(term)
  }

  if (term.termType === 'DefaultGraph') {
    return defaultGraph()
  }

  if (term.termType === 'Literal') {
    return literal(term)
  }

  if (term.termType === 'NamedNode') {
    return namedNode(term)
  }

  // legacy quad support without .termType
  if (term.termType === 'Quad' || (term.subject && term.predicate && term.object && term.graph)) {
    return quad(term, toNT)
  }

  if (term.termType === 'Variable') {
    return variable(term)
  }

  if (term[Symbol.iterator]) {
    return dataset(term, toNT)
  }

  throw new Error(`unknown termType ${term.termType}`)
}

module.exports = toNT
