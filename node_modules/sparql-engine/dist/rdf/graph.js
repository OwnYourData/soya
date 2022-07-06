/* file : graph.ts
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
Object.defineProperty(exports, "__esModule", { value: true });
var pipeline_1 = require("../engine/pipeline/pipeline");
var index_join_1 = require("../operators/join/index-join");
var utils_1 = require("../utils");
var bindings_1 = require("./bindings");
var graph_capability_1 = require("./graph_capability");
var lodash_1 = require("lodash");
function parseCapabilities(registry, proto) {
    registry.set(graph_capability_1.GRAPH_CAPABILITY.ESTIMATE_TRIPLE_CARD, proto.estimateCardinality != null);
    registry.set(graph_capability_1.GRAPH_CAPABILITY.UNION, proto.evalUnion != null);
}
/**
 * An abstract RDF Graph, accessed through a RDF Dataset
 * @abstract
 * @author Thomas Minier
 */
var Graph = /** @class */ (function () {
    function Graph() {
        this._iri = '';
        this._capabilities = new Map();
        parseCapabilities(this._capabilities, Object.getPrototypeOf(this));
    }
    Object.defineProperty(Graph.prototype, "iri", {
        /**
         * Get the IRI of the Graph
         * @return The IRI of the Graph
         */
        get: function () {
            return this._iri;
        },
        /**
         * Set the IRI of the Graph
         * @param value - The new IRI of the Graph
         */
        set: function (value) {
            this._iri = value;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Test if a graph has a capability
     * @param  token - Capability tested
     * @return True if the graph has the reuqested capability, false otherwise
     */
    Graph.prototype._isCapable = function (token) {
        return this._capabilities.has(token) && this._capabilities.get(token);
    };
    /**
     * Estimate the cardinality of a Triple pattern, i.e., the number of matching RDF Triples in the RDF Graph.
     * @param  triple - Triple pattern to estimate cardinality
     * @return A Promise fulfilled with the pattern's estimated cardinality
     */
    Graph.prototype.estimateCardinality = function (triple) {
        throw new SyntaxError('Error: this graph is not capable of estimating the cardinality of a triple pattern');
    };
    /**
     * Get a {@link PipelineStage} which finds RDF triples matching a triple pattern and a set of keywords in the RDF Graph.
     * The search can be constrained by min and max relevance (a 0 to 1 score signifying how closely the literal matches the search terms).
     *
     * The {@link Graph} class provides a default implementation that computes the relevance
     * score as the percentage of words matching the list of input keywords.
     * If the minRank and/or maxRanks parameters are used, then
     * the graph materializes all matching RDF triples, sort them by descending rank and then
     * selects the appropriates ranks.
     * Otherwise, the rank is not computed and all triples are associated with a rank of -1.
     *
     * Consequently, the default implementation should works fines for a basic usage, but more advanced users
     * should provides their own implementation, integrated with their own backend.
     * For example, a SQL-based RDF Graph should rely on GIN or GIST indexes for the full text search.
     * @param pattern - Triple pattern to find
     * @param variable - SPARQL variable on which the keyword search is performed
     * @param keywords - List of keywords to seach for occurence
     * @param matchAll - True if only values that contain all of the specified search terms should be considered.
     * @param minRelevance - Minimum relevance score (set it to null to disable it)
     * @param maxRelevance - Maximum relevance score (set it to null to disable it)
     * @param minRank - Minimum rank of the matches (set it to null to disable it)
     * @param maxRank - Maximum rank of the matches (set it to null to disable it)
     * @param context - Execution options
     * @return A {@link PipelineInput} which output tuples of shape [matching RDF triple, score, rank].
     * @example
     * const pattern = { subject: '?s', predicate: 'foaf:name', object: '?n'}
     * const keywords = [ 'Ann' , 'Bob' ]
     * // Find the top 100 RDF triples matching the pattern where ?n contains the keyword 'Ann' or 'Bob'
     * // with a minimum relevance score of 0.25 and no maximum relevance score.
     * const pipeline = graph.fullTextSearch(pattern, '?n', keywords, 0.25, null, null, 100, context)
     * pipeline.subscribe(item => {
     *   console.log(`Matching RDF triple ${item[0]} with score ${item[1]} and rank ${item[2]}`)
     * }, console.error, () => console.log('Search completed!'))
     */
    Graph.prototype.fullTextSearch = function (pattern, variable, keywords, matchAll, minRelevance, maxRelevance, minRank, maxRank, context) {
        if (lodash_1.isNull(minRelevance)) {
            minRelevance = 0;
        }
        if (lodash_1.isNull(maxRelevance)) {
            maxRelevance = Number.MAX_SAFE_INTEGER;
        }
        // find all RDF triples matching the input triple pattern
        var source = pipeline_1.Pipeline.getInstance().from(this.find(pattern, context));
        // compute the score of each matching RDF triple as the average number of words
        // in the RDF term that matches kewyords
        var iterator = pipeline_1.Pipeline.getInstance().map(source, function (triple) {
            var words = [];
            if (pattern.subject === variable) {
                words = triple.subject.split(' ');
            }
            else if (pattern.predicate === variable) {
                words = triple.predicate.split(' ');
            }
            else if (pattern.object === variable) {
                words = triple.object.split(' ');
            }
            // For each keyword, compute % of words matching the keyword
            var keywordScores = keywords.map(function (keyword) {
                return words.reduce(function (acc, word) {
                    if (word.includes(keyword)) {
                        acc += 1;
                    }
                    return acc;
                }, 0) / words.length;
            });
            // if we should match all keyword, not matching a single keyword gives you a score of 0
            if (matchAll && keywordScores.some(function (v) { return v === 0; })) {
                return { triple: triple, rank: -1, score: 0 };
            }
            // The relevance score is computed as the average keyword score
            return { triple: triple, rank: -1, score: lodash_1.round(lodash_1.mean(keywordScores), 3) };
        });
        // filter by min & max relevance scores
        iterator = pipeline_1.Pipeline.getInstance().filter(iterator, function (v) {
            return v.score > 0 && minRelevance <= v.score && v.score <= maxRelevance;
        });
        // if needed, rank the matches by descending score
        if (!lodash_1.isNull(minRank) || !lodash_1.isNull(maxRank)) {
            if (lodash_1.isNull(minRank)) {
                minRank = 0;
            }
            if (lodash_1.isNull(maxRank)) {
                maxRank = Number.MAX_SAFE_INTEGER;
            }
            // null or negative values for minRank and/or maxRank will yield no results
            if (minRank < 0 || maxRank < 0) {
                return pipeline_1.Pipeline.getInstance().empty();
            }
            // ranks the matches, and then only keeps the desired ranks
            iterator = pipeline_1.Pipeline.getInstance().flatMap(pipeline_1.Pipeline.getInstance().collect(iterator), function (values) {
                return lodash_1.orderBy(values, ['score'], ['desc'])
                    // add rank
                    .map(function (item, rank) {
                    item.rank = rank;
                    return item;
                })
                    // slice using the minRank and maxRank parameters
                    .slice(minRank, maxRank + 1);
            });
        }
        // finally, format results as tuples [RDF triple, triple's score, triple's rank]
        return pipeline_1.Pipeline.getInstance().map(iterator, function (v) { return [v.triple, v.score, v.rank]; });
    };
    /**
     * Evaluates an union of Basic Graph patterns on the Graph using a {@link PipelineStage}.
     * @param  patterns - The set of BGPs to evaluate
     * @param  context - Execution options
     * @return A {@link PipelineStage} which evaluates the Basic Graph pattern on the Graph
     */
    Graph.prototype.evalUnion = function (patterns, context) {
        throw new SyntaxError('Error: this graph is not capable of evaluating UNION queries');
    };
    /**
     * Evaluates a Basic Graph pattern, i.e., a set of triple patterns, on the Graph using a {@link PipelineStage}.
     * @param  bgp - The set of triple patterns to evaluate
     * @param  context - Execution options
     * @return A {@link PipelineStage} which evaluates the Basic Graph pattern on the Graph
     */
    Graph.prototype.evalBGP = function (bgp, context) {
        var _this = this;
        var engine = pipeline_1.Pipeline.getInstance();
        if (this._isCapable(graph_capability_1.GRAPH_CAPABILITY.ESTIMATE_TRIPLE_CARD)) {
            var op = engine.from(Promise.all(bgp.map(function (triple) {
                return _this.estimateCardinality(triple).then(function (c) {
                    return { triple: triple, cardinality: c, nbVars: utils_1.rdf.countVariables(triple) };
                });
            })));
            return engine.mergeMap(op, function (results) {
                var sortedPatterns = utils_1.sparql.leftLinearJoinOrdering(lodash_1.sortBy(results, 'cardinality').map(function (t) { return t.triple; }));
                var start = engine.of(new bindings_1.BindingBase());
                return sortedPatterns.reduce(function (iter, t) {
                    return index_join_1.default(iter, t, _this, context);
                }, start);
            });
        }
        else {
            // FIX ME: this trick is required, otherwise ADD, COPY and MOVE queries are not evaluated correctly. We need to find why...
            return engine.mergeMap(engine.from(Promise.resolve(null)), function () {
                var start = engine.of(new bindings_1.BindingBase());
                return utils_1.sparql.leftLinearJoinOrdering(bgp).reduce(function (iter, t) {
                    return index_join_1.default(iter, t, _this, context);
                }, start);
            });
        }
    };
    return Graph;
}());
exports.default = Graph;
// disable optional methods
Object.defineProperty(Graph.prototype, 'estimateCardinality', { value: null });
Object.defineProperty(Graph.prototype, 'evalUnion', { value: null });
