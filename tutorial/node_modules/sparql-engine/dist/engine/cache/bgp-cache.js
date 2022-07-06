/* file: bgp-cache.ts
MIT License

Copyright (c) 2018-2020 Thomas Minier

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the 'Software'), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
'use strict';
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
exports.LRUBGPCache = void 0;
var cache_base_1 = require("./cache-base");
var pipeline_1 = require("../pipeline/pipeline");
var utils_1 = require("../../utils");
var binary_search_tree_1 = require("binary-search-tree");
var lodash_1 = require("lodash");
/**
 * Hash a BGP with a Graph IRI
 * @param bgp - BGP to hash
 */
function hashBasicGraphPattern(bgp) {
    return utils_1.sparql.hashBGP(bgp.patterns) + "&graph-iri=" + bgp.graphIRI;
}
/**
 * An implementation of a {@link BGPCache} using an {@link AsyncLRUCache}
 * @author Thomas Minier
 */
var LRUBGPCache = /** @class */ (function () {
    /**
     * Constructor
     * @param maxSize - The maximum size of the cache
     * @param maxAge - Maximum age in ms
     */
    function LRUBGPCache(maxSize, maxAge) {
        var _this = this;
        this._patternsPerBGP = new Map();
        this._allKeys = new binary_search_tree_1.BinarySearchTree({
            checkValueEquality: function (a, b) { return a.key === b.key; }
        });
        this._cache = new cache_base_1.AsyncLRUCache(maxSize, maxAge, function (item) {
            return item.content.length;
        }, function (key) {
            // remove index entries when they slide out
            if (_this._patternsPerBGP.has(key)) {
                var bgp_1 = _this._patternsPerBGP.get(key);
                bgp_1.patterns.forEach(function (pattern) { return _this._allKeys.delete(utils_1.rdf.hashTriple(pattern), { bgp: bgp_1, key: key }); });
                _this._patternsPerBGP.delete(key);
            }
        });
    }
    LRUBGPCache.prototype.has = function (bgp) {
        return this._cache.has(hashBasicGraphPattern(bgp));
    };
    LRUBGPCache.prototype.update = function (bgp, item, writerID) {
        var _this = this;
        var key = hashBasicGraphPattern(bgp);
        if (!this._cache.has(key)) {
            // update the indexes
            this._patternsPerBGP.set(key, bgp);
            bgp.patterns.forEach(function (pattern) { return _this._allKeys.insert(utils_1.rdf.hashTriple(pattern), { bgp: bgp, key: key }); });
        }
        this._cache.update(key, item, writerID);
    };
    LRUBGPCache.prototype.get = function (bgp) {
        return this._cache.get(hashBasicGraphPattern(bgp));
    };
    LRUBGPCache.prototype.getAsPipeline = function (bgp, onCancel) {
        var _this = this;
        var bindings = this.get(bgp);
        if (bindings === null) {
            return pipeline_1.Pipeline.getInstance().empty();
        }
        var iterator = pipeline_1.Pipeline.getInstance().from(bindings);
        return pipeline_1.Pipeline.getInstance().mergeMap(iterator, function (bindings) {
            // if the results is empty AND the cache do not contains the BGP
            // it means that the entry has been deleted before its insertion completed
            if (bindings.length === 0 && !_this.has(bgp)) {
                return (onCancel === undefined) ? pipeline_1.Pipeline.getInstance().empty() : onCancel();
            }
            return pipeline_1.Pipeline.getInstance().from(bindings.map(function (b) { return b.clone(); }));
        });
    };
    LRUBGPCache.prototype.commit = function (bgp, writerID) {
        this._cache.commit(hashBasicGraphPattern(bgp), writerID);
    };
    LRUBGPCache.prototype.delete = function (bgp, writerID) {
        var _this = this;
        var key = hashBasicGraphPattern(bgp);
        this._cache.delete(key, writerID);
        // clear the indexes
        this._patternsPerBGP.delete(key);
        bgp.patterns.forEach(function (pattern) { return _this._allKeys.delete(utils_1.rdf.hashTriple(pattern), { bgp: bgp, key: key }); });
    };
    LRUBGPCache.prototype.count = function () {
        return this._cache.count();
    };
    LRUBGPCache.prototype.findSubset = function (bgp) {
        var e_1, _a, e_2, _b;
        // if the bgp is in the cache, then the computation is simple
        if (this.has(bgp)) {
            return [bgp.patterns, []];
        }
        // otherwise, we search for all candidate subsets
        var matches = [];
        try {
            for (var _c = __values(bgp.patterns), _d = _c.next(); !_d.done; _d = _c.next()) {
                var pattern = _d.value;
                var searchResults = this._allKeys
                    .search(utils_1.rdf.hashTriple(pattern))
                    .filter(function (v) {
                    // remove all BGPs that are not a subset of the input BGP
                    // we use lodash.findIndex + rdf.tripleEquals to check for triple pattern equality
                    return v.bgp.patterns.every(function (a) { return lodash_1.findIndex(bgp.patterns, function (b) { return utils_1.rdf.tripleEquals(a, b); }) > -1; });
                });
                matches.push({ pattern: pattern, searchResults: searchResults });
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
        // compute the largest subset BGP and the missing patterns (missingPatterns = input_BGP - subset_BGP)
        var foundPatterns = [];
        var maxBGPLength = -1;
        try {
            for (var matches_1 = __values(matches), matches_1_1 = matches_1.next(); !matches_1_1.done; matches_1_1 = matches_1.next()) {
                var match = matches_1_1.value;
                if (match.searchResults.length > 0) {
                    var localMax = lodash_1.maxBy(match.searchResults, function (v) { return v.bgp.patterns.length; });
                    if (localMax !== undefined && localMax.bgp.patterns.length > maxBGPLength) {
                        maxBGPLength = localMax.bgp.patterns.length;
                        foundPatterns = localMax.bgp.patterns;
                    }
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (matches_1_1 && !matches_1_1.done && (_b = matches_1.return)) _b.call(matches_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return [foundPatterns, lodash_1.differenceWith(bgp.patterns, foundPatterns, utils_1.rdf.tripleEquals)];
    };
    return LRUBGPCache;
}());
exports.LRUBGPCache = LRUBGPCache;
