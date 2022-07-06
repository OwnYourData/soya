function blankNode (blankNode) {
  return '_:' + blankNode.value // TODO: escape special chars
}

module.exports = blankNode
