/* file : custom-operations.ts
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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../../utils");
/**
 * Implementation of NON standard SPARQL operations offered by the framework
 * All arguments are pre-compiled from string to RDF.js terms
 * @author Thomas Minier
 */
exports.default = {
    /*
      Hyperbolic functions (cosh, sinh, tanh, ...)
      https://en.wikipedia.org/wiki/Hyperbolic_function
    */
    // Hyperbolic cosinus
    'https://callidon.github.io/sparql-engine/functions#cosh': function (x) {
        if (utils_1.rdf.termIsLiteral(x) && utils_1.rdf.literalIsNumeric(x)) {
            var value = utils_1.rdf.asJS(x.value, x.datatype.value);
            return utils_1.rdf.createFloat(Math.cosh(value));
        }
        throw new SyntaxError("SPARQL expression error: cannot compute the hyperbolic cosinus of " + x + ", as it is not a number");
    },
    // Hyperbolic sinus
    'https://callidon.github.io/sparql-engine/functions#sinh': function (x) {
        if (utils_1.rdf.termIsLiteral(x) && utils_1.rdf.literalIsNumeric(x)) {
            var value = utils_1.rdf.asJS(x.value, x.datatype.value);
            return utils_1.rdf.createFloat(Math.sinh(value));
        }
        throw new SyntaxError("SPARQL expression error: cannot compute the hyperbolic sinus of " + x + ", as it is not a number");
    },
    // Hyperbolic tangent
    'https://callidon.github.io/sparql-engine/functions#tanh': function (x) {
        if (utils_1.rdf.termIsLiteral(x) && utils_1.rdf.literalIsNumeric(x)) {
            var value = utils_1.rdf.asJS(x.value, x.datatype.value);
            return utils_1.rdf.createFloat(Math.tanh(value));
        }
        throw new SyntaxError("SPARQL expression error: cannot compute the hyperbolic tangent of " + x + ", as it is not a number");
    },
    // Hyperbolic cotangent
    'https://callidon.github.io/sparql-engine/functions#coth': function (x) {
        if (utils_1.rdf.termIsLiteral(x) && utils_1.rdf.literalIsNumeric(x)) {
            var value = utils_1.rdf.asJS(x.value, x.datatype.value);
            if (value === 0) {
                throw new SyntaxError("SPARQL expression error: cannot compute the hyperbolic cotangent of " + x + ", as it is equals to 0");
            }
            return utils_1.rdf.createFloat((Math.exp(2 * value) + 1) / (Math.exp(2 * value) - 1));
        }
        throw new SyntaxError("SPARQL expression error: cannot compute the hyperbolic cotangent of " + x + ", as it is not a number");
    },
    // Hyperbolic secant
    'https://callidon.github.io/sparql-engine/functions#sech': function (x) {
        if (utils_1.rdf.termIsLiteral(x) && utils_1.rdf.literalIsNumeric(x)) {
            var value = utils_1.rdf.asJS(x.value, x.datatype.value);
            return utils_1.rdf.createFloat((2 * Math.exp(value)) / (Math.exp(2 * value) + 1));
        }
        throw new SyntaxError("SPARQL expression error: cannot compute the hyperbolic secant of " + x + ", as it is not a number");
    },
    // Hyperbolic cosecant
    'https://callidon.github.io/sparql-engine/functions#csch': function (x) {
        if (utils_1.rdf.termIsLiteral(x) && utils_1.rdf.literalIsNumeric(x)) {
            var value = utils_1.rdf.asJS(x.value, x.datatype.value);
            return utils_1.rdf.createFloat((2 * Math.exp(value)) / (Math.exp(2 * value) - 1));
        }
        throw new SyntaxError("SPARQL expression error: cannot compute the hyperbolic cosecant of " + x + ", as it is not a number");
    },
    /*
      Radians to Degree & Degrees to Randians transformations
    */
    'https://callidon.github.io/sparql-engine/functions#toDegrees': function (x) {
        if (utils_1.rdf.termIsLiteral(x) && utils_1.rdf.literalIsNumeric(x)) {
            var value = utils_1.rdf.asJS(x.value, x.datatype.value);
            return utils_1.rdf.createFloat(value * (180 / Math.PI));
        }
        throw new SyntaxError("SPARQL expression error: cannot convert " + x + " to degrees, as it is does not look like radians");
    },
    'https://callidon.github.io/sparql-engine/functions#toRadians': function (x) {
        if (utils_1.rdf.termIsLiteral(x) && utils_1.rdf.literalIsNumeric(x)) {
            var value = utils_1.rdf.asJS(x.value, x.datatype.value);
            return utils_1.rdf.createFloat(value * (Math.PI / 180));
        }
        throw new SyntaxError("SPARQL expression error: cannot convert " + x + " to radians, as it is does not look like degrees");
    },
    /*
      Generator functions, i.e? SPARQL expression whose evaluation generates several RDF Terms
    */
    // Split a RDF Term as a string using a separator
    'https://callidon.github.io/sparql-engine/functions#strsplit': function (term, separator) {
        return function () {
            var _a, _b, token, e_1_1;
            var e_1, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 5, 6, 7]);
                        _a = __values(term.value.split(separator.value)), _b = _a.next();
                        _d.label = 1;
                    case 1:
                        if (!!_b.done) return [3 /*break*/, 4];
                        token = _b.value;
                        return [4 /*yield*/, utils_1.rdf.createLiteral(token)];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3:
                        _b = _a.next();
                        return [3 /*break*/, 1];
                    case 4: return [3 /*break*/, 7];
                    case 5:
                        e_1_1 = _d.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 7];
                    case 6:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        }();
    }
};
