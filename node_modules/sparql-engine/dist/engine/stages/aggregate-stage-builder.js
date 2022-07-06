/* file : aggregate-stage-builder.ts
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
Object.defineProperty(exports, "__esModule", { value: true });
var stage_builder_1 = require("./stage-builder");
var bind_1 = require("../../operators/bind");
var sparql_filter_1 = require("../../operators/sparql-filter");
var sparql_groupby_1 = require("../../operators/sparql-groupby");
var lodash_1 = require("lodash");
/**
 * An AggregateStageBuilder handles the evaluation of Aggregations operations,
 * GROUP BY and HAVING clauses in SPARQL queries.
 * @see https://www.w3.org/TR/sparql11-query/#aggregates
 * @author Thomas Minier
 */
var AggregateStageBuilder = /** @class */ (function (_super) {
    __extends(AggregateStageBuilder, _super);
    function AggregateStageBuilder() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Build a {@link PipelineStage} for the evaluation of SPARQL aggregations
     * @param source  - Input {@link PipelineStage}
     * @param query   - Parsed SPARQL query (logical execution plan)
     * @param options - Execution options
     * @return A {@link PipelineStage} which evaluate SPARQL aggregations
     */
    AggregateStageBuilder.prototype.execute = function (source, query, context, customFunctions) {
        var iterator = source;
        // group bindings using the GROUP BY clause
        // WARNING: an empty GROUP BY clause will create a single group with all bindings
        iterator = this._executeGroupBy(source, query.group || [], context, customFunctions);
        // next, apply the optional HAVING clause to filter groups
        if ('having' in query) {
            iterator = this._executeHaving(iterator, query.having || [], context, customFunctions);
        }
        return iterator;
    };
    /**
     * Build a {@link PipelineStage} for the evaluation of a GROUP BY clause
     * @param source  - Input {@link PipelineStage}
     * @param  groupby - GROUP BY clause
     * @param  options - Execution options
     * @return A {@link PipelineStage} which evaluate a GROUP BY clause
     */
    AggregateStageBuilder.prototype._executeGroupBy = function (source, groupby, context, customFunctions) {
        var iterator = source;
        // extract GROUP By variables & rewrite SPARQL expressions into BIND clauses
        var groupingVars = [];
        groupby.forEach(function (g) {
            if (lodash_1.isString(g.expression)) {
                groupingVars.push(g.expression);
            }
            else {
                groupingVars.push(g.variable);
                iterator = bind_1.default(iterator, g.variable, g.expression, customFunctions);
            }
        });
        return sparql_groupby_1.default(iterator, groupingVars);
    };
    /**
     * Build a {@link PipelineStage} for the evaluation of a HAVING clause
     * @param  source  - Input {@link PipelineStage}
     * @param  having  - HAVING clause
     * @param  options - Execution options
     * @return A {@link PipelineStage} which evaluate a HAVING clause
     */
    AggregateStageBuilder.prototype._executeHaving = function (source, having, context, customFunctions) {
        // thanks to the flexibility of SPARQL expressions,
        // we can rewrite a HAVING clause in a set of FILTER clauses!
        return having.reduce(function (iter, expression) {
            return sparql_filter_1.default(iter, expression, customFunctions);
        }, source);
    };
    return AggregateStageBuilder;
}(stage_builder_1.default));
exports.default = AggregateStageBuilder;
