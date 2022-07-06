/* file : vector-pipeline.ts
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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStreamInput = exports.VectorStage = void 0;
var pipeline_engine_1 = require("./pipeline-engine");
var lodash_1 = require("lodash");
/**
 * A PipelineStage which materializes all intermediate results in main memory.
 * @author Thomas Minier
 */
var VectorStage = /** @class */ (function () {
    function VectorStage(content) {
        this._content = content;
    }
    VectorStage.prototype.getContent = function () {
        return this._content;
    };
    VectorStage.prototype.subscribe = function (onData, onError, onEnd) {
        try {
            this._content
                .then(function (c) {
                c.forEach(onData);
                onEnd();
            })
                .catch(onError);
        }
        catch (e) {
            onError(e);
        }
    };
    VectorStage.prototype.forEach = function (cb) {
        this._content
            .then(function (c) {
            c.forEach(cb);
        })
            .catch(function (err) { throw err; });
    };
    return VectorStage;
}());
exports.VectorStage = VectorStage;
var VectorStreamInput = /** @class */ (function () {
    function VectorStreamInput(resolve, reject) {
        this._resolve = resolve;
        this._reject = reject;
        this._content = [];
    }
    VectorStreamInput.prototype.next = function (value) {
        this._content.push(value);
    };
    VectorStreamInput.prototype.error = function (err) {
        this._reject(err);
    };
    VectorStreamInput.prototype.complete = function () {
        this._resolve(this._content);
    };
    return VectorStreamInput;
}());
exports.VectorStreamInput = VectorStreamInput;
/**
 * A pipeline implemented using {@link VectorStage}, *i.e.*, all intermediate results are materialized in main memory. This approach is often called **vectorized approach**.
 * This pipeline is more efficient CPU-wise than {@link RxjsPipeline}, but it also consumes much more memory, as it materializes evey stage of the pipeline before moving to the next.
 * It should only be used when SPARQL queries generate few intermediate results.
 * @see P. A. Boncz, S. Manegold, and M. L. Kersten. "Database architecture evolution: Mammals flourished long before dinosaurs became extinct". PVLDB, (2009)
 * @author Thomas Minier
 */
var VectorPipeline = /** @class */ (function (_super) {
    __extends(VectorPipeline, _super);
    function VectorPipeline() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    VectorPipeline.prototype.empty = function () {
        return new VectorStage(Promise.resolve([]));
    };
    VectorPipeline.prototype.of = function () {
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        return new VectorStage(Promise.resolve(values));
    };
    VectorPipeline.prototype.from = function (x) {
        if ('getContent' in x) {
            return new VectorStage(x.getContent());
        }
        else if (Array.isArray(x)) {
            return new VectorStage(Promise.resolve(x));
        }
        else if ('then' in x) {
            return new VectorStage(x.then(function (v) { return [v]; }));
        }
        else if (Symbol.iterator in x) {
            return new VectorStage(Promise.resolve(Array.from(x)));
        }
        throw new Error('Invalid argument for VectorPipeline.from: ' + x);
    };
    VectorPipeline.prototype.fromAsync = function (cb) {
        return new VectorStage(new Promise(function (resolve, reject) {
            cb(new VectorStreamInput(resolve, reject));
        }));
    };
    VectorPipeline.prototype.clone = function (stage) {
        return new VectorStage(stage.getContent().then(function (c) { return c.slice(0); }));
    };
    VectorPipeline.prototype.catch = function (input, handler) {
        return new VectorStage(new Promise(function (resolve, reject) {
            input.getContent()
                .then(function (c) { return resolve(c.slice(0)); })
                .catch(function (err) {
                if (handler === undefined) {
                    reject(err);
                }
                else {
                    handler(err).getContent()
                        .then(function (c) { return resolve(c.slice(0)); })
                        .catch(function (err) { throw err; });
                }
            });
        }));
    };
    VectorPipeline.prototype.merge = function () {
        var inputs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            inputs[_i] = arguments[_i];
        }
        return new VectorStage(Promise.all(inputs.map(function (i) { return i.getContent(); })).then(function (contents) {
            return lodash_1.flatten(contents);
        }));
    };
    VectorPipeline.prototype.map = function (input, mapper) {
        return new VectorStage(input.getContent().then(function (c) { return c.map(mapper); }));
    };
    VectorPipeline.prototype.flatMap = function (input, mapper) {
        return new VectorStage(input.getContent().then(function (c) { return lodash_1.flatMap(c, mapper); }));
    };
    VectorPipeline.prototype.mergeMap = function (input, mapper) {
        return new VectorStage(input.getContent().then(function (content) {
            var stages = content.map(function (value) { return mapper(value); });
            return Promise.all(stages.map(function (s) { return s.getContent(); })).then(function (contents) {
                return lodash_1.flatten(contents);
            });
        }));
    };
    VectorPipeline.prototype.filter = function (input, predicate) {
        return new VectorStage(input.getContent().then(function (c) { return c.filter(predicate); }));
    };
    VectorPipeline.prototype.finalize = function (input, callback) {
        return new VectorStage(input.getContent().then(function (c) {
            callback();
            return c;
        }));
    };
    VectorPipeline.prototype.reduce = function (input, reducer, initial) {
        return new VectorStage(input.getContent().then(function (c) { return [c.reduce(reducer, initial)]; }));
    };
    VectorPipeline.prototype.limit = function (input, stopAfter) {
        return new VectorStage(input.getContent().then(function (c) { return lodash_1.slice(c, 0, stopAfter); }));
    };
    VectorPipeline.prototype.skip = function (input, toSkip) {
        return new VectorStage(input.getContent().then(function (c) { return lodash_1.slice(c, toSkip); }));
    };
    VectorPipeline.prototype.defaultValues = function (input) {
        var values = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            values[_i - 1] = arguments[_i];
        }
        return new VectorStage(input.getContent().then(function (content) {
            if (content.length > 0) {
                return content.slice(0);
            }
            return values;
        }));
    };
    VectorPipeline.prototype.bufferCount = function (input, count) {
        return new VectorStage(input.getContent().then(function (c) { return lodash_1.chunk(c, count); }));
    };
    VectorPipeline.prototype.forEach = function (input, cb) {
        input.forEach(cb);
    };
    VectorPipeline.prototype.first = function (input) {
        return new VectorStage(input.getContent().then(function (content) {
            if (content.length < 1) {
                return [];
            }
            return [content[0]];
        }));
    };
    VectorPipeline.prototype.collect = function (input) {
        return new VectorStage(input.getContent().then(function (c) { return [c]; }));
    };
    return VectorPipeline;
}(pipeline_engine_1.PipelineEngine));
exports.default = VectorPipeline;
