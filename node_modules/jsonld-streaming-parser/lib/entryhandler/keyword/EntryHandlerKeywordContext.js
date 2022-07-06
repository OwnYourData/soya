"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntryHandlerKeywordContext = void 0;
const jsonld_context_parser_1 = require("jsonld-context-parser");
const EntryHandlerKeyword_1 = require("./EntryHandlerKeyword");
/**
 * Handles @context entries.
 */
class EntryHandlerKeywordContext extends EntryHandlerKeyword_1.EntryHandlerKeyword {
    constructor() {
        super('@context');
    }
    isStackProcessor() {
        return false;
    }
    async handle(parsingContext, util, key, keys, value, depth) {
        // Error if an out-of-order context was found when support is not enabled.
        if (parsingContext.streamingProfile
            && (parsingContext.processingStack[depth]
                || parsingContext.processingType[depth]
                || parsingContext.idStack[depth] !== undefined)) {
            parsingContext.emitError(new jsonld_context_parser_1.ErrorCoded('Found an out-of-order context, while streaming is enabled.' +
                '(disable `streamingProfile`)', jsonld_context_parser_1.ERROR_CODES.INVALID_STREAMING_KEY_ORDER));
        }
        // Find the parent context to inherit from.
        // We actually request a context for the current depth (with fallback to parent)
        // because we want to take into account any property-scoped contexts that are defined for this depth.
        const parentContext = parsingContext.getContext(keys);
        // Set the context for this scope
        const context = parsingContext.parseContext(value, (await parentContext).getContextRaw());
        parsingContext.contextTree.setContext(keys.slice(0, -1), context);
        parsingContext.emitContext(value);
        await parsingContext.validateContext(await context);
    }
}
exports.EntryHandlerKeywordContext = EntryHandlerKeywordContext;
//# sourceMappingURL=EntryHandlerKeywordContext.js.map