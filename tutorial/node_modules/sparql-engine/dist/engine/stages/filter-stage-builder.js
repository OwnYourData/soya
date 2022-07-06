/* file : filter-stage-builder.ts
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
var exists_1 = require("../../operators/exists");
var sparql_filter_1 = require("../../operators/sparql-filter");
/**
 * A FilterStageBuilder evaluates FILTER clauses
 * @author Thomas Minier
 */
var FilterStageBuilder = /** @class */ (function (_super) {
    __extends(FilterStageBuilder, _super);
    function FilterStageBuilder() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FilterStageBuilder.prototype.execute = function (source, filterNode, customFunctions, context) {
        switch (filterNode.expression.operator) {
            case 'exists':
                return exists_1.default(source, filterNode.expression.args, this.builder, false, context);
            case 'notexists':
                return exists_1.default(source, filterNode.expression.args, this.builder, true, context);
            default:
                return sparql_filter_1.default(source, filterNode.expression, customFunctions);
        }
    };
    return FilterStageBuilder;
}(stage_builder_1.default));
exports.default = FilterStageBuilder;
