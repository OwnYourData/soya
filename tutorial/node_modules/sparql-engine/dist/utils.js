/* file : utils.ts
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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendByBindings = exports.deepApplyBindings = exports.applyBindings = exports.evaluation = exports.sparql = exports.rdf = void 0;
var lodash_1 = require("lodash");
var moment_1 = require("moment");
var pipeline_1 = require("./engine/pipeline/pipeline");
var rdf_string_1 = require("rdf-string");
var crypto = require("crypto");
var DataFactory = require("@rdfjs/data-model");
var uuid = require("uuid/v4");
var symbols_1 = require("./engine/context/symbols");
/**
 * RDF related utilities
 */
var rdf;
(function (rdf) {
    /**
     * Test if two triple (patterns) are equals
     * @param a - First triple (pattern)
     * @param b - Second triple (pattern)
     * @return True if the two triple (patterns) are equals, False otherwise
     */
    function tripleEquals(a, b) {
        return a.subject === b.subject && a.predicate === b.predicate && a.object === b.object;
    }
    rdf.tripleEquals = tripleEquals;
    /**
     * Convert an string RDF Term to a RDFJS representation
     * @see https://rdf.js.org/data-model-spec
     * @param term - A string-based term representation
     * @return A RDF.js term
     */
    function fromN3(term) {
        return rdf_string_1.stringToTerm(term);
    }
    rdf.fromN3 = fromN3;
    /**
     * Convert an RDFJS term to a string-based representation
     * @see https://rdf.js.org/data-model-spec
     * @param term A RDFJS term
     * @return A string-based term representation
     */
    function toN3(term) {
        return rdf_string_1.termToString(term);
    }
    rdf.toN3 = toN3;
    /**
     * Parse a RDF Literal to its Javascript representation
     * @see https://www.w3.org/TR/rdf11-concepts/#section-Datatypes
     * @param value - Literal value
     * @param type - Literal datatype
     * @return Javascript representation of the literal
     */
    function asJS(value, type) {
        switch (type) {
            case XSD('integer'):
            case XSD('byte'):
            case XSD('short'):
            case XSD('int'):
            case XSD('unsignedByte'):
            case XSD('unsignedShort'):
            case XSD('unsignedInt'):
            case XSD('number'):
            case XSD('float'):
            case XSD('decimal'):
            case XSD('double'):
            case XSD('long'):
            case XSD('unsignedLong'):
            case XSD('positiveInteger'):
            case XSD('nonPositiveInteger'):
            case XSD('negativeInteger'):
            case XSD('nonNegativeInteger'):
                return Number(value);
            case XSD('boolean'):
                return value === 'true' || value === '1';
            case XSD('dateTime'):
            case XSD('dateTimeStamp'):
            case XSD('date'):
            case XSD('time'):
            case XSD('duration'):
                return moment_1.parseZone(value, moment_1.ISO_8601);
            case XSD('hexBinary'):
                return Buffer.from(value, 'hex');
            case XSD('base64Binary'):
                return Buffer.from(value, 'base64');
            default:
                return value;
        }
    }
    rdf.asJS = asJS;
    /**
     * Creates an IRI in RDFJS format
     * @param value - IRI value
     * @return A new IRI in RDFJS format
     */
    function createIRI(value) {
        if (value.startsWith('<') && value.endsWith('>')) {
            return DataFactory.namedNode(value.slice(0, value.length - 1));
        }
        return DataFactory.namedNode(value);
    }
    rdf.createIRI = createIRI;
    /**
     * Creates a Blank Node in RDFJS format
     * @param value - Blank node value
     * @return A new Blank Node in RDFJS format
     */
    function createBNode(value) {
        return DataFactory.blankNode(value);
    }
    rdf.createBNode = createBNode;
    /**
     * Creates a Literal in RDFJS format, without any datatype or language tag
     * @param value - Literal value
     * @return A new literal in RDFJS format
     */
    function createLiteral(value) {
        return DataFactory.literal(value);
    }
    rdf.createLiteral = createLiteral;
    /**
     * Creates an typed Literal in RDFJS format
     * @param value - Literal value
     * @param type - Literal type (integer, float, dateTime, ...)
     * @return A new typed Literal in RDFJS format
     */
    function createTypedLiteral(value, type) {
        return DataFactory.literal("" + value, createIRI(type));
    }
    rdf.createTypedLiteral = createTypedLiteral;
    /**
     * Creates a Literal with a language tag in RDFJS format
     * @param value - Literal value
     * @param language - Language tag (en, fr, it, ...)
     * @return A new Literal with a language tag in RDFJS format
     */
    function createLangLiteral(value, language) {
        return DataFactory.literal(value, language);
    }
    rdf.createLangLiteral = createLangLiteral;
    /**
     * Creates an integer Literal in RDFJS format
     * @param value - Integer
     * @return A new integer in RDFJS format
     */
    function createInteger(value) {
        return createTypedLiteral(value, XSD('integer'));
    }
    rdf.createInteger = createInteger;
    /**
     * Creates an float Literal in RDFJS format
     * @param value - Float
     * @return A new float in RDFJS format
     */
    function createFloat(value) {
        return createTypedLiteral(value, XSD('float'));
    }
    rdf.createFloat = createFloat;
    /**
     * Creates a Literal from a boolean, in RDFJS format
     * @param value - Boolean
     * @return A new boolean in RDFJS format
     */
    function createBoolean(value) {
        return value ? createTrue() : createFalse();
    }
    rdf.createBoolean = createBoolean;
    /**
     * Creates a True boolean, in RDFJS format
     * @return A new boolean in RDFJS format
     */
    function createTrue() {
        return createTypedLiteral('true', XSD('boolean'));
    }
    rdf.createTrue = createTrue;
    /**
     * Creates a False boolean, in RDFJS format
     * @return A new boolean in RDFJS format
     */
    function createFalse() {
        return createTypedLiteral('false', XSD('boolean'));
    }
    rdf.createFalse = createFalse;
    /**
     * Creates a Literal from a Moment.js date, in RDFJS format
     * @param date - Date, in Moment.js format
     * @return A new date literal in RDFJS format
     */
    function createDate(date) {
        return createTypedLiteral(date.toISOString(), XSD('dateTime'));
    }
    rdf.createDate = createDate;
    /**
     * Creates an unbounded literal, used when a variable is not bounded in a set of bindings
     * @return A new literal in RDFJS format
     */
    function createUnbound() {
        return createLiteral('UNBOUND');
    }
    rdf.createUnbound = createUnbound;
    /**
     * Clone a literal and replace its value with another one
     * @param  base     - Literal to clone
     * @param  newValue - New literal value
     * @return The literal with its new value
     */
    function shallowCloneTerm(term, newValue) {
        if (termIsLiteral(term)) {
            if (term.language !== '') {
                return createLangLiteral(newValue, term.language);
            }
            return createTypedLiteral(newValue, term.datatype.value);
        }
        return createLiteral(newValue);
    }
    rdf.shallowCloneTerm = shallowCloneTerm;
    /**
     * Test if a RDFJS Term is a Literal
     * @param term - RDFJS Term
     * @return True of the term is a Literal, False otherwise
     */
    function termIsLiteral(term) {
        return term.termType === 'Literal';
    }
    rdf.termIsLiteral = termIsLiteral;
    /**
     * Test if a RDFJS Term is an IRI, i.e., a NamedNode
     * @param term - RDFJS Term
     * @return True of the term is an IRI, False otherwise
     */
    function termIsIRI(term) {
        return term.termType === 'NamedNode';
    }
    rdf.termIsIRI = termIsIRI;
    /**
     * Test if a RDFJS Term is a Blank Node
     * @param term - RDFJS Term
     * @return True of the term is a Blank Node, False otherwise
     */
    function termIsBNode(term) {
        return term.termType === 'BlankNode';
    }
    rdf.termIsBNode = termIsBNode;
    /**
     * Test if a RDFJS Literal is a number
     * @param literal - RDFJS Literal
     * @return True of the Literal is a number, False otherwise
     */
    function literalIsNumeric(literal) {
        switch (literal.datatype.value) {
            case XSD('integer'):
            case XSD('byte'):
            case XSD('short'):
            case XSD('int'):
            case XSD('unsignedByte'):
            case XSD('unsignedShort'):
            case XSD('unsignedInt'):
            case XSD('number'):
            case XSD('float'):
            case XSD('decimal'):
            case XSD('double'):
            case XSD('long'):
            case XSD('unsignedLong'):
            case XSD('positiveInteger'):
            case XSD('nonPositiveInteger'):
            case XSD('negativeInteger'):
            case XSD('nonNegativeInteger'):
                return true;
            default:
                return false;
        }
    }
    rdf.literalIsNumeric = literalIsNumeric;
    /**
     * Test if a RDFJS Literal is a date
     * @param literal - RDFJS Literal
     * @return True of the Literal is a date, False otherwise
     */
    function literalIsDate(literal) {
        return literal.datatype.value === XSD('dateTime');
    }
    rdf.literalIsDate = literalIsDate;
    /**
     * Test if a RDFJS Literal is a boolean
     * @param term - RDFJS Literal
     * @return True of the Literal is a boolean, False otherwise
     */
    function literalIsBoolean(literal) {
        return literal.datatype.value === XSD('boolean');
    }
    rdf.literalIsBoolean = literalIsBoolean;
    /**
     * Test if two RDFJS Terms are equals
     * @param a - First Term
     * @param b - Second Term
     * @return True if the two RDFJS Terms are equals, False
     */
    function termEquals(a, b) {
        if (termIsLiteral(a) && termIsLiteral(b)) {
            if (literalIsDate(a) && literalIsDate(b)) {
                var valueA = asJS(a.value, a.datatype.value);
                var valueB = asJS(b.value, b.datatype.value);
                // use Moment.js isSame function to compare two dates
                return valueA.isSame(valueB);
            }
            return a.value === b.value && a.datatype.value === b.datatype.value && a.language === b.language;
        }
        return a.value === b.value;
    }
    rdf.termEquals = termEquals;
    /**
     * Create a RDF triple in Object representation
     * @param  {string} subj - Triple's subject
     * @param  {string} pred - Triple's predicate
     * @param  {string} obj  - Triple's object
     * @return A RDF triple in Object representation
     */
    function triple(subj, pred, obj) {
        return {
            subject: subj,
            predicate: pred,
            object: obj
        };
    }
    rdf.triple = triple;
    /**
     * Count the number of variables in a Triple Pattern
     * @param  {Object} triple - Triple Pattern to process
     * @return The number of variables in the Triple Pattern
     */
    function countVariables(triple) {
        var count = 0;
        if (isVariable(triple.subject)) {
            count++;
        }
        if (isVariable(triple.predicate)) {
            count++;
        }
        if (isVariable(triple.object)) {
            count++;
        }
        return count;
    }
    rdf.countVariables = countVariables;
    /**
     * Return True if a string is a SPARQL variable
     * @param  str - String to test
     * @return True if the string is a SPARQL variable, False otherwise
     */
    function isVariable(str) {
        if (typeof str !== 'string') {
            return false;
        }
        return str.startsWith('?');
    }
    rdf.isVariable = isVariable;
    /**
     * Return True if a string is a RDF Literal
     * @param  str - String to test
     * @return True if the string is a RDF Literal, False otherwise
     */
    function isLiteral(str) {
        return str.startsWith('"');
    }
    rdf.isLiteral = isLiteral;
    /**
     * Return True if a string is a RDF IRI/URI
     * @param  str - String to test
     * @return True if the string is a RDF IRI/URI, False otherwise
     */
    function isIRI(str) {
        return (!isVariable(str)) && (!isLiteral(str));
    }
    rdf.isIRI = isIRI;
    /**
     * Get the value (excluding datatype & language tags) of a RDF literal
     * @param literal - RDF Literal
     * @return The literal's value
     */
    function getLiteralValue(literal) {
        if (literal.startsWith('"')) {
            var stopIndex = literal.length - 1;
            if (literal.includes('"^^<') && literal.endsWith('>')) {
                stopIndex = literal.lastIndexOf('"^^<');
            }
            else if (literal.includes('"@') && !literal.endsWith('"')) {
                stopIndex = literal.lastIndexOf('"@');
            }
            return literal.slice(1, stopIndex);
        }
        return literal;
    }
    rdf.getLiteralValue = getLiteralValue;
    /**
     * Hash Triple (pattern) to assign it an unique ID
     * @param triple - Triple (pattern) to hash
     * @return An unique ID to identify the Triple (pattern)
     */
    function hashTriple(triple) {
        return "s=" + triple.subject + "&p=" + triple.predicate + "&o=" + triple.object;
    }
    rdf.hashTriple = hashTriple;
    /**
     * Create an IRI under the XSD namespace
     * (<http://www.w3.org/2001/XMLSchema#>)
     * @param suffix - Suffix appended to the XSD namespace to create an IRI
     * @return An new IRI, under the XSD namespac
     */
    function XSD(suffix) {
        return "http://www.w3.org/2001/XMLSchema#" + suffix;
    }
    rdf.XSD = XSD;
    /**
     * Create an IRI under the RDF namespace
     * (<http://www.w3.org/1999/02/22-rdf-syntax-ns#>)
     * @param suffix - Suffix appended to the RDF namespace to create an IRI
     * @return An new IRI, under the RDF namespac
     */
    function RDF(suffix) {
        return "http://www.w3.org/1999/02/22-rdf-syntax-ns#" + suffix;
    }
    rdf.RDF = RDF;
    /**
     * Create an IRI under the SEF namespace
     * (<https://callidon.github.io/sparql-engine/functions#>)
     * @param suffix - Suffix appended to the SES namespace to create an IRI
     * @return An new IRI, under the SES namespac
     */
    function SEF(suffix) {
        return "https://callidon.github.io/sparql-engine/functions#" + suffix;
    }
    rdf.SEF = SEF;
    /**
     * Create an IRI under the SES namespace
     * (<https://callidon.github.io/sparql-engine/search#>)
     * @param suffix - Suffix appended to the SES namespace to create an IRI
     * @return An new IRI, under the SES namespac
     */
    function SES(suffix) {
        return "https://callidon.github.io/sparql-engine/search#" + suffix;
    }
    rdf.SES = SES;
})(rdf = exports.rdf || (exports.rdf = {}));
/**
 * SPARQL related utilities
 */
