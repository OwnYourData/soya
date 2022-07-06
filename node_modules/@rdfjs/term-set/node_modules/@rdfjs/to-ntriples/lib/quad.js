function quad (quad, toNT) {
  const subjectString = toNT(quad.subject)
  const predicateString = toNT(quad.predicate)
  const objectString = toNT(quad.object)
  const graphString = toNT(quad.graph)

  return `${subjectString} ${predicateString} ${objectString} ${graphString ? graphString + ' ' : ''}.`
}

module.exports = quad
