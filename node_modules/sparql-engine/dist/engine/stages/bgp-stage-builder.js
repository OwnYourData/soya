/* file : bgp-stage-builder.ts
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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var stage_builder_1 = require("./stage-builder");
var pipeline_1 = require("../pipeline/pipeline");
var bindings_1 = require("../../rdf/bindings");
var graph_capability_1 = require("../../rdf/graph_capability");
var query_hints_1 = require("../context/query-hints");
var rewritings_1 = require("./rewritings");
var symbols_1 = require("../context/symbols");
var utils_1 = require("../../utils");
var lodash_1 = require("lodash");
var bound_join_1 = require("../../operators/join/bound-join");
/**
 * Basic {@link PipelineStage} used to evaluate Basic graph patterns using the "evalBGP" method
 * available
 * @private
 */
function bgpEvaluation(source, bgp, graph, builder, context) {
    var engine = pipeline_1.Pipeline.getInstance();
    return engine.mergeMap(source, function (bindings) {
        var boundedBGP = bgp.map(function (t) { return bindings.bound(t); });
        // check the cache
        var iterator;
        if (context.cachingEnabled()) {
            iterator = utils_1.evaluation.cacheEvalBGP(boundedBGP, graph, context.cache, builder, context);
        }
        else {
            iterator = graph.evalBGP(boundedBGP, context);
        }
        // build join results
        return engine.map(iterator, function (item) {
            // if (item.size === 0 && hasVars) return null
            return item.union(bindings);
        });
    });
}
/**
 * A BGPStageBuilder evaluates Basic Graph Patterns in a SPARQL query.
 * Users can extend this class and overrides the "_buildIterator" method to customize BGP evaluation.
 * @author Thomas Minier
 * @author Corentin Marionneau
 */
