/* file : xml-formatter.ts
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
var utils_1 = require("../utils");
var lodash_1 = require("lodash");
var xml = require("xml");
function _writeBoolean(input, root) {
    root.push({ boolean: input });
}
function _writeBindings(input, results) {
    // convert sets of bindings into objects of RDF Terms
    var bindings = input.filter(function (value) { return !lodash_1.isNull(value[1]) && !lodash_1.isUndefined(value[1]); })
        .reduce(function (obj, variable, value) {
        obj[variable] = utils_1.rdf.fromN3(value);
        return obj;
    }, {});
    // Write the result tag for this set of bindings
    results.push({
        result: lodash_1.map(bindings, function (value, variable) {
            var xmlTag;
            if (utils_1.rdf.termIsIRI(value)) {
                xmlTag = { uri: value.value };
            }
            else if (utils_1.rdf.termIsBNode(value)) {
                xmlTag = { bnode: value.value };
            }
            else if (utils_1.rdf.termIsLiteral(value)) {
                if (value.language === '') {
                    xmlTag = { literal: [
                            { _attr: { 'xml:lang': value.language } },
                            value.value
                        ] };
                }
                else {
                    xmlTag = { literal: [
                            { _attr: { datatype: value.datatype.value } },
                            value.value
                        ] };
                }
            }
            else {
                throw new Error("Unsupported RDF Term type: " + value);
            }
            return {
                binding: [
                    { _attr: { name: variable.substring(1) } },
                    xmlTag
                ]
            };
        })
    });
}
/**
 * Formats query solutions (bindings or booleans) from a PipelineStage in W3C SPARQL XML format
 * @see https://www.w3.org/TR/2013/REC-rdf-sparql-XMLres-20130321/
 * @author Thomas Minier
 * @author Corentin Marionneau
 * @param source - Input pipeline
 * @return A pipeline s-that yields results in W3C SPARQL XML format
 */
function xmlFormat(source) {
    var results = xml.element({});
    var root = xml.element({
        _attr: { xmlns: 'http://www.w3.org/2005/sparql-results#' },
        results: results
    });
    var stream = xml({ sparql: root }, { stream: true, indent: '\t', declaration: true });
    return pipeline_1.Pipeline.getInstance().fromAsync(function (input) {
        // manually pipe the xml stream's results into the pipeline
        stream.on('error', function (err) { return input.error(err); });
        stream.on('end', function () { return input.complete(); });
        var warmup = true;
        source.subscribe(function (b) {
            // Build the head attribute from the first set of bindings
            if (warmup && !lodash_1.isBoolean(b)) {
                var variables = Array.from(b.variables());
                root.push({
                    head: variables.filter(function (name) { return name !== '*'; }).map(function (name) {
                        return { variable: { _attr: { name: name } } };
                    })
                });
                warmup = false;
            }
            // handle results (boolean for ASK queries, bindings for SELECT queries)
            if (lodash_1.isBoolean(b)) {
                _writeBoolean(b, root);
            }
            else {
                _writeBindings(b, results);
            }
        }, function (err) { return console.error(err); }, function () {
            results.close();
            root.close();
        });
        // consume the xml stream
        stream.on('data', function (x) { return input.next(x); });
    });
}
exports.default = xmlFormat;
