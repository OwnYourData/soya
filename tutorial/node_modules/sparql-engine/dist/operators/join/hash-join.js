"use strict";
/* file : hash-join.ts
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
Object.defineProperty(exports, "__esModule", { value: true });
var pipeline_1 = require("../../engine/pipeline/pipeline");
var hash_join_table_1 = require("./hash-join-table");
/**
 * Perform a traditional Hash join between two sources, i.e., materialize the right source in a hash table and then read from the left source while probing into the hash table.
 * @param  left - Left source (a {@link PipelineStage})
 * @param  right - Right source (a {@link PipelineStage})
 * @param  joinKey - SPARQL variable used as join attribute
 * @return A {@link PipelineStage} which performs a Hash join
 */
function hashJoin(left, right, joinKey) {
    var joinTable = new hash_join_table_1.default();
    var engine = pipeline_1.Pipeline.getInstance();
    return engine.mergeMap(engine.collect(right), function (values) {
        // materialize right relation into the hash table
        values.forEach(function (v) {
            if (v.has(joinKey)) {
                joinTable.put(v.get(joinKey), v);
            }
        });
        // read from left and probe each value into the hash table
        return engine.mergeMap(left, function (bindings) {
            return engine.from(joinTable.join(bindings.get(joinKey), bindings));
        });
    });
}
exports.default = hashJoin;
