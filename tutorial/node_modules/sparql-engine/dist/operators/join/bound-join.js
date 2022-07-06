/* file : bind-join.ts
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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var pipeline_1 = require("../../engine/pipeline/pipeline");
var utils_1 = require("../../utils");
var symbols_1 = require("../../engine/context/symbols");
var rewriting_op_1 = require("./rewriting-op");
// The default size of the bucket of Basic Graph Patterns used by the Bound Join algorithm
var BOUND_JOIN_BUFFER_SIZE = 15;
/**
 * Rewrite a triple pattern using a rewriting key,
 * i.e., append "_key" to each SPARQL variable in the triple pattern
 * @author Thomas Minier
 * @param key - Rewriting key
 * @param tp - Triple pattern to rewrite
 * @return The rewritten triple pattern
 */
function rewriteTriple(triple, key) {
    var res = Object.assign({}, triple);
    if (utils_1.rdf.isVariable(triple.subject)) {
        res.subject = triple.subject + "_" + key;
    }
    if (utils_1.rdf.isVariable(triple.predicate)) {
        res.predicate = triple.predicate + "_" + key;
    }
    if (utils_1.rdf.isVariable(triple.object)) {
        res.object = triple.object + "_" + key;
    }
    return res;
}
/**
 * Join the set of bindings produced by a pipeline stage with a BGP using the Bound Join algorithm.
 * @author Thomas Minier
 * @param  source - Source of bindings
 * @param  bgp - Basic Pattern to join with
 * @param  graph - Graphe queried
 * @param  Context - Query execution context
 * @return A pipeline stage which evaluates the bound join
 */