var sparql;
(function (sparql) {
    /**
     * Hash Basic Graph pattern to assign them an unique ID
     * @param bgp - Basic Graph Pattern to hash
     * @param md5 - True if the ID should be hashed to md5, False to keep it as a plain text string
     * @return An unique ID to identify the BGP
     */
    function hashBGP(bgp, md5) {
        if (md5 === void 0) { md5 = false; }
        var hashedBGP = bgp.map(rdf.hashTriple).join(';');
        if (!md5) {
            return hashedBGP;
        }
        var hash = crypto.createHash('md5');
        hash.update(hashedBGP);
        return hash.digest('hex');
    }
    sparql.hashBGP = hashBGP;
    /**
     * Get the set of SPARQL variables in a triple pattern
     * @param  pattern - Triple Pattern
     * @return The set of SPARQL variables in the triple pattern
     */
    function variablesFromPattern(pattern) {
        var res = [];
        if (rdf.isVariable(pattern.subject)) {
            res.push(pattern.subject);
        }
        if (rdf.isVariable(pattern.predicate)) {
            res.push(pattern.predicate);
        }
        if (rdf.isVariable(pattern.object)) {
            res.push(pattern.object);
        }
        return res;
    }
    sparql.variablesFromPattern = variablesFromPattern;
    /**
     * Perform a join ordering of a set of triple pattern, i.e., a BGP.
     * Sort pattern such as they creates a valid left linear tree without cartesian products (unless it's required to evaluate the BGP)
     * @param  patterns - Set of triple pattern
     * @return Order set of triple patterns
     */
    function leftLinearJoinOrdering(patterns) {
        var results = [];
        var x = new Set();
        if (patterns.length > 0) {
            // sort pattern by join predicate
            var p = patterns.shift();
            var variables_1 = variablesFromPattern(p);
            results.push(p);
            while (patterns.length > 0) {
                // find the next pattern with a common join predicate
                var index = patterns.findIndex(function (pattern) {
                    return lodash_1.includes(variables_1, pattern.subject) || lodash_1.includes(variables_1, pattern.predicate) || lodash_1.includes(variables_1, pattern.object);
                });
                // if not found, trigger a cartesian product with the first pattern of the sorted set
                if (index < 0) {
                    index = 0;
                }
                // get the new pattern to join with
                p = patterns.splice(index, 1)[0];
                variables_1 = lodash_1.union(variables_1, variablesFromPattern(p));
                results.push(p);
            }
        }
        return results;
    }
    sparql.leftLinearJoinOrdering = leftLinearJoinOrdering;
})(sparql = exports.sparql || (exports.sparql = {}));
/**
 * Utilities related to SPARQL query evaluation
 * @author Thomas Minier
 */
