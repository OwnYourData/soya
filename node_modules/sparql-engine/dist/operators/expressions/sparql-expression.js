/* file : sparql-expression.ts
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
exports.SPARQLExpression = void 0;
var sparql_aggregates_1 = require("./sparql-aggregates");
var sparql_operations_1 = require("./sparql-operations");
var custom_aggregates_1 = require("./custom-aggregates");
var custom_operations_1 = require("./custom-operations");
var utils_1 = require("../../utils");
var lodash_1 = require("lodash");
/**
 * Test if a SPARQL expression is a SPARQL operation
 * @param expr - SPARQL expression, in sparql.js format
 * @return True if the SPARQL expression is a SPARQL operation, False otherwise
 */
function isOperation(expr) {
    return expr.type === 'operation';
}
/**
 * Test if a SPARQL expression is a SPARQL aggregation
 * @param expr - SPARQL expression, in sparql.js format
 * @return True if the SPARQL expression is a SPARQL aggregation, False otherwise
 */
function isAggregation(expr) {
    return expr.type === 'aggregate';
}
/**
 * Test if a SPARQL expression is a SPARQL function call (like a custom function)
 * @param expr - SPARQL expression, in sparql.js format
 * @return True if the SPARQL expression is a SPARQL function call, False otherwise
 */
function isFunctionCall(expr) {
    return expr.type === 'functionCall';
}
/**
 * Get a function that, given a SPARQL variable, fetch the associated RDF Term in an input set of bindings,
 * or null if it was not found.
 * @param variable - SPARQL variable
 * A fetch the RDF Term associated with the variable in an input set of bindings, or null if it was not found.
 */
function bindArgument(variable) {
    return function (bindings) {
        if (bindings.has(variable)) {
            return utils_1.rdf.fromN3(bindings.get(variable));
        }
        return null;
    };
}
/**
 * Compile and evaluate a SPARQL expression (found in FILTER clauses, for example)
 * @author Thomas Minier
 */
var SPARQLExpression = /** @class */ (function () {
    /**
     * Constructor
     * @param expression - SPARQL expression
     */
    function SPARQLExpression(expression, customFunctions) {
        // merge custom operations defined by the framework & by the user
        var customs = lodash_1.merge({}, custom_operations_1.default, customFunctions);
        this._expression = this._compileExpression(expression, customs);
    }
    /**
     * Recursively compile a SPARQL expression into a function
     * @param  expression - SPARQL expression
     * @return Compiled SPARQL expression
     */
    SPARQLExpression.prototype._compileExpression = function (expression, customFunctions) {
        var _this = this;
        // case 1: the expression is a SPARQL variable to bound or a RDF term
        if (lodash_1.isString(expression)) {
            if (utils_1.rdf.isVariable(expression)) {
                return bindArgument(expression);
            }
            var compiledTerm_1 = utils_1.rdf.fromN3(expression);
            return function () { return compiledTerm_1; };
        }
        else if (lodash_1.isArray(expression)) {
            // case 2: the expression is a list of RDF terms
            // because IN and NOT IN expressions accept arrays as argument
            var compiledTerms_1 = expression.map(utils_1.rdf.fromN3);
            return function () { return compiledTerms_1; };
        }
        else if (isOperation(expression)) {
            // case 3: a SPARQL operation, so we recursively compile each argument
            // and then evaluate the expression
            var args_1 = expression.args.map(function (arg) { return _this._compileExpression(arg, customFunctions); });
            if (!(expression.operator in sparql_operations_1.default)) {
                throw new Error("Unsupported SPARQL operation: " + expression.operator);
            }
            var operation_1 = sparql_operations_1.default[expression.operator];
            return function (bindings) { return operation_1.apply(void 0, __spread(args_1.map(function (arg) { return arg(bindings); }))); };
        }
        else if (isAggregation(expression)) {
            // case 3: a SPARQL aggregation
            if (!(expression.aggregation in sparql_aggregates_1.default)) {
                throw new Error("Unsupported SPARQL aggregation: " + expression.aggregation);
            }
            var aggregation_1 = sparql_aggregates_1.default[expression.aggregation];
            return function (bindings) {
                if (bindings.hasProperty('__aggregate')) {
                    var aggVariable = expression.expression;
                    var rows = bindings.getProperty('__aggregate');
                    if (expression.distinct) {
                        rows[aggVariable] = lodash_1.uniqBy(rows[aggVariable], utils_1.rdf.toN3);
                    }
                    return aggregation_1(aggVariable, rows, expression.separator);
                }
                throw new SyntaxError("SPARQL aggregation error: you are trying to use the " + expression.aggregation + " SPARQL aggregate outside of an aggregation query.");
            };
        }
        else if (isFunctionCall(expression)) {
            // last case: the expression is a custom function
            var customFunction_1;
            var isAggregate = false;
            var functionName_1 = expression.function;
            // custom aggregations defined by the framework
            if (functionName_1.toLowerCase() in custom_aggregates_1.default) {
                isAggregate = true;
                customFunction_1 = custom_aggregates_1.default[functionName_1.toLowerCase()];
            }
            else if (functionName_1 in customFunctions) {
                // custom operations defined by the user & the framework
                customFunction_1 = customFunctions[functionName_1];
            }
            else {
                throw new SyntaxError("Custom function could not be found: " + functionName_1);
            }
            if (isAggregate) {
                return function (bindings) {
                    if (bindings.hasProperty('__aggregate')) {
                        var rows = bindings.getProperty('__aggregate');
                        return customFunction_1.apply(void 0, __spread(expression.args, [rows]));
                    }
                    throw new SyntaxError("SPARQL aggregation error: you are trying to use the " + functionName_1 + " SPARQL aggregate outside of an aggregation query.");
                };
            }
            return function (bindings) {
                try {
                    var args = expression.args.map(function (args) { return _this._compileExpression(args, customFunctions); });
                    return customFunction_1.apply(void 0, __spread(args.map(function (arg) { return arg(bindings); })));
                }
                catch (e) {
                    // In section 10 of the sparql docs (https://www.w3.org/TR/sparql11-query/#assignment) it states:
                    // "If the evaluation of the expression produces an error, the variable remains unbound for that solution but the query evaluation continues."
                    // unfortunately this means the error is silent unless some logging is introduced here,
                    // which is probably not desired unless a logging framework is introduced
                    return null;
                }
            };
        }
        throw new Error("Unsupported SPARQL operation type found: " + expression.type);
    };
    /**
     * Evaluate the expression using a set of mappings
     * @param  bindings - Set of mappings
     * @return Results of the evaluation
     */
    SPARQLExpression.prototype.evaluate = function (bindings) {
        return this._expression(bindings);
    };
    return SPARQLExpression;
}());
exports.SPARQLExpression = SPARQLExpression;
