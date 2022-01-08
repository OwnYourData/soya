"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextTree = void 0;
/**
 * A tree structure that holds all contexts,
 * based on their position in the JSON object.
 *
 * Positions are identified by a path of keys.
 */
class ContextTree {
    constructor() {
        this.subTrees = {};
    }
    getContext(keys) {
        if (keys.length > 0) {
            const [head, ...tail] = keys;
            const subTree = this.subTrees[head];
            if (subTree) {
                const subContext = subTree.getContext(tail);
                if (subContext) {
                    return subContext.then(({ context, depth }) => ({ context, depth: depth + 1 }));
                }
            }
        }
        return this.context ? this.context.then((context) => ({ context, depth: 0 })) : null;
    }
    setContext(keys, context) {
        if (keys.length === 0) {
            this.context = context;
        }
        else {
            const [head, ...tail] = keys;
            let subTree = this.subTrees[head];
            if (!subTree) {
                subTree = this.subTrees[head] = new ContextTree();
            }
            subTree.setContext(tail, context);
        }
    }
    removeContext(path) {
        this.setContext(path, null);
    }
}
exports.ContextTree = ContextTree;
//# sourceMappingURL=ContextTree.js.map