var evaluation;
(function (evaluation) {
    /**
     * Evaluate a Basic Graph pattern on a RDF graph using a cache
     * @param bgp - Basic Graph pattern to evaluate
     * @param graph - RDF graph
     * @param cache - Cache used
     * @return A pipeline stage that produces the evaluation results
     */
    function cacheEvalBGP(patterns, graph, cache, builder, context) {
        var bgp = {
            patterns: patterns,
            graphIRI: graph.iri
        };
        var _a = __read(cache.findSubset(bgp), 2), subsetBGP = _a[0], missingBGP = _a[1];
        // case 1: no subset of the BGP are in cache => classic evaluation (most frequent)
        if (subsetBGP.length === 0) {
            // we cannot cache the BGP if the query has a LIMIT and/or OFFSET modiifier
            // otherwise we will cache incomplete results. So, we just evaluate the BGP
            if (context.hasProperty(symbols_1.default.HAS_LIMIT_OFFSET) && context.getProperty(symbols_1.default.HAS_LIMIT_OFFSET)) {
                return graph.evalBGP(patterns, context);
            }
            // generate an unique writer ID
            var writerID_1 = uuid();
            // evaluate the BGP while saving all solutions into the cache
            var iterator_1 = pipeline_1.Pipeline.getInstance().tap(graph.evalBGP(patterns, context), function (b) {
                cache.update(bgp, b, writerID_1);
            });
            // commit the cache entry when the BGP evaluation is done
            return pipeline_1.Pipeline.getInstance().finalize(iterator_1, function () {
                cache.commit(bgp, writerID_1);
            });
        }
        // case 2: no missing patterns => the complete BGP is in the cache
        if (missingBGP.length === 0) {
            return cache.getAsPipeline(bgp, function () { return graph.evalBGP(patterns, context); });
        }
        var cachedBGP = {
            patterns: subsetBGP,
            graphIRI: graph.iri
        };
        // case 3: evaluate the subset BGP using the cache, then join with the missing patterns
        var iterator = cache.getAsPipeline(cachedBGP, function () { return graph.evalBGP(subsetBGP, context); });
        return builder.execute(iterator, missingBGP, context);
    }
    evaluation.cacheEvalBGP = cacheEvalBGP;
})(evaluation = exports.evaluation || (exports.evaluation = {}));
/**
 * Bound a triple pattern using a set of bindings, i.e., substitute variables in the triple pattern
 * using the set of bindings provided
 * @param triple  - Triple pattern
 * @param bindings - Set of bindings
 * @return An new, bounded triple pattern
 */
