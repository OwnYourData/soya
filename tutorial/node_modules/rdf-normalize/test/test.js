/* global describe, it, run */

const assert = require('assert')
const fs = require('fs')
const normalize = require('..')
const path = require('path')
const rdf = require('rdf-ext')
const N3Parser = require('rdf-parser-n3')

const ns = {
  action: rdf.namedNode('http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#action'),
  entries: rdf.namedNode('http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#entries'),
  first: rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'),
  nil: rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'),
  rest: rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'),
  result: rdf.namedNode('http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#result')
}

const exclude = [
  'manifest-urdna2015#test023',
  'manifest-urdna2015#test044',
  'manifest-urdna2015#test045',
  'manifest-urdna2015#test046',
  'manifest-urdna2015#test057'
]

function readFile (filename, dirname) {
  return fs.createReadStream(path.join(dirname, filename))
}

function readFileContent (filename, dirname) {
  return Promise.resolve(fs.readFileSync(path.join(dirname, filename)).toString())
}

function readFileDataset (filename, dirname) {
  let fileStream = readFile(filename, dirname)
  let quadStream = N3Parser.import(fileStream)

  return rdf.dataset().import(quadStream)
}

function listItems (graph, entry) {
  let items = []

  while (!entry.equals(ns.nil)) {
    items.push(graph.match(entry, ns.first).toArray().shift().object)
    entry = graph.match(entry, ns.rest).toArray().shift().object
  }

  return items
}

function processTest (graph, subject) {
  if (exclude.indexOf(subject.value) !== -1) {
    return () => {}
  }

  return () => {
    it('should pass test ' + subject.value, () => {
      let action = graph.match(subject, ns.action).toArray().shift().object.value
      let result = graph.match(subject, ns.result).toArray().shift().object.value

      return Promise.all([
        readFileDataset('./support/' + action, __dirname),
        readFileContent('./support/' + result, __dirname)
      ]).then((contents) => {
        let input = contents[0]
        let expected = contents[1]

        let actual = normalize(input)

        assert.equal(actual, expected)
      })
    })
  }
}

function processManifest (filename) {
  return readFileDataset(filename, __dirname).then((graph) => {
    let testEntry = graph.match(null, ns.entries).toArray().shift().object

    return listItems(graph, testEntry).map((testSubject) => {
      return processTest(graph, testSubject)
    })
  })
}

processManifest('./support/manifest-urdna2015.ttl').then((tests) => {
  describe('normalize', () => {
    describe('RDF Dataset Normalization (URDNA2015)', () => {
      tests.forEach((test) => {
        test()
      })
    })
  })

  run()
}).catch((error) => {
  console.error(error.stack || error.message)
})
