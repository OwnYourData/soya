function namedNode (namedNode) {
  return '<' + namedNode.value + '>' // TODO: escape special chars
}

module.exports = namedNode
