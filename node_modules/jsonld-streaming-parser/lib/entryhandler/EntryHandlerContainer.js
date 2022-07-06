"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntryHandlerContainer = void 0;
const ContainerHandlerIdentifier_1 = require("../containerhandler/ContainerHandlerIdentifier");
const ContainerHandlerIndex_1 = require("../containerhandler/ContainerHandlerIndex");
const ContainerHandlerLanguage_1 = require("../containerhandler/ContainerHandlerLanguage");
const ContainerHandlerType_1 = require("../containerhandler/ContainerHandlerType");
const Util_1 = require("../Util");
/**
 * Handles values that are part of a container type (like @index),
 * as specified by {@link IContainerHandler}.
 */
class EntryHandlerContainer {
    /**
     * Check fit the given container is a simple @graph container.
     * Concretely, it will check if no @index or @id is active as well.
     * @param containers A container hash.
     */
    static isSimpleGraphContainer(containers) {
        return '@graph' in containers
            && (('@set' in containers && Object.keys(containers).length === 2) || Object.keys(containers).length === 1);
    }
    /**
     * Check fit the given container is a complex @graph container.
     * Concretely, it will check if @index or @id is active as well next to @graph.
     * @param containers A container hash.
     */
    static isComplexGraphContainer(containers) {
        return '@graph' in containers
            && (('@set' in containers && Object.keys(containers).length > 2)
                || (!('@set' in containers) && Object.keys(containers).length > 1));
    }
    /**
     * Create an graph container index that can be used for identifying a graph term inside the graphContainerTermStack.
     * @param containers The applicable containers.
     * @param depth The container depth.
     * @param keys The array of keys.
     * @return The graph index.
     */
    static getContainerGraphIndex(containers, depth, keys) {
        let isSimpleGraphContainer = EntryHandlerContainer.isSimpleGraphContainer(containers);
        let index = '';
        for (let i = depth; i < keys.length; i++) {
            if (!isSimpleGraphContainer || typeof keys[i] === 'number') {
                index += ':' + keys[i];
            }
            // Only allow a second 'real' key if in a non-simple graph container.
            if (!isSimpleGraphContainer && typeof keys[i] !== 'number') {
                isSimpleGraphContainer = true;
            }
        }
        return index;
    }
    /**
     * Return the applicable container type at the given depth.
     *
     * This will ignore any arrays in the key chain.
     *
     * @param {ParsingContext} parsingContext A parsing context.
     * @param {any[]} keys The array of keys.
     * @param {number} depth The current depth.
     * @return {Promise<{ containers: {[typeName: string]: boolean}, depth: number, fallback: boolean }>}
     *          All applicable containers for the given depth,
     *          the `depth` of the container root (can change when arrays are in the key chain),
     *          and the `fallback` flag that indicates if the default container type was returned
     *            (i.e., no dedicated container type is defined).
     */
    static async getContainerHandler(parsingContext, keys, depth) {
        const fallback = {
            containers: { '@set': true },
            depth,
            fallback: true,
        };
        // A flag that is enabled when @graph container should be tested in next iteration
        let checkGraphContainer = false;
        // Iterate from deeper to higher
        const context = await parsingContext.getContext(keys, 2);
        for (let i = depth - 1; i >= 0; i--) {
            if (typeof keys[i] !== 'number') { // Skip array keys
                // @graph containers without any other types are one level less deep, and require special handling
                const containersSelf = Util_1.Util.getContextValue(context, '@container', keys[i], false);
                if (containersSelf && EntryHandlerContainer.isSimpleGraphContainer(containersSelf)) {
                    return {
                        containers: containersSelf,
                        depth: i + 1,
                        fallback: false,
                    };
                }
                const containersParent = Util_1.Util.getContextValue(context, '@container', keys[i - 1], false);
                if (!containersParent) { // If we have the fallback container value
                    if (checkGraphContainer) {
                        // Return false if we were already expecting a @graph-@id of @graph-@index container
                        return fallback;
                    }
                    // Check parent-parent, we may be in a @graph-@id of @graph-@index container, which have two levels
                    checkGraphContainer = true;
                }
                else {
                    // We had an invalid container next iteration, so we now have to check if we were in an @graph container
                    const graphContainer = '@graph' in containersParent;
                    // We're in a regular container
                    for (const containerHandleName in EntryHandlerContainer.CONTAINER_HANDLERS) {
                        if (containersParent[containerHandleName]) {
                            if (graphContainer) {
                                // Only accept graph containers if their combined handlers can handle them.
                                if (EntryHandlerContainer.CONTAINER_HANDLERS[containerHandleName].canCombineWithGraph()) {
                                    return {
                                        containers: containersParent,
                                        depth: i,
                                        fallback: false,
                                    };
                                }
                                else {
                                    return fallback;
                                }
                            }
                            else {
                                // Only accept if we were not expecting a @graph-@id of @graph-@index container
                                if (checkGraphContainer) {
                                    return fallback;
                                }
                                else {
                                    return {
                                        containers: containersParent,
                                        depth: i,
                                        fallback: false,
                                    };
                                }
                            }
                        }
                    }
                    // Fail if no valid container handlers were found
                    return fallback;
                }
            }
        }
        return fallback;
    }
    /**
     * Check if we are handling a value at the given depth
     * that is part of something that should be handled as a container,
     * AND if this container should be buffered, so that it can be handled by a dedicated container handler.
     *
     * For instance, any container with @graph will NOT be buffered.
     *
     * This will ignore any arrays in the key chain.
     *
     * @param {ParsingContext} parsingContext A parsing context.
     * @param {any[]} keys The array of keys.
     * @param {number} depth The current depth.
     * @return {Promise<boolean>} If we are in the scope of a container handler.
     */
    static async isBufferableContainerHandler(parsingContext, keys, depth) {
        const handler = await EntryHandlerContainer.getContainerHandler(parsingContext, keys, depth);
        return !handler.fallback && !('@graph' in handler.containers);
    }
    isPropertyHandler() {
        return false;
    }
    isStackProcessor() {
        return true;
    }
    async validate(parsingContext, util, keys, depth, inProperty) {
        return !!await this.test(parsingContext, util, null, keys, depth);
    }
    async test(parsingContext, util, key, keys, depth) {
        const containers = Util_1.Util.getContextValueContainer(await parsingContext.getContext(keys, 2), keys[depth - 1]);
        for (const containerName in EntryHandlerContainer.CONTAINER_HANDLERS) {
            if (containers[containerName]) {
                return {
                    containers,
                    handler: EntryHandlerContainer.CONTAINER_HANDLERS[containerName],
                };
            }
        }
        return null;
    }
    async handle(parsingContext, util, key, keys, value, depth, testResult) {
        return testResult.handler.handle(testResult.containers, parsingContext, util, keys, value, depth);
    }
}
exports.EntryHandlerContainer = EntryHandlerContainer;
EntryHandlerContainer.CONTAINER_HANDLERS = {
    '@id': new ContainerHandlerIdentifier_1.ContainerHandlerIdentifier(),
    '@index': new ContainerHandlerIndex_1.ContainerHandlerIndex(),
    '@language': new ContainerHandlerLanguage_1.ContainerHandlerLanguage(),
    '@type': new ContainerHandlerType_1.ContainerHandlerType(),
};
//# sourceMappingURL=EntryHandlerContainer.js.map