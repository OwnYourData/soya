/* file : service-stage-builder.ts
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
var pipeline_1 = require("../pipeline/pipeline");
var symbols_1 = require("../context/symbols");
/**
 * A ServiceStageBuilder is responsible for evaluation a SERVICE clause in a SPARQL query.
 * @author Thomas Minier
 * @author Corentin Marionneau
 */
var ServiceStageBuilder = /** @class */ (function (_super) {
    __extends(ServiceStageBuilder, _super);
    function ServiceStageBuilder() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Build a {@link PipelineStage} to evaluate a SERVICE clause
     * @param  source  - Input {@link PipelineStage}
     * @param  node    - Service clause
     * @param  options - Execution options
     * @return A {@link PipelineStage} used to evaluate a SERVICE clause
     */
    ServiceStageBuilder.prototype.execute = function (source, node, context) {
        var subquery;
        if (node.patterns[0].type === 'query') {
            subquery = node.patterns[0];
        }
        else {
            subquery = {
                prefixes: context.getProperty(symbols_1.default.PREFIXES),
                queryType: 'SELECT',
                variables: ['*'],
                type: 'query',
                where: node.patterns
            };
        }
        // auto-add the graph used to evaluate the SERVICE close if it is missing from the dataset
        if ((this.dataset.getDefaultGraph().iri !== node.name) && (!this.dataset.hasNamedGraph(node.name))) {
            var graph = this.dataset.createGraph(node.name);
            this.dataset.addNamedGraph(node.name, graph);
        }
        var handler = undefined;
        if (node.silent) {
            handler = function () {
                return pipeline_1.Pipeline.getInstance().empty();
            };
        }
        return pipeline_1.Pipeline.getInstance().catch(this._buildIterator(source, node.name, subquery, context), handler);
    };
    /**
     * Returns a {@link PipelineStage} used to evaluate a SERVICE clause
     * @abstract
     * @param source    - Input {@link PipelineStage}
     * @param iri       - Iri of the SERVICE clause
     * @param subquery  - Subquery to be evaluated
     * @param options   - Execution options
     * @return A {@link PipelineStage} used to evaluate a SERVICE clause
     */
    ServiceStageBuilder.prototype._buildIterator = function (source, iri, subquery, context) {
        var opts = context.clone();
        opts.defaultGraphs = [iri];
        return this._builder._buildQueryPlan(subquery, opts, source);
    };
    return ServiceStageBuilder;
}(stage_builder_1.default));
exports.default = ServiceStageBuilder;
