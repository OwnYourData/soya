/* file : sparql-operations.ts
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
var crypto = require("crypto");
var lodash_1 = require("lodash");
var moment = require("moment");
var uuid = require("uuid/v4");
var utils_1 = require("../../utils");
/**
 * Return a high-orderpply a Hash function  to a RDF
 * and returns the corresponding RDF Literal
 * @param  {string} hashType - Type of hash (md5, sha256, etc)
 * @return {function} A function that hashes RDF term
 */
function applyHash(hashType) {
    return function (v) {
        var hash = crypto.createHash(hashType);
        hash.update(v.value);
        return utils_1.rdf.createLiteral(hash.digest('hex'));
    };
}
/**
 * Implementation of SPARQL operations found in FILTERS
 * All arguments are pre-compiled from string to an intermediate representation.
 * All possible intermediate representation are gathered in the `src/rdf-terms.js` file,
 * and are used to represents RDF Terms.
 * Each SPARQL operation is also expected to return the same kind of intermediate representation.
 * @author Thomas Minier
 * @author Corentin Marionneau
 */
exports.default = {
    /*
      COALESCE function https://www.w3.org/TR/sparql11-query/#func-coalesce
    */
    'coalesce': function (baseValue, defaultValue) {
        if (!lodash_1.isNull(baseValue)) {
            return baseValue;
        }
        else if (!lodash_1.isNull(defaultValue)) {
            return defaultValue;
        }
        return utils_1.rdf.createUnbound();
    },
    /*
      IF function https://www.w3.org/TR/sparql11-query/#func-if
    */
    'if': function (booleanValue, valueIfTrue, valueIfFalse) {
        if (lodash_1.isNull(booleanValue) || lodash_1.isNull(valueIfTrue) || lodash_1.isNull(valueIfFalse)) {
            throw new SyntaxError("SPARQL expression error: some arguments of an IF function are unbound. Got IF(" + booleanValue + ", " + valueIfTrue + ", " + valueIfFalse + ")");
        }
        if (utils_1.rdf.termIsLiteral(booleanValue) && (utils_1.rdf.literalIsBoolean(booleanValue) || utils_1.rdf.literalIsNumeric(booleanValue))) {
            return utils_1.rdf.asJS(booleanValue.value, booleanValue.datatype.value) ? valueIfTrue : valueIfFalse;
        }
        throw new SyntaxError("SPARQL expression error: you are using an IF function whose first argument is expected to be a boolean, but instead got " + booleanValue);
    },
    /*
      XQuery & XPath functions https://www.w3.org/TR/sparql11-query/#OperatorMapping
    */
    '+': function (a, b) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.termIsLiteral(b)) {
            var valueA = utils_1.rdf.asJS(a.value, a.datatype.value);
            var valueB = utils_1.rdf.asJS(b.value, b.datatype.value);
            if (utils_1.rdf.literalIsDate(a) && utils_1.rdf.literalIsDate(b)) {
                return utils_1.rdf.createDate(moment(valueA + valueB));
            }
            return utils_1.rdf.createTypedLiteral(valueA + valueB, a.datatype.value);
        }
        return utils_1.rdf.createLiteral(utils_1.rdf.asJS(a.value, null) + utils_1.rdf.asJS(b.value, null));
    },
    '-': function (a, b) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.termIsLiteral(b)) {
            var valueA = utils_1.rdf.asJS(a.value, a.datatype.value);
            var valueB = utils_1.rdf.asJS(b.value, b.datatype.value);
            if (utils_1.rdf.literalIsDate(a) && utils_1.rdf.literalIsDate(b)) {
                return utils_1.rdf.createDate(moment(valueA - valueB));
            }
            return utils_1.rdf.createTypedLiteral(valueA - valueB, a.datatype.value);
        }
        throw new SyntaxError("SPARQL expression error: cannot substract non-Literals " + a + " and " + b);
    },
    '*': function (a, b) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.termIsLiteral(b)) {
            var valueA = utils_1.rdf.asJS(a.value, a.datatype.value);
            var valueB = utils_1.rdf.asJS(b.value, b.datatype.value);
            if (utils_1.rdf.literalIsDate(a) && utils_1.rdf.literalIsDate(b)) {
                return utils_1.rdf.createDate(moment(valueA * valueB));
            }
            return utils_1.rdf.createTypedLiteral(valueA * valueB, a.datatype.value);
        }
        throw new SyntaxError("SPARQL expression error: cannot multiply non-Literals " + a + " and " + b);
    },
    '/': function (a, b) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.termIsLiteral(b)) {
            var valueA = utils_1.rdf.asJS(a.value, a.datatype.value);
            var valueB = utils_1.rdf.asJS(b.value, b.datatype.value);
            if (utils_1.rdf.literalIsDate(a) && utils_1.rdf.literalIsDate(b)) {
                return utils_1.rdf.createDate(moment(valueA / valueB));
            }
            return utils_1.rdf.createTypedLiteral(valueA / valueB, a.datatype.value);
        }
        throw new SyntaxError("SPARQL expression error: cannot divide non-Literals " + a + " and " + b);
    },
    '=': function (a, b) {
        return utils_1.rdf.createBoolean(utils_1.rdf.termEquals(a, b));
    },
    '!=': function (a, b) {
        return utils_1.rdf.createBoolean(!utils_1.rdf.termEquals(a, b));
    },
    '<': function (a, b) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.termIsLiteral(b)) {
            var valueA = utils_1.rdf.asJS(a.value, a.datatype.value);
            var valueB = utils_1.rdf.asJS(b.value, b.datatype.value);
            if (utils_1.rdf.literalIsDate(a) && utils_1.rdf.literalIsDate(b)) {
                // use Moment.js isBefore function to compare two dates
                return utils_1.rdf.createBoolean(valueA.isBefore(valueB));
            }
            return utils_1.rdf.createBoolean(valueA < valueB);
        }
        return utils_1.rdf.createBoolean(a.value < b.value);
    },
    '<=': function (a, b) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.termIsLiteral(b)) {
            var valueA = utils_1.rdf.asJS(a.value, a.datatype.value);
            var valueB = utils_1.rdf.asJS(b.value, b.datatype.value);
            if (utils_1.rdf.literalIsDate(a) && utils_1.rdf.literalIsDate(b)) {
                // use Moment.js isSameOrBefore function to compare two dates
                return utils_1.rdf.createBoolean(valueA.isSameOrBefore(valueB));
            }
            return utils_1.rdf.createBoolean(valueA <= valueB);
        }
        return utils_1.rdf.createBoolean(a.value <= b.value);
    },
    '>': function (a, b) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.termIsLiteral(b)) {
            var valueA = utils_1.rdf.asJS(a.value, a.datatype.value);
            var valueB = utils_1.rdf.asJS(b.value, b.datatype.value);
            if (utils_1.rdf.literalIsDate(a) && utils_1.rdf.literalIsDate(b)) {
                // use Moment.js isAfter function to compare two dates
                return utils_1.rdf.createBoolean(valueA.isAfter(valueB));
            }
            return utils_1.rdf.createBoolean(valueA > valueB);
        }
        return utils_1.rdf.createBoolean(a.value > b.value);
    },
    '>=': function (a, b) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.termIsLiteral(b)) {
            var valueA = utils_1.rdf.asJS(a.value, a.datatype.value);
            var valueB = utils_1.rdf.asJS(b.value, b.datatype.value);
            if (utils_1.rdf.literalIsDate(a) && utils_1.rdf.literalIsDate(b)) {
                // use Moment.js isSameOrAfter function to compare two dates
                return utils_1.rdf.createBoolean(valueA.isSameOrAfter(valueB));
            }
            return utils_1.rdf.createBoolean(valueA >= valueB);
        }
        return utils_1.rdf.createBoolean(a.value >= b.value);
    },
    '!': function (a) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.literalIsBoolean(a)) {
            return utils_1.rdf.createBoolean(!utils_1.rdf.asJS(a.value, a.datatype.value));
        }
        throw new SyntaxError("SPARQL expression error: cannot compute the negation of a non boolean literal " + a);
    },
    '&&': function (a, b) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.termIsLiteral(b) && utils_1.rdf.literalIsBoolean(a) && utils_1.rdf.literalIsBoolean(b)) {
            return utils_1.rdf.createBoolean(utils_1.rdf.asJS(a.value, a.datatype.value) && utils_1.rdf.asJS(b.value, b.datatype.value));
        }
        throw new SyntaxError("SPARQL expression error: cannot compute the conjunction of non boolean literals " + a + " and " + b);
    },
    '||': function (a, b) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.termIsLiteral(b) && utils_1.rdf.literalIsBoolean(a) && utils_1.rdf.literalIsBoolean(b)) {
            return utils_1.rdf.createBoolean(utils_1.rdf.asJS(a.value, a.datatype.value) || utils_1.rdf.asJS(b.value, b.datatype.value));
        }
        throw new SyntaxError("SPARQL expression error: cannot compute the disjunction of non boolean literals " + a + " and " + b);
    },
    /*
      SPARQL Functional forms https://www.w3.org/TR/sparql11-query/#func-forms
    */
    'bound': function (a) {
        return utils_1.rdf.createBoolean(!lodash_1.isNull(a));
    },
    'sameterm': function (a, b) {
        return utils_1.rdf.createBoolean(a.value === b.value);
    },
    'in': function (a, b) {
        return utils_1.rdf.createBoolean(b.some(function (elt) { return utils_1.rdf.termEquals(a, elt); }));
    },
    'notin': function (a, b) {
        return utils_1.rdf.createBoolean(!b.some(function (elt) { return utils_1.rdf.termEquals(a, elt); }));
    },
    /*
      Functions on RDF Terms https://www.w3.org/TR/sparql11-query/#func-rdfTerms
    */
    'isiri': function (a) {
        return utils_1.rdf.createBoolean(utils_1.rdf.termIsIRI(a));
    },
    'isblank': function (a) {
        return utils_1.rdf.createBoolean(utils_1.rdf.termIsBNode(a));
    },
    'isliteral': function (a) {
        return utils_1.rdf.createBoolean(utils_1.rdf.termIsLiteral(a));
    },
    'isnumeric': function (a) {
        return utils_1.rdf.createBoolean(utils_1.rdf.termIsLiteral(a) && utils_1.rdf.literalIsNumeric(a));
    },
    'str': function (a) {
        return utils_1.rdf.createLiteral(utils_1.rdf.toN3(a));
    },
    'lang': function (a) {
        if (utils_1.rdf.termIsLiteral(a)) {
            return utils_1.rdf.createLiteral(a.language.toLowerCase());
        }
        return utils_1.rdf.createLiteral('');
    },
    'datatype': function (a) {
        if (utils_1.rdf.termIsLiteral(a)) {
            return utils_1.rdf.createLiteral(a.datatype.value);
        }
        return utils_1.rdf.createLiteral('');
    },
    'iri': function (a) {
        return utils_1.rdf.createIRI(a.value);
    },
    'bnode': function (a) {
        if (a === undefined) {
            return utils_1.rdf.createBNode();
        }
        return utils_1.rdf.createBNode(a.value);
    },
    'strdt': function (x, datatype) {
        return utils_1.rdf.createTypedLiteral(x.value, datatype.value);
    },
    'strlang': function (x, lang) {
        return utils_1.rdf.createLangLiteral(x.value, lang.value);
    },
    'uuid': function () {
        return utils_1.rdf.createIRI("urn:uuid:" + uuid());
    },
    'struuid': function () {
        return utils_1.rdf.createLiteral(uuid());
    },
    /*
      Functions on Strings https://www.w3.org/TR/sparql11-query/#func-strings
    */
    'strlen': function (a) {
        return utils_1.rdf.createInteger(a.value.length);
    },
    'substr': function (str, index, length) {
        var indexValue = utils_1.rdf.asJS(index.value, utils_1.rdf.XSD('integer'));
        if (indexValue < 1) {
            throw new SyntaxError('SPARQL SUBSTR error: the index of the first character in a string is 1 (according to the SPARQL W3C specs)');
        }
        var value = str.value.substring(indexValue - 1);
        if (length !== undefined) {
            var lengthValue = utils_1.rdf.asJS(length.value, utils_1.rdf.XSD('integer'));
            value = value.substring(0, lengthValue);
        }
        return utils_1.rdf.shallowCloneTerm(str, value);
    },
    'ucase': function (a) {
        return utils_1.rdf.shallowCloneTerm(a, a.value.toUpperCase());
    },
    'lcase': function (a) {
        return utils_1.rdf.shallowCloneTerm(a, a.value.toLowerCase());
    },
    'strstarts': function (term, substring) {
        var a = term.value;
        var b = substring.value;
        return utils_1.rdf.createBoolean(a.startsWith(b));
    },
    'strends': function (term, substring) {
        var a = term.value;
        var b = substring.value;
        return utils_1.rdf.createBoolean(a.endsWith(b));
    },
    'contains': function (term, substring) {
        var a = term.value;
        var b = substring.value;
        return utils_1.rdf.createBoolean(a.indexOf(b) >= 0);
    },
    'strbefore': function (term, token) {
        var index = term.value.indexOf(token.value);
        var value = (index > -1) ? term.value.substring(0, index) : '';
        return utils_1.rdf.shallowCloneTerm(term, value);
    },
    'strafter': function (str, token) {
        var index = str.value.indexOf(token.value);
        var value = (index > -1) ? str.value.substring(index + token.value.length) : '';
        return utils_1.rdf.shallowCloneTerm(str, value);
    },
    'encode_for_uri': function (a) {
        return utils_1.rdf.createLiteral(encodeURIComponent(a.value));
    },
    'concat': function (a, b) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.termIsLiteral(b)) {
            return utils_1.rdf.shallowCloneTerm(a, a.value + b.value);
        }
        return utils_1.rdf.createLiteral(a.value + b.value);
    },
    'langmatches': function (langTag, langRange) {
        // Implements https://tools.ietf.org/html/rfc4647#section-3.3.1
        var tag = langTag.value.toLowerCase();
        var range = langRange.value.toLowerCase();
        var test = tag === range ||
            range === '*' ||
            tag.substr(1, range.length + 1) === range + '-';
        return utils_1.rdf.createBoolean(test);
    },
    'regex': function (subject, pattern, flags) {
        var regexp = (flags === undefined) ? new RegExp(pattern.value) : new RegExp(pattern.value, flags.value);
        return utils_1.rdf.createBoolean(regexp.test(subject.value));
    },
    'replace': function (arg, pattern, replacement, flags) {
        var regexp = (flags === undefined) ? new RegExp(pattern.value) : new RegExp(pattern.value, flags.value);
        var newValue = arg.value.replace(regexp, replacement.value);
        if (utils_1.rdf.termIsIRI(arg)) {
            return utils_1.rdf.createIRI(newValue);
        }
        else if (utils_1.rdf.termIsBNode(arg)) {
            return utils_1.rdf.createBNode(newValue);
        }
        return utils_1.rdf.shallowCloneTerm(arg, newValue);
    },
    /*
      Functions on Numerics https://www.w3.org/TR/sparql11-query/#func-numerics
    */
    'abs': function (a) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.literalIsNumeric(a)) {
            return utils_1.rdf.createInteger(Math.abs(utils_1.rdf.asJS(a.value, a.datatype.value)));
        }
        throw new SyntaxError("SPARQL expression error: cannot compute the absolute value of the non-numeric term " + a);
    },
    'round': function (a) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.literalIsNumeric(a)) {
            return utils_1.rdf.createInteger(Math.round(utils_1.rdf.asJS(a.value, a.datatype.value)));
        }
        throw new SyntaxError("SPARQL expression error: cannot compute the rounded value of the non-numeric term " + a);
    },
    'ceil': function (a) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.literalIsNumeric(a)) {
            return utils_1.rdf.createInteger(Math.ceil(utils_1.rdf.asJS(a.value, a.datatype.value)));
        }
        throw new SyntaxError("SPARQL expression error: cannot compute Math.ceil on the non-numeric term " + a);
    },
    'floor': function (a) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.literalIsNumeric(a)) {
            return utils_1.rdf.createInteger(Math.floor(utils_1.rdf.asJS(a.value, a.datatype.value)));
        }
        throw new SyntaxError("SPARQL expression error: cannot compute Math.floor on the non-numeric term " + a);
    },
    /*
      Functions on Dates and Times https://www.w3.org/TR/sparql11-query/#func-date-time
    */
    'now': function () {
        return utils_1.rdf.createDate(moment());
    },
    'year': function (a) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.literalIsDate(a)) {
            var value = utils_1.rdf.asJS(a.value, a.datatype.value);
            return utils_1.rdf.createInteger(value.year());
        }
        throw new SyntaxError("SPARQL expression error: cannot compute the year of the RDF Term " + a + ", as it is not a date");
    },
    'month': function (a) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.literalIsDate(a)) {
            var value = utils_1.rdf.asJS(a.value, a.datatype.value);
            // Warning: Months are zero indexed in Moment.js, so January is month 0.
            return utils_1.rdf.createInteger(value.month() + 1);
        }
        throw new SyntaxError("SPARQL expression error: cannot compute the month of the RDF Term " + a + ", as it is not a date");
    },
    'day': function (a) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.literalIsDate(a)) {
            var value = utils_1.rdf.asJS(a.value, a.datatype.value);
            return utils_1.rdf.createInteger(value.date());
        }
        throw new SyntaxError("SPARQL expression error: cannot compute the day of the RDF Term " + a + ", as it is not a date");
    },
    'hours': function (a) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.literalIsDate(a)) {
            var value = utils_1.rdf.asJS(a.value, a.datatype.value);
            return utils_1.rdf.createInteger(value.hours());
        }
        throw new SyntaxError("SPARQL expression error: cannot compute the hours of the RDF Term " + a + ", as it is not a date");
    },
    'minutes': function (a) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.literalIsDate(a)) {
            var value = utils_1.rdf.asJS(a.value, a.datatype.value);
            return utils_1.rdf.createInteger(value.minutes());
        }
        throw new SyntaxError("SPARQL expression error: cannot compute the minutes of the RDF Term " + a + ", as it is not a date");
    },
    'seconds': function (a) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.literalIsDate(a)) {
            var value = utils_1.rdf.asJS(a.value, a.datatype.value);
            return utils_1.rdf.createInteger(value.seconds());
        }
        throw new SyntaxError("SPARQL expression error: cannot compute the seconds of the RDF Term " + a + ", as it is not a date");
    },
    'tz': function (a) {
        if (utils_1.rdf.termIsLiteral(a) && utils_1.rdf.literalIsDate(a)) {
            var value = utils_1.rdf.asJS(a.value, a.datatype.value).utcOffset() / 60;
            return utils_1.rdf.createLiteral(value.toString());
        }
        throw new SyntaxError("SPARQL expression error: cannot compute the timezone of the RDF Term " + a + ", as it is not a date");
    },
    /*
      Hash Functions https://www.w3.org/TR/sparql11-query/#func-hash
    */
    'md5': applyHash('md5'),
    'sha1': applyHash('sha1'),
    'sha256': applyHash('sha256'),
    'sha384': applyHash('sha384'),
    'sha512': applyHash('sha512')
};
