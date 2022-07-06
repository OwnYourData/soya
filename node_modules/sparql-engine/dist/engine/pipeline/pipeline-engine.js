/* file : pipeline-engine.ts
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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineEngine = void 0;
var lodash_1 = require("lodash");
/**
 * Abstract representation used to apply transformations on a pipeline of iterators.
 * Concrete subclasses are used by the framework to build the query execution pipeline.
 * @abstract
 * @author Thomas Minier
 */
var PipelineEngine = /** @class */ (function () {
    function PipelineEngine() {
    }
    /**
     * Maps each source value to an array of values which is merged in the output PipelineStage.
     * @param  input  - Input PipelineStage
     * @param  mapper - Transformation function
     * @return Output PipelineStage
     */
    PipelineEngine.prototype.flatMap = function (input, mapper) {
        var _this = this;
        return this.mergeMap(input, function (value) { return _this.of.apply(_this, __spread(mapper(value))); });
    };
    /**
     * Flatten the output of a pipeline stage that emits array of values into single values.
     * @param  input  - Input PipelineStage
     * @return Output PipelineStage
     */
    PipelineEngine.prototype.flatten = function (input) {
        return this.flatMap(input, function (v) { return v; });
    };
    /**
     * Returns a PipelineStage that emits all items emitted by the source PipelineStage that are distinct by comparison from previous items.
     * @param  input - Input PipelineStage
     * @param  selector - Optional function to select which value you want to check as distinct.
     * @return A PipelineStage that emits items from the source PipelineStage with distinct values.
     */
    PipelineEngine.prototype.distinct = function (input, selector) {
        if (lodash_1.isUndefined(selector)) {
            selector = lodash_1.identity;
        }
        return this.flatMap(this.collect(input), function (values) { return lodash_1.uniqBy(values, selector); });
    };
    /**
     * Emits only the first value (or the first value that meets some condition) emitted by the source PipelineStage.
     * @param  input - Input PipelineStage
     * @return A PipelineStage of the first item that matches the condition.
     */
    PipelineEngine.prototype.first = function (input) {
        return this.limit(input, 1);
    };
    /**
     * Returns a PipelineStage that emits the items you specify as arguments after it finishes emitting items emitted by the source PipelineStage.
     * @param  input  - Input PipelineStage
     * @param  values - Values to append
     * @return A PipelineStage that emits the items emitted by the source PipelineStage and then emits the additional values.
     */
    PipelineEngine.prototype.endWith = function (input, values) {
        return this.merge(input, this.from(values));
    };
    /**
     * Perform a side effect for every emission on the source PipelineStage, but return a PipelineStage that is identical to the source.
     * @param  input - Input PipelineStage
     * @param  cb    - Callback invoked on each item
     * @return A PipelineStage identical to the source, but runs the specified PipelineStage or callback(s) for each item.
     */
    PipelineEngine.prototype.tap = function (input, cb) {
        return this.map(input, function (value) {
            cb(value);
            return value;
        });
    };
    /**
     * Find the smallest value produced by a pipeline of iterators.
     * It takes a ranking function as input, which is invoked with (x, y)
     * and must returns True if x < y and False otherwise.
     * Warning: this function needs to materialize all values of the pipeline.
     * @param  input - Input PipelineStage
     * @param  comparator - (optional) Ranking function
     * @return A pipeline stage that emits the lowest value found
     */
    PipelineEngine.prototype.min = function (input, ranking) {
        if (lodash_1.isUndefined(ranking)) {
            ranking = function (x, y) { return x < y; };
        }
        return this.map(this.collect(input), function (values) {
            var minValue = values[0];
            for (var i = 1; i < values.length - 1; i++) {
                if (ranking(values[i], minValue)) {
                    minValue = values[i];
                }
            }
            return minValue;
        });
    };
    /**
     * Find the smallest value produced by a pipeline of iterators.
     * It takes a ranking function as input, which is invoked with (x, y)
     * and must returns True if x > y and False otherwise.
     * Warning: this function needs to materialize all values of the pipeline.
     * @param  input - Input PipelineStage
     * @param  comparator - (optional) Ranking function
     * @return A pipeline stage that emits the highest value found
     */
    PipelineEngine.prototype.max = function (input, ranking) {
        if (lodash_1.isUndefined(ranking)) {
            ranking = function (x, y) { return x > y; };
        }
        return this.map(this.collect(input), function (values) {
            var maxValue = values[0];
            for (var i = 1; i < values.length - 1; i++) {
                if (ranking(values[i], maxValue)) {
                    maxValue = values[i];
                }
            }
            return maxValue;
        });
    };
    /**
     * Groups the items produced by a pipeline according to a specified criterion,
     * and emits the resulting groups
     * @param  input - Input PipelineStage
     * @param  keySelector - A function that extracts the grouping key for each item
     * @param  elementSelector - (optional) A function that transforms items before inserting them in a group
     */
    PipelineEngine.prototype.groupBy = function (input, keySelector, elementSelector) {
        var _this = this;
        if (lodash_1.isUndefined(elementSelector)) {
            elementSelector = lodash_1.identity;
        }
        var groups = new Map();
        var stage = this.map(input, function (value) {
            return {
                key: keySelector(value),
                value: elementSelector(value)
            };
        });
        return this.mergeMap(this.collect(stage), function (subgroups) {
            // build groups
            subgroups.forEach(function (g) {
                if (!groups.has(g.key)) {
                    groups.set(g.key, [g.value]);
                }
                else {
                    groups.set(g.key, groups.get(g.key).concat([g.value]));
                }
            });
            // inject groups into the pipeline
            return _this.fromAsync(function (input) {
                groups.forEach(function (value, key) { return input.next([key, value]); });
            });
        });
    };
    /**
     * Peek values from the input pipeline stage, and use them to decide
     * between two candidate pipeline stages to continue the pipeline.
     * @param input - Input pipeline stage
     * @param count - How many items to peek from the input?
     * @param predicate - Predicate function invoked with the values
     * @param ifCase - Callback invoked if the predicate function evaluates to True
     * @param elseCase - Callback invoked if the predicate function evaluates to False
     * @return A pipeline stage
     */
    PipelineEngine.prototype.peekIf = function (input, count, predicate, ifCase, elseCase) {
        var peekable = this.limit(this.clone(input), count);
        return this.mergeMap(this.collect(peekable), function (values) {
            if (predicate(values)) {
                return ifCase(values);
            }
            return elseCase(values);
        });
    };
    return PipelineEngine;
}());
exports.PipelineEngine = PipelineEngine;
