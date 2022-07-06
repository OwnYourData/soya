/* file : sparql-filter.ts
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
var sparql_expression_1 = require("./expressions/sparql-expression");
var utils_1 = require("../utils");
/**
 * Evaluate SPARQL Filter clauses
 * @see {@link https://www.w3.org/TR/sparql11-query/#expressions}
 * @author Thomas Minier
 * @param source - Input {@link PipelineStage}
 * @param expression - FILTER expression
 * @param customFunctions - User-defined SPARQL functions (optional)
 * @return A {@link PipelineStage} which evaluate the FILTER operation
 */
function sparqlFilter(source, expression, customFunctions) {
    var expr = new sparql_expression_1.SPARQLExpression(expression, customFunctions);
    return pipeline_1.Pipeline.getInstance().filter(source, function (bindings) {
        var value = expr.evaluate(bindings);
        if (value !== null && utils_1.rdf.termIsLiteral(value) && utils_1.rdf.literalIsBoolean(value)) {
            return utils_1.rdf.asJS(value.value, value.datatype.value);
        }
        return false;
    });
}
exports.default = sparqlFilter;
