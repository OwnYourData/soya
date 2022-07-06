"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeparatorType = void 0;
/**
 * A type of JSON separator.
 */
class SeparatorType {
    constructor(label) {
        this.label = label;
    }
}
exports.SeparatorType = SeparatorType;
SeparatorType.COMMA = new SeparatorType(',');
SeparatorType.OBJECT_START = new SeparatorType('{');
SeparatorType.OBJECT_END = new SeparatorType('}');
SeparatorType.OBJECT_END_COMMA = new SeparatorType('},');
SeparatorType.ARRAY_START = new SeparatorType('[');
SeparatorType.ARRAY_END = new SeparatorType(']');
SeparatorType.ARRAY_END_COMMA = new SeparatorType('],');
SeparatorType.GRAPH_FIELD_NONCOMPACT = new SeparatorType('"@graph": [');
SeparatorType.GRAPH_FIELD_COMPACT = new SeparatorType('"@graph":[');
SeparatorType.CONTEXT_FIELD = new SeparatorType('"@context":');
//# sourceMappingURL=SeparatorType.js.map