var BGPStageBuilder = /** @class */ (function (_super) {
    __extends(BGPStageBuilder, _super);
    function BGPStageBuilder() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Return the RDF Graph to be used for BGP evaluation.
     * * If `iris` is empty, returns the default graph
     * * If `iris` has a single entry, returns the corresponding named graph
     * * Otherwise, returns an UnionGraph based on the provided iris
     * @param  iris - List of Graph's iris
     * @return An RDF Graph
     */
    BGPStageBuilder.prototype._getGraph = function (iris) {
        if (iris.length === 0) {
            return this.dataset.getDefaultGraph();
        }
        else if (iris.length === 1) {
            return this.dataset.getNamedGraph(iris[0]);
        }
        return this.dataset.getUnionGraph(iris);
    };
    /**
     * Build a {@link PipelineStage} to evaluate a BGP
     * @param  source    - Input {@link PipelineStage}
     * @param  patterns  - Set of triple patterns
     * @param  options   - Execution options
     * @return A {@link PipelineStage} used to evaluate a Basic Graph pattern
     */
    BGPStageBuilder.prototype.execute = function (source, patterns, context) {
        var _this = this;
        // avoids sending a request with an empty array
        if (patterns.length === 0)
            return source;
        // extract eventual query hints from the BGP & merge them into the context
        var extraction = query_hints_1.parseHints(patterns, context.hints);
        context.hints = extraction[1];
        // extract full text search queries from the BGP
        // they will be executed after the main BGP, to ensure an average best join ordering
        var extractionResults = rewritings_1.fts.extractFullTextSearchQueries(extraction[0]);
        // rewrite the BGP to remove blank node addedd by the Turtle notation
        var _a = __read(this._replaceBlankNodes(extractionResults.classicPatterns), 2), bgp = _a[0], artificals = _a[1];
        // if the graph is a variable, go through each binding and look for its value
        if (context.defaultGraphs.length > 0 && utils_1.rdf.isVariable(context.defaultGraphs[0])) {
            var engine_1 = pipeline_1.Pipeline.getInstance();
            return engine_1.mergeMap(source, function (value) {
                var iri = value.get(context.defaultGraphs[0]);
                // if the graph doesn't exist in the dataset, then create one with the createGraph factrory
                var graphs = _this.dataset.getAllGraphs().filter(function (g) { return g.iri === iri; });
                var graph = (graphs.length > 0) ? graphs[0] : (iri !== null) ? _this.dataset.createGraph(iri) : null;
                if (graph) {
                    var iterator_1 = _this._buildIterator(engine_1.from([value]), graph, bgp, context);
                    if (artificals.length > 0) {
                        iterator_1 = engine_1.map(iterator_1, function (b) { return b.filter(function (variable) { return artificals.indexOf(variable) < 0; }); });
                    }
                    return iterator_1;
                }
                throw new Error("Cant' find or create the graph " + iri);
            });
        }
        // select the graph to use for BGP evaluation
        var graph = (context.defaultGraphs.length > 0) ? this._getGraph(context.defaultGraphs) : this.dataset.getDefaultGraph();
        var iterator = this._buildIterator(source, graph, bgp, context);
        // evaluate all full text search queries found previously
        if (extractionResults.queries.length > 0) {
            iterator = extractionResults.queries.reduce(function (prev, query) {
                return _this._buildFullTextSearchIterator(prev, graph, query.pattern, query.variable, query.magicTriples, context);
            }, iterator);
        }
        // remove artificials variables from bindings
        if (artificals.length > 0) {
            iterator = pipeline_1.Pipeline.getInstance().map(iterator, function (b) { return b.filter(function (variable) { return artificals.indexOf(variable) < 0; }); });
        }
        return iterator;
    };
    /**
     * Replace the blank nodes in a BGP by SPARQL variables
     * @param patterns - BGP to rewrite, i.e., a set of triple patterns
     * @return A Tuple [Rewritten BGP, List of SPARQL variable added]
     */
    BGPStageBuilder.prototype._replaceBlankNodes = function (patterns) {
        var newVariables = [];
        function rewrite(term) {
            var res = term;
            if (term.startsWith('_:')) {
                res = '?' + term.slice(2);
                if (newVariables.indexOf(res) < 0) {
                    newVariables.push(res);
                }
            }
            return res;
        }
        var newBGP = patterns.map(function (p) {
            return {
                subject: rewrite(p.subject),
                predicate: rewrite(p.predicate),
                object: rewrite(p.object)
            };
        });
        return [newBGP, newVariables];
    };
    /**
     * Returns a {@link PipelineStage} used to evaluate a Basic Graph pattern
     * @param  source         - Input {@link PipelineStage}
     * @param  graph          - The graph on which the BGP should be executed
     * @param  patterns       - Set of triple patterns
     * @param  context        - Execution options
     * @return A {@link PipelineStage} used to evaluate a Basic Graph pattern
     */
    BGPStageBuilder.prototype._buildIterator = function (source, graph, patterns, context) {
        if (graph._isCapable(graph_capability_1.GRAPH_CAPABILITY.UNION) && !context.hasProperty(symbols_1.default.FORCE_INDEX_JOIN)) {
            return bound_join_1.default(source, patterns, graph, this, context);
        }
        return bgpEvaluation(source, patterns, graph, this, context);
    };
    /**
     * Returns a {@link PipelineStage} used to evaluate a Full Text Search query from a set of magic patterns.
     * @param  source         - Input {@link PipelineStage}
     * @param  graph          - The graph on which the full text search should be executed
     * @param  pattern        - Input triple pattern
     * @param  queryVariable  - SPARQL variable on which the full text search is performed
     * @param  magicTriples   - Set of magic triple patterns used to configure the full text search
     * @param  context        - Execution options
     * @return A {@link PipelineStage} used to evaluate the Full Text Search query
     */
    BGPStageBuilder.prototype._buildFullTextSearchIterator = function (source, graph, pattern, queryVariable, magicTriples, context) {
        // full text search default parameters
        var keywords = [];
        var matchAll = false;
        var minScore = null;
        var maxScore = null;
        var minRank = null;
        var maxRank = null;
        // flags & variables used to add the score and/or rank to the solutions
        var addScore = false;
        var addRank = false;
        var scoreVariable = '';
        var rankVariable = '';
        // compute all other parameters from the set of magic triples
        magicTriples.forEach(function (triple) {
            // assert that the magic triple is correct
            if (triple.subject !== queryVariable) {
                throw new SyntaxError("Invalid Full Text Search query: the query variable " + queryVariable + " is not the subject of the magic triple " + triple);
            }
            switch (triple.predicate) {
                // keywords: ?o ses:search “neil gaiman”
                case utils_1.rdf.SES('search'): {
                    if (!utils_1.rdf.isLiteral(triple.object)) {
                        throw new SyntaxError("Invalid Full Text Search query: the object of the magic triple " + triple + " must be a RDF Literal.");
                    }
                    keywords = utils_1.rdf.getLiteralValue(triple.object).split(' ');
                    break;
                }
                // match all keywords: ?o ses:matchAllTerms "true"
                case utils_1.rdf.SES('matchAllTerms'): {
                    var value = utils_1.rdf.getLiteralValue(triple.object).toLowerCase();
                    matchAll = value === 'true' || value === '1';
                    break;
                }
                // min relevance score: ?o ses:minRelevance “0.25”
                case utils_1.rdf.SES('minRelevance'): {
                    if (!utils_1.rdf.isLiteral(triple.object)) {
                        throw new SyntaxError("Invalid Full Text Search query: the object of the magic triple " + triple + " must be a RDF Literal.");
                    }
                    minScore = Number(utils_1.rdf.getLiteralValue(triple.object));
                    // assert that the magic triple's object is a valid number
                    if (lodash_1.isNaN(minScore)) {
                        throw new SyntaxError("Invalid Full Text Search query: the object of the magic triple " + triple + " must be a valid number.");
                    }
                    break;
                }
                // max relevance score: ?o ses:maxRelevance “0.75”
                case utils_1.rdf.SES('maxRelevance'): {
                    if (!utils_1.rdf.isLiteral(triple.object)) {
                        throw new SyntaxError("Invalid Full Text Search query: the object of the magic triple " + triple + " must be a RDF Literal.");
                    }
                    maxScore = Number(utils_1.rdf.getLiteralValue(triple.object));
                    // assert that the magic triple's object is a valid number
                    if (lodash_1.isNaN(maxScore)) {
                        throw new SyntaxError("Invalid Full Text Search query: the object of the magic triple " + triple + " must be a valid number.");
                    }
                    break;
                }
                // min rank: ?o ses:minRank "5" .
                case utils_1.rdf.SES('minRank'): {
                    if (!utils_1.rdf.isLiteral(triple.object)) {
                        throw new SyntaxError("Invalid Full Text Search query: the object of the magic triple " + triple + " must be a RDF Literal.");
                    }
                    minRank = Number(utils_1.rdf.getLiteralValue(triple.object));
                    // assert that the magic triple's object is a valid positive integre
                    if (lodash_1.isNaN(minRank) || !lodash_1.isInteger(minRank) || minRank < 0) {
                        throw new SyntaxError("Invalid Full Text Search query: the object of the magic triple " + triple + " must be a valid positive integer.");
                    }
                    break;
                }
                // max rank: ?o ses:maxRank “1000” .
                case utils_1.rdf.SES('maxRank'): {
                    if (!utils_1.rdf.isLiteral(triple.object)) {
                        throw new SyntaxError("Invalid Full Text Search query: the object of the magic triple " + triple + " must be a RDF Literal.");
                    }
                    maxRank = Number(utils_1.rdf.getLiteralValue(triple.object));
                    // assert that the magic triple's object is a valid positive integer
                    if (lodash_1.isNaN(maxRank) || !lodash_1.isInteger(maxRank) || maxRank < 0) {
                        throw new SyntaxError("Invalid Full Text Search query: the object of the magic triple " + triple + " must be a valid positive integer.");
                    }
                    break;
                }
                // include relevance score: ?o ses:relevance ?score .
                case utils_1.rdf.SES('relevance'): {
                    if (!utils_1.rdf.isVariable(triple.object)) {
                        throw new SyntaxError("Invalid Full Text Search query: the object of the magic triple " + triple + " must be a SPARQL variable.");
                    }
                    addScore = true;
                    scoreVariable = triple.object;
                    break;
                }
                // include rank: ?o ses:rank ?rank .
                case utils_1.rdf.SES('rank'): {
                    if (!utils_1.rdf.isVariable(triple.object)) {
                        throw new SyntaxError("Invalid Full Text Search query: the object of the magic triple " + triple + " must be a SPARQL variable.");
                    }
                    addRank = true;
                    rankVariable = triple.object;
                    // Set minRank to its base value if needed, to force
                    // the default Graph#fullTextSearch implementation to compute relevant ranks.
                    // With no custom implementations, this will not be an issue
                    if (minRank === null) {
                        minRank = 0;
                    }
                    break;
                }
                // do nothing for unknown magic triples
                default: {
                    break;
                }
            }
        });
        // assert that minScore <= maxScore
        if (!lodash_1.isNull(minScore) && !lodash_1.isNull(maxScore) && minScore > maxScore) {
            throw new SyntaxError("Invalid Full Text Search query: the maximum relevance score should be greater than or equal to the minimum relevance score (for query on pattern " + pattern + " with min_score=" + minScore + " and max_score=" + maxScore + ")");
        }
        // assert than minRank <= maxRank
        if (!lodash_1.isNull(minRank) && !lodash_1.isNull(maxRank) && minRank > maxRank) {
            throw new SyntaxError("Invalid Full Text Search query: the maximum rank should be be greater than or equal to the minimum rank (for query on pattern " + pattern + " with min_rank=" + minRank + " and max_rank=" + maxRank + ")");
        }
        // join the input bindings with the full text search operation
        return pipeline_1.Pipeline.getInstance().mergeMap(source, function (bindings) {
            var boundedPattern = bindings.bound(pattern);
            // delegate the actual full text search to the RDF graph
            var iterator = graph.fullTextSearch(boundedPattern, queryVariable, keywords, matchAll, minScore, maxScore, minRank, maxRank, context);
            return pipeline_1.Pipeline.getInstance().map(iterator, function (item) {
                // unpack search results
                var _a = __read(item, 3), triple = _a[0], score = _a[1], rank = _a[2];
                // build solutions bindings from the matching RDF triple
                var mu = new bindings_1.BindingBase();
                if (utils_1.rdf.isVariable(boundedPattern.subject) && !utils_1.rdf.isVariable(triple.subject)) {
                    mu.set(boundedPattern.subject, triple.subject);
                }
                if (utils_1.rdf.isVariable(boundedPattern.predicate) && !utils_1.rdf.isVariable(triple.predicate)) {
                    mu.set(boundedPattern.predicate, triple.predicate);
                }
                if (utils_1.rdf.isVariable(boundedPattern.object) && !utils_1.rdf.isVariable(triple.object)) {
                    mu.set(boundedPattern.object, triple.object);
                }
                // add score and rank if required
                if (addScore) {
                    mu.set(scoreVariable, "\"" + score + "\"^^" + utils_1.rdf.XSD('float'));
                }
                if (addRank) {
                    mu.set(rankVariable, "\"" + rank + "\"^^" + utils_1.rdf.XSD('integer'));
                }
                // Merge with input bindings and then return the final results
                return bindings.union(mu);
            });
        });
    };
    return BGPStageBuilder;
}(stage_builder_1.default));
exports.default = BGPStageBuilder;
