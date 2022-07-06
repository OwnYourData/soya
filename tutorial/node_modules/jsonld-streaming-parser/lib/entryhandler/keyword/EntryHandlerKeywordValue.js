"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntryHandlerKeywordValue = void 0;
const EntryHandlerKeyword_1 = require("./EntryHandlerKeyword");
/**
 * Handles @value entries.
 */
class EntryHandlerKeywordValue extends EntryHandlerKeyword_1.EntryHandlerKeyword {
    constructor() {
        super('@value');
    }
    async validate(parsingContext, util, keys, depth, inProperty) {
        // If this is @value, mark it so in the stack so that no deeper handling of nodes occurs.
        const key = keys[depth];
        if (key && !parsingContext.literalStack[depth] && await this.test(parsingContext, util, key, keys, depth)) {
            parsingContext.literalStack[depth] = true;
        }
        return super.validate(parsingContext, util, keys, depth, inProperty);
    }
    async test(parsingContext, util, key, keys, depth) {
        return await util.unaliasKeyword(keys[depth], keys.slice(0, keys.length - 1), depth - 1, true) === '@value';
    }
    async handle(parsingContext, util, key, keys, value, depth) {
        // If the value is valid, indicate that we are processing a literal.
        // The actual value will be determined at the parent level when the @value is part of an object,
        // because we may want to take into account additional entries such as @language.
        // See {@link Util.valueToTerm}
        // Indicate that we are processing a literal, and that no later predicates should be parsed at this depth.
        parsingContext.literalStack[depth] = true;
        // Void any buffers that we may have accumulated up until now
        delete parsingContext.unidentifiedValuesBuffer[depth];
        delete parsingContext.unidentifiedGraphsBuffer[depth];
        // Indicate that we have not emitted at this depth
        parsingContext.emittedStack[depth] = false;
    }
}
exports.EntryHandlerKeywordValue = EntryHandlerKeywordValue;
//# sourceMappingURL=EntryHandlerKeywordValue.js.map