/* file : rewritings.ts
MIT License

Copyright (c) 2018-2020 Thomas Minier

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
'use strict';
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fts = exports.extractPropertyPaths = exports.rewriteMove = exports.rewriteCopy = exports.rewriteAdd = void 0;
var utils_1 = require("../../utils");
var lodash_1 = require("lodash");
/**
 * Create a triple pattern that matches all RDF triples in a graph
 * @private
 * @return A triple pattern that matches all RDF triples in a graph
 */
function allPattern() {
    return {
        subject: '?s',
        predicate: '?p',
        object: '?o'
    };
}
/**
 * Create a BGP that matches all RDF triples in a graph
 * @private
 * @return A BGP that matches all RDF triples in a graph
 */
function allBGP() {
    return {
        type: 'bgp',
        triples: [allPattern()]
    };
}
/**
 * Build a SPARQL GROUP that selects all RDF triples from the Default Graph or a Named Graph
 * @private
 * @param  source          - Source graph
 * @param  dataset         - RDF dataset used to select the source
 * @param  isSilent        - True if errors should not be reported
 * @param  [isWhere=false] - True if the GROUP should belong to a WHERE clause
 * @return The SPARQL GROUP clasue
 */
function buildGroupClause(source, dataset, isSilent) {
    if (source.default) {
        return allBGP();
    }
    else {
        // a SILENT modifier prevents errors when using an unknown graph
        if (!(dataset.hasNamedGraph(source.name)) && !isSilent) {
            throw new Error("Unknown Source Graph in ADD query " + source.name);
        }
        return {
            type: 'graph',
            name: source.name,
            triples: [allPattern()]
        };
    }
}
/**
 * Build a SPARQL WHERE that selects all RDF triples from the Default Graph or a Named Graph
 * @private
 * @param  source          - Source graph
 * @param  dataset         - RDF dataset used to select the source
 * @param  isSilent        - True if errors should not be reported
 * @param  [isWhere=false] - True if the GROUP should belong to a WHERE clause
 * @return The SPARQL GROUP clasue
 */
function buildWhereClause(source, dataset, isSilent) {
    if (source.default) {
        return allBGP();
    }
    else {
        // a SILENT modifier prevents errors when using an unknown graph
        if (!(dataset.hasNamedGraph(source.name)) && !isSilent) {
            throw new Error("Unknown Source Graph in ADD query " + source.name);
        }
        var bgp = {
            type: 'bgp',
            triples: [allPattern()]
        };
        return {
            type: 'graph',
            name: source.name,
            patterns: [bgp]
        };
    }
}
/**
 * Rewrite an ADD query into a INSERT query
 * @see https://www.w3.org/TR/2013/REC-sparql11-update-20130321/#add
 * @param  addQuery - Parsed ADD query
 * @param  dataset - related RDF dataset
 * @return Rewritten ADD query
 */
function rewriteAdd(addQuery, dataset) {
    return {
        updateType: 'insertdelete',
        silent: addQuery.silent,
        insert: [buildGroupClause(addQuery.destination, dataset, addQuery.silent)],
        where: [buildWhereClause(addQuery.source, dataset, addQuery.silent)]
    };
}
exports.rewriteAdd = rewriteAdd;
/**
 * Rewrite a COPY query into a CLEAR + INSERT/DELETE query
 * @see https://www.w3.org/TR/2013/REC-sparql11-update-20130321/#copy
 * @param copyQuery - Parsed COPY query
 * @param dataset - related RDF dataset
 * @return Rewritten COPY query, i.e., a sequence [CLEAR query, INSERT query]
 */
function rewriteCopy(copyQuery, dataset) {
    // first, build a CLEAR query to empty the destination
    var clear = {
        type: 'clear',
        silent: copyQuery.silent,
        graph: { type: 'graph' }
    };
    if (copyQuery.destination.default) {
        clear.graph.default = true;
    }
    else {
        clear.graph.type = copyQuery.destination.type;
        clear.graph.name = copyQuery.destination.name;
    }
    // then, build an INSERT query to copy the data
    var update = rewriteAdd(copyQuery, dataset);
    return [clear, update];
}
exports.rewriteCopy = rewriteCopy;
/**
 * Rewrite a MOVE query into a CLEAR + INSERT/DELETE + CLEAR query
 * @see https://www.w3.org/TR/2013/REC-sparql11-update-20130321/#move
 * @param moveQuery - Parsed MOVE query
 * @param dataset - related RDF dataset
 * @return Rewritten MOVE query, i.e., a sequence [CLEAR query, INSERT query, CLEAR query]
 */
