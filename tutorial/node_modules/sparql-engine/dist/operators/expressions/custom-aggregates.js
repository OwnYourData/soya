/* file : custom-aggregations.ts
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
var utils_1 = require("../../utils");
var lodash_1 = require("lodash");
function precision(expected, predicted) {
    var intersection = lodash_1.intersectionWith(expected, predicted, function (x, y) { return utils_1.rdf.termEquals(x, y); });
    return intersection.length / predicted.length;
}
function recall(expected, predicted) {
    var intersection = lodash_1.intersectionWith(expected, predicted, function (x, y) { return utils_1.rdf.termEquals(x, y); });
    return intersection.length / expected.length;
}
/**
 * Implementation of Non standard SPARQL aggregations offered by the framework
 * All arguments are pre-compiled from string to RDF.js terms
 * @author Thomas Minier
 */
exports.default = {
    /*
      Accuracy metrics, often used in machine learning
    */
    // Accuracy: computes percentage of times two variables have different values
    // In regular SPARQL, equivalent to sum(if(?a = ?b, 1, 0)) / count(*)
    'https://callidon.github.io/sparql-engine/aggregates#accuracy': function (a, b, rows) {
        var tests = lodash_1.zip(rows[a], rows[b]).map(function (v) {
            if (lodash_1.isUndefined(v[0]) || lodash_1.isUndefined(v[1])) {
                return 0;
            }
            return utils_1.rdf.termEquals(v[0], v[1]) ? 1 : 0;
        });
        return utils_1.rdf.createFloat(lodash_1.sum(tests) / tests.length);
    },
    // Geometric mean (https://en.wikipedia.org/wiki/Geometric_mean)
    // "The geometric mean is a mean or average, which indicates the central tendency or typical value of a set of
    // numbers by using the product of their values (as opposed to the arithmetic mean which uses their sum)."
    'https://callidon.github.io/sparql-engine/aggregates#gmean': function (variable, rows) {
        if (variable in rows) {
            var count = rows[variable].length;
            var product = rows[variable].map(function (term) {
                if (utils_1.rdf.termIsLiteral(term) && utils_1.rdf.literalIsNumeric(term)) {
                    return utils_1.rdf.asJS(term.value, term.datatype.value);
                }
                return 1;
            }).reduce(function (acc, value) { return acc * value; }, 1);
            return utils_1.rdf.createFloat(Math.pow(product, 1 / count));
        }
        throw new SyntaxError("SPARQL aggregation error: the variable " + variable + " cannot be found in the groups " + rows);
    },
    // Mean Square error: computes the average of the squares of the errors, that is
    // the average squared difference between the estimated values and the actual value.
    // In regular SPARQL, equivalent to sum(?a - ?b) * (?a - ?b / count(*))
    'https://callidon.github.io/sparql-engine/aggregates#mse': function (a, b, rows) {
        var values = lodash_1.zip(rows[a], rows[b]).map(function (v) {
            var expected = v[0];
            var predicted = v[1];
            if (lodash_1.isUndefined(predicted) || lodash_1.isUndefined(expected)) {
                return 0;
            }
            else if (utils_1.rdf.termIsLiteral(predicted) && utils_1.rdf.termIsLiteral(expected) && utils_1.rdf.literalIsNumeric(predicted) && utils_1.rdf.literalIsNumeric(expected)) {
                return Math.pow(utils_1.rdf.asJS(expected.value, expected.datatype.value) - utils_1.rdf.asJS(predicted.value, predicted.datatype.value), 2);
            }
            throw new SyntaxError("SPARQL aggregation error: cannot compute mean square error between RDF Terms " + expected + " and " + predicted + ", as they are not numbers");
        });
        return utils_1.rdf.createFloat((1 / values.length) * lodash_1.sum(values));
    },
    // Root mean Square error: computes the root of the average of the squares of the errors
    // In regular SPARQL, equivalent to sqrt(sum(?a - ?b) * (?a - ?b / count(*)))
    'https://callidon.github.io/sparql-engine/aggregates#rmse': function (a, b, rows) {
        var values = lodash_1.zip(rows[a], rows[b]).map(function (v) {
            var expected = v[0];
            var predicted = v[1];
            if (lodash_1.isUndefined(predicted) || lodash_1.isUndefined(expected)) {
                return 0;
            }
            else if (utils_1.rdf.termIsLiteral(predicted) && utils_1.rdf.termIsLiteral(expected) && utils_1.rdf.literalIsNumeric(predicted) && utils_1.rdf.literalIsNumeric(expected)) {
                return Math.pow(utils_1.rdf.asJS(expected.value, expected.datatype.value) - utils_1.rdf.asJS(predicted.value, predicted.datatype.value), 2);
            }
            throw new SyntaxError("SPARQL aggregation error: cannot compute mean square error between RDF Terms " + expected + " and " + predicted + ", as they are not numbers");
        });
        return utils_1.rdf.createFloat(Math.sqrt((1 / values.length) * lodash_1.sum(values)));
    },
    // Precision: the fraction of retrieved values that are relevant to the query
    'https://callidon.github.io/sparql-engine/aggregates#precision': function (a, b, rows) {
        if (!(a in rows) || !(b in rows)) {
            return utils_1.rdf.createFloat(0);
        }
        return utils_1.rdf.createFloat(precision(rows[a], rows[b]));
    },
    // Recall: the fraction of retrieved values that are successfully retrived
    'https://callidon.github.io/sparql-engine/aggregates#recall': function (a, b, rows) {
        if (!(a in rows) || !(b in rows)) {
            return utils_1.rdf.createFloat(0);
        }
        return utils_1.rdf.createFloat(recall(rows[a], rows[b]));
    },
    // F1 score: The F1 score can be interpreted as a weighted average of the precision and recall, where an F1 score reaches its best value at 1 and worst score at 0.
    'https://callidon.github.io/sparql-engine/aggregates#f1': function (a, b, rows) {
        if (!(a in rows) || !(b in rows)) {
            return utils_1.rdf.createFloat(0);
        }
        var prec = precision(rows[a], rows[b]);
        var rec = recall(rows[a], rows[b]);
        return utils_1.rdf.createFloat(2 * (prec * rec) / (prec + rec));
    }
};
