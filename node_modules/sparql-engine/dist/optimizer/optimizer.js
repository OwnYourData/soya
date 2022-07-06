/* file : optimizer.ts
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
var union_merge_1 = require("./visitors/union-merge");
/**
 * An Optimizer applies a set of optimization rules, implemented using subclasses of {@link PlanVisitor}.
 * @author Thomas Minier
 */
var Optimizer = /** @class */ (function () {
    function Optimizer() {
        this._visitors = [];
    }
    /**
     * Get an optimizer configured with the default optimization rules
     * @return A new Optimizer pre-configured with default rules
     */
    Optimizer.getDefault = function () {
        var opt = new Optimizer();
        opt.addVisitor(new union_merge_1.default());
        return opt;
    };
    /**
     * Register a new visitor, which implements an optimization rule.
     * @param visitor - Visitor
     */
    Optimizer.prototype.addVisitor = function (visitor) {
        this._visitors.push(visitor);
    };
    /**
     * Optimize a SPARQL query expression tree, by applying the set of rules.
     * @param  plan - SPARQL query expression tree to iptimize
     * @return Optimized SPARQL query expression tree
     */
    Optimizer.prototype.optimize = function (plan) {
        return this._visitors.reduce(function (current, v) { return v.visit(current); }, plan);
    };
    return Optimizer;
}());
exports.default = Optimizer;
