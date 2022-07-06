"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntryHandlerKeywordUnknownFallback = void 0;
const jsonld_context_parser_1 = require("jsonld-context-parser");
/**
 * A catch-all for keywords, that will either emit an error or ignore,
 * depending on whether or not the `strictValues` property is set.
 */
class EntryHandlerKeywordUnknownFallback {
    isPropertyHandler() {
        return false;
    }
    isStackProcessor() {
        return true;
    }
    async validate(parsingContext, util, keys, depth, inProperty) {
        const key = await util.unaliasKeyword(keys[depth], keys, depth);
        if (jsonld_context_parser_1.Util.isPotentialKeyword(key)) {
            // Don't emit anything inside free-floating lists
            if (!inProperty) {
                if (key === '@list') {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    async test(parsingContext, util, key, keys, depth) {
        return jsonld_context_parser_1.Util.isPotentialKeyword(key);
    }
    async handle(parsingContext, util, key, keys, value, depth) {
        const keywordType = EntryHandlerKeywordUnknownFallback.VALID_KEYWORDS_TYPES[key];
        if (keywordType !== undefined) {
            if (keywordType && typeof value !== keywordType.type) {
                parsingContext.emitError(new jsonld_context_parser_1.ErrorCoded(`Invalid value type for '${key}' with value '${value}'`, keywordType.errorCode));
            }
        }
        else if (parsingContext.strictValues) {
            parsingContext.emitError(new Error(`Unknown keyword '${key}' with value '${value}'`));
        }
        parsingContext.emittedStack[depth] = false;
    }
}
exports.EntryHandlerKeywordUnknownFallback = EntryHandlerKeywordUnknownFallback;
EntryHandlerKeywordUnknownFallback.VALID_KEYWORDS_TYPES = {
    '@index': { type: 'string', errorCode: jsonld_context_parser_1.ERROR_CODES.INVALID_INDEX_VALUE },
    '@list': null,
    '@reverse': { type: 'object', errorCode: jsonld_context_parser_1.ERROR_CODES.INVALID_REVERSE_VALUE },
    '@set': null,
    '@value': null,
};
//# sourceMappingURL=EntryHandlerKeywordUnknownFallback.js.map