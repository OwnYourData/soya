const blankNode = require('./blankNode')
const defaultGraph = require('./defaultGraph')
const literal = require('./literal')
const namedNode = require('./namedNode')
const variable = require('./variable')

function term (term) {
  switch (term.termType) {
    case 'BlankNode':
      return blankNode(term)
    case 'DefaultGraph':
      return defaultGraph(term)
    case 'Literal':
      return literal(term)
    case 'NamedNode':
      return namedNode(term)
    case 'Variable':
      return variable(term)
    default:
      return undefined
  }
}

module.exports = term
