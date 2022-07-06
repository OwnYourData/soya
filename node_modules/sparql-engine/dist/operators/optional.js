/* file : optional-iterator.ts
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
/**
 * Handles an SPARQL OPTIONAL clause
 * @see {@link https://www.w3.org/TR/sparql11-query/#optionals}
 * @author Thomas Minier
 * @param source - Input {@link PipelineStage}
 * @param patterns - OPTIONAL clause, i.e., a SPARQL group pattern
 * @param builder - Instance of the current {@link PlanBuilder}
 * @param context - Execution context
 * @return A {@link PipelineStage} which evaluate the OPTIONAL operation
 */
function optional(source, patterns, builder, context) {
    var seenBefore = [];
    var engine = pipeline_1.Pipeline.getInstance();
    var start = engine.tap(source, function (bindings) {
        seenBefore.push(bindings);
    });
    var leftOp = builder._buildWhere(start, patterns, context);
    leftOp = engine.tap(leftOp, function (bindings) {
        // remove values that matches a results from seenBefore
        var index = seenBefore.findIndex(function (b) {
            return b.isSubset(bindings);
        });
        if (index >= 0) {
            seenBefore.splice(index, 1);
        }
    });
    return engine.merge(leftOp, engine.from(seenBefore));
}
exports.default = optional;
