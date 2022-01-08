const namedNode = require('./namedNode')

const echarRegEx = new RegExp('["\\\\\n\r]') // eslint-disable-line no-control-regex
const echarRegExAll = new RegExp('["\\\\\n\r]', 'g') // eslint-disable-line no-control-regex

const echarReplacement = {
  '"': '\\"',
  '\\': '\\\\',
  '\n': '\\n',
  '\r': '\\r'
}

function echarReplacer (char) {
  return echarReplacement[char]
}

function escapeValue (value) {
  if (echarRegEx.test(value)) {
    return value.replace(echarRegExAll, echarReplacer)
  }

  return value
}

function literal (literal) {
  const escapedValue = escapeValue(literal.value)

  if (literal.datatype.value === 'http://www.w3.org/2001/XMLSchema#string') {
    return '"' + escapedValue + '"'
  }

  if (literal.datatype.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString') {
    return '"' + escapedValue + '"@' + literal.language
  }

  return '"' + escapedValue + '"^^' + namedNode(literal.datatype)
}

module.exports = literal