function applyBindings(triple, bindings) {
    var newTriple = Object.assign({}, triple);
    if (triple.subject.startsWith('?') && bindings.has(triple.subject)) {
        newTriple.subject = bindings.get(triple.subject);
    }
    if (triple.predicate.startsWith('?') && bindings.has(triple.predicate)) {
        newTriple.predicate = bindings.get(triple.predicate);
    }
    if (triple.object.startsWith('?') && bindings.has(triple.object)) {
        newTriple.object = bindings.get(triple.object);
    }
    return newTriple;
}
exports.applyBindings = applyBindings;
/**
 * Recursively apply bindings to every triple in a SPARQL group pattern
 * @param  group - SPARQL group pattern to process
 * @param  bindings - Set of bindings to use
 * @return A new SPARQL group pattern with triples bounded
 */
function deepApplyBindings(group, bindings) {
    switch (group.type) {
        case 'bgp':
            // WARNING property paths are not supported here
            var triples = group.triples;
            var bgp = {
                type: 'bgp',
                triples: triples.map(function (t) { return bindings.bound(t); })
            };
            return bgp;
        case 'group':
        case 'optional':
        case 'service':
        case 'union':
            var newGroup = {
                type: group.type,
                patterns: group.patterns.map(function (g) { return deepApplyBindings(g, bindings); })
            };
            return newGroup;
        case 'query':
            var subQuery = group;
            subQuery.where = subQuery.where.map(function (g) { return deepApplyBindings(g, bindings); });
            return subQuery;
        default:
            return group;
    }
}
exports.deepApplyBindings = deepApplyBindings;
/**
 * Extends all set of bindings produced by an iterator with another set of bindings
 * @param  source - Source {@link PipelineStage}
 * @param  bindings - Bindings added to each set of bindings procuded by the iterator
 * @return A {@link PipelineStage} that extends bindins produced by the source iterator
 */
function extendByBindings(source, bindings) {
    return pipeline_1.Pipeline.getInstance().map(source, function (b) { return bindings.union(b); });
}
exports.extendByBindings = extendByBindings;
