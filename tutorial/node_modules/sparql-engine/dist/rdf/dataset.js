/* file : dataset.ts
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
var union_graph_1 = require("./union-graph");
/**
 * An abstraction over an RDF datasets, i.e., a collection of RDF graphs.
 * @abstract
 * @author Thomas Minier
 */
var Dataset = /** @class */ (function () {
    /**
     * Constructor
     */
    function Dataset() {
        this._graphFactory = function () { return null; };
    }
    /**
     * Get an UnionGraph, i.e., the dynamic union of several graphs,
     * from the RDF Graphs in the Dataset.
     * @param  iris           - Iris of the named graphs to include in the union
     * @param  includeDefault - True if the default graph should be included
     * @return The dynamic union of several graphs in the Dataset
     */
    Dataset.prototype.getUnionGraph = function (iris, includeDefault) {
        var _this = this;
        if (includeDefault === void 0) { includeDefault = false; }
        var graphs = [];
        if (includeDefault) {
            graphs.push(this.getDefaultGraph());
        }
        graphs = graphs.concat(iris.map(function (iri) { return _this.getNamedGraph(iri); }));
        return new union_graph_1.default(graphs);
    };
    /**
     * Returns all Graphs in the Dataset, including the Default one
     * @param  includeDefault - True if the default graph should be included
     * @return The list of all graphs in the Dataset
     */
    Dataset.prototype.getAllGraphs = function (includeDefault) {
        var _this = this;
        if (includeDefault === void 0) { includeDefault = true; }
        var graphs = [];
        if (includeDefault) {
            graphs.push(this.getDefaultGraph());
        }
        this.iris.forEach(function (iri) {
            graphs.push(_this.getNamedGraph(iri));
        });
        return graphs;
    };
    /**
     * Set the Graph Factory used by te dataset to create new RDF graphs on-demand
     * @param  factory - Graph Factory
     */
    Dataset.prototype.setGraphFactory = function (factory) {
        this._graphFactory = factory;
    };
    /**
     * Create a new RDF Graph, using the current Graph Factory.
     * This Graph factory can be set using the "setGraphFactory" method.
     * @param  iri - IRI of the graph to create
     * @return A new RDF Graph
     */
    Dataset.prototype.createGraph = function (iri) {
        var graph = this._graphFactory(iri);
        if (graph === null) {
            throw new Error("Impossible to create a new Graph with IRI \"" + iri + "\". The RDF dataset does not seems to have a graph factory. Please set it using the \"setGraphFactory\" method.");
        }
        return graph;
    };
    return Dataset;
}());
exports.default = Dataset;
