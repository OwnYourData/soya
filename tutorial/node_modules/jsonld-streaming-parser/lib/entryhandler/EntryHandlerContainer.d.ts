import { IContainerHandler } from "../containerhandler/IContainerHandler";
import { ParsingContext } from "../ParsingContext";
import { Util } from "../Util";
import { IEntryHandler } from "./IEntryHandler";
/**
 * Handles values that are part of a container type (like @index),
 * as specified by {@link IContainerHandler}.
 */
export declare class EntryHandlerContainer implements IEntryHandler<{
    containers: {
        [typeName: string]: boolean;
    };
    handler: IContainerHandler;
}> {
    static readonly CONTAINER_HANDLERS: {
        [id: string]: IContainerHandler;
    };
    /**
     * Check fit the given container is a simple @graph container.
     * Concretely, it will check if no @index or @id is active as well.
     * @param containers A container hash.
     */
    static isSimpleGraphContainer(containers: {
        [typeName: string]: boolean;
    }): boolean;
    /**
     * Check fit the given container is a complex @graph container.
     * Concretely, it will check if @index or @id is active as well next to @graph.
     * @param containers A container hash.
     */
    static isComplexGraphContainer(containers: {
        [typeName: string]: boolean;
    }): boolean;
    /**
     * Create an graph container index that can be used for identifying a graph term inside the graphContainerTermStack.
     * @param containers The applicable containers.
     * @param depth The container depth.
     * @param keys The array of keys.
     * @return The graph index.
     */
    static getContainerGraphIndex(containers: {
        [typeName: string]: boolean;
    }, depth: number, keys: any[]): string;
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
    static getContainerHandler(parsingContext: ParsingContext, keys: any[], depth: number): Promise<{
        containers: {
            [typeName: string]: boolean;
        };
        depth: number;
        fallback: boolean;
    }>;
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
    static isBufferableContainerHandler(parsingContext: ParsingContext, keys: any[], depth: number): Promise<boolean>;
    isPropertyHandler(): boolean;
    isStackProcessor(): boolean;
    validate(parsingContext: ParsingContext, util: Util, keys: any[], depth: number, inProperty: boolean): Promise<boolean>;
    test(parsingContext: ParsingContext, util: Util, key: any, keys: any[], depth: number): Promise<{
        containers: {
            [typeName: string]: boolean;
        };
        handler: IContainerHandler;
    } | null>;
    handle(parsingContext: ParsingContext, util: Util, key: any, keys: any[], value: any, depth: number, testResult: {
        containers: {
            [typeName: string]: boolean;
        };
        handler: IContainerHandler;
    }): Promise<any>;
}
