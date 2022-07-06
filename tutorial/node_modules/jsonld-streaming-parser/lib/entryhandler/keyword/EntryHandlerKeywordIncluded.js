"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntryHandlerKeywordIncluded = void 0;
const jsonld_context_parser_1 = require("jsonld-context-parser");
const EntryHandlerKeyword_1 = require("./EntryHandlerKeyword");
/**
 * Handles @included entries.
 */
class EntryHandlerKeywordIncluded extends EntryHandlerKeyword_1.EntryHandlerKeyword {
    constructor() {
        super('@included');
    }
    async handle(parsingContext, util, key, keys, value, depth) {
        if (typeof value !== 'object') {
            parsingContext.emitError(new jsonld_context_parser_1.ErrorCoded(`Found illegal @included '${value}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_INCLUDED_VALUE));
        }
        const valueUnliased = await util.unaliasKeywords(value, keys, depth, await parsingContext.getContext(keys));
        if ('@value' in valueUnliased) {
            parsingContext.emitError(new jsonld_context_parser_1.ErrorCoded(`Found an illegal @included @value node '${JSON.stringify(value)}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_INCLUDED_VALUE));
        }
        if ('@list' in valueUnliased) {
            parsingContext.emitError(new jsonld_context_parser_1.ErrorCoded(`Found an illegal @included @list node '${JSON.stringify(value)}'`, jsonld_context_parser_1.ERROR_CODES.INVALID_INCLUDED_VALUE));
        }
        parsingContext.emittedStack[depth] = false;
    }
}
exports.EntryHandlerKeywordIncluded = EntryHandlerKeywordIncluded;
//# sourceMappingURL=EntryHandlerKeywordIncluded.js.map