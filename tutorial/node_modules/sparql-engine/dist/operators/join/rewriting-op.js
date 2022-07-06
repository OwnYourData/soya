/* file : rewriting-op.ts
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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
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
/**
 * Find a rewriting key in a list of variables
 * For example, in [ ?s, ?o_1 ], the rewriting key is 1
 * @private
 */
function findKey(variables, maxValue) {
    var e_1, _a;
    if (maxValue === void 0) { maxValue = 15; }
    var key = -1;
    try {
        for (var variables_1 = __values(variables), variables_1_1 = variables_1.next(); !variables_1_1.done; variables_1_1 = variables_1.next()) {
            var v = variables_1_1.value;
            for (var i = 0; i < maxValue; i++) {
                if (v.endsWith("_" + i)) {
                    return i;
                }
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (variables_1_1 && !variables_1_1.done && (_a = variables_1.return)) _a.call(variables_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return key;
}
/**
 * Undo the bound join rewriting on solutions bindings, e.g., rewrite all variables "?o_1" to "?o"
 * @private
 */
function revertBinding(key, input, variables) {
    var e_2, _a;
    var newBinding = input.empty();
    try {
        for (var variables_2 = __values(variables), variables_2_1 = variables_2.next(); !variables_2_1.done; variables_2_1 = variables_2.next()) {
            var vName = variables_2_1.value;
            var suffix = "_" + key;
            if (vName.endsWith(suffix)) {
                var index = vName.indexOf(suffix);
                newBinding.set(vName.substring(0, index), input.get(vName));
            }
            else {
                newBinding.set(vName, input.get(vName));
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (variables_2_1 && !variables_2_1.done && (_a = variables_2.return)) _a.call(variables_2);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return newBinding;
}
/**
 * Undo the rewriting on solutions bindings, and then merge each of them with the corresponding input binding
 * @private
 */
function rewriteSolutions(bindings, rewritingMap) {
    var key = findKey(bindings.variables());
    // rewrite binding, and then merge it with the corresponding one in the bucket
    var newBinding = revertBinding(key, bindings, bindings.variables());
    if (rewritingMap.has(key)) {
        newBinding = newBinding.union(rewritingMap.get(key));
    }
    return newBinding;
}
/**
 * A special operator used to evaluate a UNION query with a RDF Graph,
 * and then rewrite bindings generated and performs union with original bindings.
 * It is designed to be used in the bound join algorithm
 * @author Thomas Minier
 * @private
 * @param  graph - Graph queried
 * @param  bgpBucket - List of BGPs to evaluate
 * @param  rewritingTable - Map <rewriting key -> original bindings>
 * @param  context - Query execution context
 * @return A pipeline stage which evaluates the query.
 */
function rewritingOp(graph, bgpBucket, rewritingTable, builder, context) {
    var _a;
    var source;
    if (context.cachingEnabled()) {
        // partition the BGPs that can be evaluated using the cache from the others
        var stages_1 = [];
        var others_1 = [];
        bgpBucket.forEach(function (patterns) {
            if (context.cache.has({ patterns: patterns, graphIRI: graph.iri })) {
                stages_1.push(utils_1.evaluation.cacheEvalBGP(patterns, graph, context.cache, builder, context));
            }
            else {
                others_1.push(patterns);
            }
        });
        // merge all sources from the cache first, and then the evaluation of bgp that are not in the cache
        source = pipeline_1.Pipeline.getInstance().merge((_a = pipeline_1.Pipeline.getInstance()).merge.apply(_a, __spread(stages_1)), graph.evalUnion(others_1, context));
    }
    else {
        source = graph.evalUnion(bgpBucket, context);
    }
    return pipeline_1.Pipeline.getInstance().map(source, function (bindings) { return rewriteSolutions(bindings, rewritingTable); });
}
exports.default = rewritingOp;
