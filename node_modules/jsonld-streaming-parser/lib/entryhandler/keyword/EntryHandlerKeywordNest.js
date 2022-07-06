"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntryHandlerKeywordNest = void 0;
const jsonld_context_parser_1 = require("jsonld-context-parser");
const EntryHandlerKeyword_1 = require("./EntryHandlerKeyword");
/**
 * Handles @nest entries.
 */
class EntryHandlerKeywordNest extends EntryHandlerKeyword_1.EntryHandlerKeyword {
    constructor() {
        super('@nest');
    }
    async handle(parsingContext, util, key, keys, value, depth) {
        if (typeof value !== 'object') {
            parsingContext.emitError(new jsonld_context_parser_1.ErrorCoded(`Found invalid @nest entry for '${key}': '${value}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_NEST_VALUE));
        }
        if ('@value' in await util.unaliasKeywords(value, keys, depth, await parsingContext.getContext(keys))) {
            parsingContext.emitError(new jsonld_context_parser_1.ErrorCoded(`Found an invalid @value node for '${key}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_NEST_VALUE));
        }
        parsingContext.emittedStack[depth] = false;
    }
}
exports.EntryHandlerKeywordNest = EntryHandlerKeywordNest;
//# sourceMappingURL=EntryHandlerKeywordNest.js.map