function boundJoin(source, bgp, graph, builder, context) {
    var bufferSize = BOUND_JOIN_BUFFER_SIZE;
    if (context.hasProperty(symbols_1.default.BOUND_JOIN_BUFFER_SIZE)) {
        bufferSize = context.getProperty(symbols_1.default.BOUND_JOIN_BUFFER_SIZE);
    }
    return pipeline_1.Pipeline.getInstance().mergeMap(pipeline_1.Pipeline.getInstance().bufferCount(source, bufferSize), function (bucket) {
        var _a;
        // simple case: first join in the pipeline
        if (bucket.length === 1 && bucket[0].isEmpty) {
            if (context.cachingEnabled()) {
                return utils_1.evaluation.cacheEvalBGP(bgp, graph, context.cache, builder, context);
            }
            return graph.evalBGP(bgp, context);
        }
        else {
            // The bucket of rewritten basic graph patterns
            var bgpBucket_1 = [];
            // The bindings of the bucket that cannot be evaluated with a bound join for this BGP
            var regularBindings_1 = [];
            // A rewriting table dedicated to this instance of the bound join
            var rewritingTable_1 = new Map();
            // The rewriting key (a simple counter) for this instance of the bound join
            var key_1 = 0;
            // Build the bucket of Basic Graph patterns
            bucket.map(function (binding) {
                var boundedBGP = [];
                var nbBounded = 0;
                // build the bounded BGP using the current set of bindings
                bgp.forEach(function (triple) {
                    var boundedTriple = rewriteTriple(binding.bound(triple), key_1);
                    boundedBGP.push(boundedTriple);
                    // track the number of fully bounded triples, i.e., triple patterns without any SPARQL variables
                    if (!utils_1.rdf.isVariable(boundedTriple.subject) && !utils_1.rdf.isVariable(boundedTriple.predicate) && !utils_1.rdf.isVariable(boundedTriple.object)) {
                        nbBounded++;
                    }
                });
                // if the whole BGP is bounded, then the current set of bindings cannot be processed
                // using a bound join and we must process it using a regular Index Join.
                // Otherwise, the partially bounded BGP is suitable for a bound join
                if (nbBounded === bgp.length) {
                    regularBindings_1.push(binding);
                }
                else {
                    // save the rewriting into the table
                    rewritingTable_1.set(key_1, binding);
                    bgpBucket_1.push(boundedBGP);
                }
                key_1++;
            });
            var boundJoinStage = pipeline_1.Pipeline.getInstance().empty();
            var regularJoinStage = pipeline_1.Pipeline.getInstance().empty();
            // first, evaluates the bucket of partially bounded BGPs using a bound join
            if (bgpBucket_1.length > 0) {
                boundJoinStage = rewriting_op_1.default(graph, bgpBucket_1, rewritingTable_1, builder, context);
            }
            // then, evaluates the remaining bindings using a bound join
            if (regularBindings_1.length > 0) {
                // otherwiwe, we create a new context to force the execution using Index Joins
                var newContext = context.clone();
                newContext.setProperty(symbols_1.default.FORCE_INDEX_JOIN, true);
                // Invoke the BGPStageBuilder to evaluate the bucket
                regularJoinStage = builder._buildIterator((_a = pipeline_1.Pipeline.getInstance()).of.apply(_a, __spread(regularBindings_1)), graph, bgp, newContext);
            }
            // merge the two pipeline stages to produce the join results
            return pipeline_1.Pipeline.getInstance().merge(boundJoinStage, regularJoinStage);
        }
    });
    /*return Pipeline.getInstance().fromAsync((input: StreamPipelineInput<Bindings>) => {
      let sourceClosed = false
      let activeIterators = 0
  
      // Check if a custom bucket size for the bound join buffer has been set by in the context
      // Otherwise, use the default one
      let bufferSize = BOUND_JOIN_BUFFER_SIZE
      if (context.hasProperty(ContextSymbols.BOUND_JOIN_BUFFER_SIZE)) {
        bufferSize = context.getProperty(ContextSymbols.BOUND_JOIN_BUFFER_SIZE)
      }
  
      // Utility function used to close the processing
      // after all active iterators have completed
      function tryClose () {
        activeIterators--
        if (sourceClosed && activeIterators === 0) {
          input.complete()
        }
      }
  
      // Buffer the output of the pipeline to generates bucket,
      // then apply the bound join algorithm to perform the join
      // between the bucket of bindings and the input BGP
      Pipeline.getInstance()
        .bufferCount(source, bufferSize)
        .subscribe(bucket => {
          activeIterators++
          // simple case: first join in the pipeline
          if (bucket.length === 1 && bucket[0].isEmpty) {
            let iterator
            if (context.cachingEnabled()) {
              iterator = evaluation.cacheEvalBGP(bgp, graph, context.cache!, builder, context)
            } else {
              iterator = graph.evalBGP(bgp, context)
            }
            iterator.subscribe((b: Bindings) => {
              input.next(b)
            }, (err: Error) => input.error(err), () => tryClose())
          } else {
            // The bucket of rewritten basic graph patterns
            const bgpBucket: BasicGraphPattern[] = []
            // A rewriting table dedicated to this instance of the bound join
            const rewritingTable = new Map()
            // The rewriting key (a simple counter) for this instance of the bound join
            let key = 0
  
            // Build the bucket of Basic Graph patterns
            bucket.map(binding => {
              const boundedBGP: BasicGraphPattern = []
              bgp.forEach(triple => {
                let boundedTriple: Algebra.TripleObject = binding.bound(triple)
                // rewrite the triple pattern and save the rewriting into the table
                boundedTriple = rewriteTriple(boundedTriple, key)
                rewritingTable.set(key, binding)
                boundedBGP.push(boundedTriple)
              })
              bgpBucket.push(boundedBGP)
              key++
            })
            // Evaluates the bucket using the Sage server
            rewritingOp(graph, bgpBucket, rewritingTable, builder, context)
              .subscribe(b => input.next(b), err => input.error(err), () => tryClose())
          }
        }, err => input.error(err), () => { sourceClosed = true })
    })*/
}
exports.default = boundJoin;
