"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntryHandlerInvalidFallback = void 0;
/**
 * A catch-all for properties, that will either emit an error or ignore,
 * depending on whether or not the `strictValues` property is set.
 */
class EntryHandlerInvalidFallback {
    isPropertyHandler() {
        return false;
    }
    isStackProcessor() {
        return true;
    }
    async validate(parsingContext, util, keys, depth, inProperty) {
        return false;
    }
    async test(parsingContext, util, key, keys, depth) {
        return true;
    }
    async handle(parsingContext, util, key, keys, value, depth) {
        parsingContext.emittedStack[depth] = false;
    }
}
exports.EntryHandlerInvalidFallback = EntryHandlerInvalidFallback;
//# sourceMappingURL=EntryHandlerInvalidFallback.js.map