function rewriteMove(moveQuery, dataset) {
    // first, build a classic COPY query
    var _a = __read(rewriteCopy(moveQuery, dataset), 2), clearBefore = _a[0], update = _a[1];
    // then, append a CLEAR query to clear the source graph
    var clearAfter = {
        type: 'clear',
        silent: moveQuery.silent,
        graph: { type: 'graph' }
    };
    if (moveQuery.source.default) {
        clearAfter.graph.default = true;
    }
    else {
        clearAfter.graph.type = moveQuery.source.type;
        clearAfter.graph.name = moveQuery.source.name;
    }
    return [clearBefore, update, clearAfter];
}
exports.rewriteMove = rewriteMove;
/**
 * Extract property paths triples and classic triples from a set of RDF triples.
 * It also performs a first rewriting of some property paths.
 * @param  bgp - Set of RDF triples
 * @return A tuple [classic triples, triples with property paths, set of variables added during rewriting]
 */
function extractPropertyPaths(bgp) {
    var parts = lodash_1.partition(bgp.triples, function (triple) { return typeof (triple.predicate) === 'string'; });
    var classicTriples = parts[0];
    var pathTriples = parts[1];
    var variables = [];
    // TODO: change bgp evaluation's behavior for ask queries when subject and object are given
    /*if (pathTriples.length > 0) {
      // review property paths and rewrite those equivalent to a regular BGP
      const paths: Algebra.PathTripleObject[] = []
      // first rewriting phase
      pathTriples.forEach((triple, tIndex) => {
        const t = triple as Algebra.PathTripleObject
        // 1) unpack sequence paths into a set of RDF triples
        if (t.predicate.pathType === '/') {
          t.predicate.items.forEach((pred, seqIndex) => {
            const joinVar = `?seq_${tIndex}_join_${seqIndex}`
            const nextJoinVar = `?seq_${tIndex}_join_${seqIndex + 1}`
            variables.push(joinVar)
            // non-property paths triples are fed to the BGP executor
            if (typeof(pred) === 'string') {
              classicTriples.push({
                subject: (seqIndex == 0) ? triple.subject : joinVar,
                predicate: pred,
                object: (seqIndex == t.predicate.items.length - 1) ? triple.object : nextJoinVar
              })
            } else {
              paths.push({
                subject: (seqIndex == 0) ? triple.subject : joinVar,
                predicate: pred,
                object: (seqIndex == t.predicate.items.length - 1) ? triple.object : nextJoinVar
              })
            }
          })
        } else {
          paths.push(t)
        }
      })
      pathTriples = paths
    }*/
    return [classicTriples, pathTriples, variables];
}
exports.extractPropertyPaths = extractPropertyPaths;
/**
 * Rewriting utilities for Full Text Search queries
 */
var fts;
(function (fts) {
    /**
     * Extract all full text search queries from a BGP, using magic triples to identify them.
     * A magic triple is an IRI prefixed by 'https://callidon.github.io/sparql-engine/search#' (ses:search, ses:rank, ses:minRank, etc).
     * @param bgp - BGP to analyze
     * @return The extraction results
     */
    function extractFullTextSearchQueries(bgp) {
        var queries = [];
        var classicPatterns = [];
        // find, validate and group all magic triples per query variable
        var patterns = [];
        var magicGroups = new Map();
        var prefix = utils_1.rdf.SES('');
        bgp.forEach(function (triple) {
            // A magic triple is an IRI prefixed by 'https://callidon.github.io/sparql-engine/search#'
            if (utils_1.rdf.isIRI(triple.predicate) && triple.predicate.startsWith(prefix)) {
                // assert that the magic triple's subject is a variable
                if (!utils_1.rdf.isVariable(triple.subject)) {
                    throw new SyntaxError("Invalid Full Text Search query: the subject of the magic triple " + triple + " must a valid URI/IRI.");
                }
                if (!magicGroups.has(triple.subject)) {
                    magicGroups.set(triple.subject, [triple]);
                }
                else {
                    magicGroups.get(triple.subject).push(triple);
                }
            }
            else {
                patterns.push(triple);
            }
        });
        // find all triple pattern whose object is the subject of some magic triples
        patterns.forEach(function (pattern) {
            if (magicGroups.has(pattern.subject)) {
                queries.push({
                    pattern: pattern,
                    variable: pattern.subject,
                    magicTriples: magicGroups.get(pattern.subject)
                });
            }
            else if (magicGroups.has(pattern.object)) {
                queries.push({
                    pattern: pattern,
                    variable: pattern.object,
                    magicTriples: magicGroups.get(pattern.object)
                });
            }
            else {
                classicPatterns.push(pattern);
            }
        });
        return { queries: queries, classicPatterns: classicPatterns };
    }
    fts.extractFullTextSearchQueries = extractFullTextSearchQueries;
})(fts = exports.fts || (exports.fts = {}));
