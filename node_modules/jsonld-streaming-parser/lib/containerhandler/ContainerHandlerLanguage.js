"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContainerHandlerLanguage = void 0;
const jsonld_context_parser_1 = require("jsonld-context-parser");
/**
 * Container handler for @language.
 *
 * It assumes that the current key is the language of the current value.
 * This will add this value to the parent node.
 */
class ContainerHandlerLanguage {
    canCombineWithGraph() {
        return false;
    }
    async handle(containers, parsingContext, util, keys, value, depth) {
        const language = await util.getContainerKey(keys[depth], keys, depth);
        if (Array.isArray(value)) {
            // No type-checking needed, will be handled on each value when this handler is called recursively.
            value = value.map((subValue) => ({ '@value': subValue, '@language': language }));
        }
        else {
            if (typeof value !== 'string') {
                throw new jsonld_context_parser_1.ErrorCoded(`Got invalid language map value, got '${JSON.stringify(value)}', but expected string`, jsonld_context_parser_1.ERROR_CODES.INVALID_LANGUAGE_MAP_VALUE);
            }
            value = { '@value': value, '@language': language };
        }
        await parsingContext.newOnValueJob(keys.slice(0, keys.length - 1), value, depth - 1, true);
        parsingContext.emittedStack[depth] = false; // We have emitted a level higher
    }
}
exports.ContainerHandlerLanguage = ContainerHandlerLanguage;
//# sourceMappingURL=ContainerHandlerLanguage.js.map