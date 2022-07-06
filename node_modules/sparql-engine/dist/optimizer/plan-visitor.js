/* file : plan-visitor.ts
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
var lodash_1 = require("lodash");
/**
 * A Visitor which performs a Depth-first traversal of a SPARQL query expression tree
 * and transforms each node.
 * Subclasses are used to implements SPARQl query optimization rules.
 * @author Thomas Minier
 */
var PlanVisitor = /** @class */ (function () {
    function PlanVisitor() {
    }
    /**
     * Visit all nodes starting from this one, using a depth-first traversal,
     * and transform them.
     * @param  node - Root of the expression tree to traverse
     * @return The transformed expression tree
     */
    PlanVisitor.prototype.visit = function (node) {
        var _this = this;
        switch (node.type) {
            case 'query':
                var newNode = lodash_1.cloneDeep(node);
                newNode.where = node.where.map(function (n) { return _this.visit(n); });
                return newNode;
            case 'bgp':
                return this.visitBGP(node);
            case 'union':
                return this.visitUnion(node);
            case 'optional':
                return this.visitOptional(node);
            case 'group':
                return this.visitGroup(node);
            case 'filter':
                return this.visitFilter(node);
            case 'service':
                return this.visitService(node);
            case 'bind':
                return this.visitBind(node);
            case 'values':
                return this.visitValues(node);
            default:
                return node;
        }
    };
    /**
     * Visit and transform a Basic Graph Pattern node.
     * By default, peform no transformation on the node.
     * @param  node - Basic Graph Pattern node
     * @return The transformed Basic Graph Pattern node
     */
    PlanVisitor.prototype.visitBGP = function (node) {
        return node;
    };
    /**
     * Visit and transform a SPARQL Group pattern node.
     * By default, recursively transform all members of the group.
     * @param  node - SPARQL Group pattern node
     * @return The transformed SPARQL Group pattern node
     */
    PlanVisitor.prototype.visitGroup = function (node) {
        var _this = this;
        var newNode = lodash_1.cloneDeep(node);
        newNode.patterns = newNode.patterns.map(function (p) { return _this.visit(p); });
        return newNode;
    };
    /**
     * Visit and transform a SPARQL OPTIONAL node.
     * By default, recursively transform all members of the OPTIONAL.
     * @param  node - SPARQL OPTIONAL node
     * @return The transformed SPARQL OPTIONAL node
     */
    PlanVisitor.prototype.visitOptional = function (node) {
        var _this = this;
        var newNode = lodash_1.cloneDeep(node);
        newNode.patterns = newNode.patterns.map(function (p) { return _this.visit(p); });
        return newNode;
    };
    /**
     * Visit and transform a SPARQL UNION node.
     * By default, recursively transform all members of the UNION.
     * @param  node - SPARQL UNION node
     * @return The transformed SPARQL UNION node
     */
    PlanVisitor.prototype.visitUnion = function (node) {
        var _this = this;
        var newNode = lodash_1.cloneDeep(node);
        newNode.patterns = newNode.patterns.map(function (p) { return _this.visit(p); });
        return newNode;
    };
    /**
     * Visit and transform a SPARQL FILTER node.
     * By default, peform no transformation on the node.
     * @param  node - SPARQL FILTER node
     * @return The transformed SPARQL FILTER node
     */
    PlanVisitor.prototype.visitFilter = function (node) {
        return node;
    };
    /**
     * Visit and transform a SPARQL GRAPH node.
     * By default, recursively transform all members of the GRAPH.
     * @param  node - SPARQL GRAPH node
     * @return The transformed SPARQL GRAPH node
     */
    PlanVisitor.prototype.visitGraph = function (node) {
        var _this = this;
        var newNode = lodash_1.cloneDeep(node);
        newNode.patterns = newNode.patterns.map(function (p) { return _this.visit(p); });
        return newNode;
    };
    /**
     * Visit and transform a SPARQL SERVICE node.
     * By default, recursively transform all members of the SERVICE.
     * @param  node - SPARQL SERVICE node
     * @return The transformed SPARQL SERVICE node
     */
    PlanVisitor.prototype.visitService = function (node) {
        var _this = this;
        var newNode = lodash_1.cloneDeep(node);
        newNode.patterns = newNode.patterns.map(function (p) { return _this.visit(p); });
        return newNode;
    };
    /**
     * Visit and transform a SPARQL BIND node.
     * By default, peform no transformation on the node.
     * @param  node - SPARQL BIND node
     * @return The transformed SPARQL BIND node
     */
    PlanVisitor.prototype.visitBind = function (node) {
        return node;
    };
    /**
     * Visit and transform a SPARQL VALUES node.
     * By default, peform no transformation on the node.
     * @param  node - SPARQL VALUES node
     * @return The transformed SPARQL VALUES node
     */
    PlanVisitor.prototype.visitValues = function (node) {
        return node;
    };
    return PlanVisitor;
}());
exports.default = PlanVisitor;
