/* file : bind.ts
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
Object.defineProperty(exports, "__esModule", { value: true });
var pipeline_1 = require("../engine/pipeline/pipeline");
var sparql_expression_1 = require("./expressions/sparql-expression");
var utils_1 = require("../utils");
var lodash_1 = require("lodash");
/**
 * Test if an object is an iterator that yields RDF Terms or null values
 * @param obj - Input object
 * @return True if the input obkect is an iterator, False otherwise
 */
function isIterable(obj) {
    return typeof obj[Symbol.iterator] === 'function';
}
/**
 * Apply a SPARQL BIND clause
 * @see {@link https://www.w3.org/TR/sparql11-query/#bind}
 * @author Thomas Minier
 * @author Corentin Marionneau
 * @param source - Source {@link PipelineStage}
 * @param variable  - SPARQL variable used to bind results
 * @param expression - SPARQL expression
 * @return A {@link PipelineStage} which evaluate the BIND operation
 */
function bind(source, variable, expression, customFunctions) {
    var expr = new sparql_expression_1.SPARQLExpression(expression, customFunctions);
    return pipeline_1.Pipeline.getInstance().mergeMap(source, function (bindings) {
        try {
            var value_1 = expr.evaluate(bindings);
            if (value_1 !== null && (lodash_1.isArray(value_1) || isIterable(value_1))) {
                // build a source of bindings from the array/iterable produced by the expression's evaluation
                return pipeline_1.Pipeline.getInstance().fromAsync(function (input) {
                    var e_1, _a;
                    try {
                        try {
                            for (var value_2 = __values(value_1), value_2_1 = value_2.next(); !value_2_1.done; value_2_1 = value_2.next()) {
                                var term = value_2_1.value;
                                var mu = bindings.clone();
                                if (term === null) {
                                    mu.set(variable, utils_1.rdf.toN3(utils_1.rdf.createUnbound()));
                                }
                                else {
                                    mu.set(variable, utils_1.rdf.toN3(term));
                                }
                                input.next(mu);
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (value_2_1 && !value_2_1.done && (_a = value_2.return)) _a.call(value_2);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                    }
                    catch (e) {
                        input.error(e);
                    }
                    input.complete();
                });
            }
            else {
                // simple case: bound the value to the given variable in the set of bindings
                var res = bindings.clone();
                // null values indicates that an error occurs during the expression's evaluation
                // in this case, the variable is bind to a special UNBOUND value
                if (value_1 === null) {
                    res.set(variable, utils_1.rdf.toN3(utils_1.rdf.createUnbound()));
                }
                else {
                    res.set(variable, utils_1.rdf.toN3(value_1));
                }
                return pipeline_1.Pipeline.getInstance().of(res);
            }
        }
        catch (e) {
            // silence errors
        }
        return pipeline_1.Pipeline.getInstance().empty();
    });
}
exports.default = bind;
