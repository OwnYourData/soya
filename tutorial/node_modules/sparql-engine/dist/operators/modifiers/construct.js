/* file : construct.ts
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
var pipeline_1 = require("../../engine/pipeline/pipeline");
var lodash_1 = require("lodash");
var utils_1 = require("../../utils");
/**
 * A ConstructOperator transform solution mappings into RDF triples, according to a template
 * @see {@link https://www.w3.org/TR/2013/REC-sparql11-query-20130321/#construct}
 * @param source  - Source {@link PipelineStage}
 * @param templates - Set of triples patterns in the CONSTRUCT clause
 * @return A {@link PipelineStage} which evaluate the CONSTRUCT modifier
 * @author Thomas Minier
 */
function construct(source, query) {
    var rawTriples = [];
    var templates = query.template.filter(function (t) {
        if (utils_1.rdf.isVariable(t.subject) || utils_1.rdf.isVariable(t.predicate) || utils_1.rdf.isVariable(t.object)) {
            return true;
        }
        rawTriples.push(t);
        return false;
    });
    var engine = pipeline_1.Pipeline.getInstance();
    return engine.endWith(engine.flatMap(source, function (bindings) {
        return lodash_1.compact(templates.map(function (t) { return bindings.bound(t); }));
    }), rawTriples);
}
exports.default = construct;
