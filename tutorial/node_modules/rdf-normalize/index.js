const jsonldNormalize = require('./jsonld-normalize')

function createPlainNode (node) {
  if (!node) {
    return null
  }

  let plain = {}

  if (node.termType === 'NamedNode') {
    plain.type = 'IRI'
    plain.value = node.value
  } else if (node.termType === 'BlankNode') {
    plain.type = 'blank node'
    plain.value = '_:' + node.value
  } else if (node.termType === 'Literal') {
    plain.type = 'literal'
    plain.value = node.value
    plain.datatype = node.datatype.value
    plain.language = node.language
  }

  return plain
}

function createPlainTriple (triple) {
  return {
    subject: createPlainNode(triple.subject),
    predicate: createPlainNode(triple.predicate),
    object: createPlainNode(triple.object)
  }
}

function createPlainDataset (graph) {
  let dataset = {}

  graph.forEach((quad) => {
    let name = '@default'

    if ('graph' in quad && quad.graph.value) {
      name = quad.graph.value
    }

    if (!(name in dataset)) {
      dataset[name] = []
    }

    dataset[name].push(createPlainTriple(quad))
  })

  return dataset
}

function normalize (graph) {
  return jsonldNormalize(createPlainDataset(graph))
}

module.exports = normalize
