import { QueryHints } from './query-hints';
import { BGPCache } from '../cache/bgp-cache';
/**
 * An execution context conatains control information for query execution.
 */
export default class ExecutionContext {
    protected _properties: Map<Symbol, any>;
    protected _hints: QueryHints;
    protected _defaultGraphs: string[];
    protected _namedGraphs: string[];
    protected _cache: BGPCache | null;
    constructor();
    /**
     * The set of graphs used as the default graph
     * @return The set of graphs used as the default graph
     */
    get defaultGraphs(): string[];
    /**
     * Update the set of graphs used as the default graph
     * @param  values - The set of graphs used as the default graph
     */
    set defaultGraphs(values: string[]);
    /**
     * The set of graphs used as named graphs
     * @return The set of graphs used as named graphs
     */
    get namedGraphs(): string[];
    /**
     * Update the set of graphs used as named graphs
     * @param  values - The set of graphs used as named graphs
     */
    set namedGraphs(values: string[]);
    /**
     * Get query hints collected until now
     * @return All query hints collected until now
     */
    get hints(): QueryHints;
    /**
     * Update the query hints
     * @param  newHints - New query hints
     */
    set hints(newHints: QueryHints);
    /**
     * Get the BGP cache currently used by the query engine.
     * returns null if caching is disabled
     * @return The BGP cache currently used by the query engine, or null if caching is disabled.
     */
    get cache(): BGPCache | null;
    /**
     * Set the BGP cache currently used by the query engine.
     * Use null to disable caching
     * @param newCache - The BGP cache to use for caching.
     */
    set cache(newCache: BGPCache | null);
    /**
     * Test the caching is enabled
     * @return True if the caching is enabled, false otherwise
     */
    cachingEnabled(): boolean;
    /**
     * Get a property associated with a key
     * @param  key - Key associated with the property
     * @return  The value associated with the key
     */
    getProperty(key: Symbol): any | null;
    /**
     * Test if the context contains a property associated with a key
     * @param  key - Key associated with the property
     * @return True if the context contains a property associated with the key
     */
    hasProperty(key: Symbol): boolean;
    /**
     * Set a (key, value) property in the context
     * @param key - Key of the property
     * @param value - Value of the property
     */
    setProperty(key: Symbol, value: any): void;
    /**
     * Clone the execution context
     * @return A clone of the execution context
     */
    clone(): ExecutionContext;
    /**
     * Merge the context with another execution context
     * @param  other - Execution context to merge with
     * @return The merged execution context
     */
    merge(other: ExecutionContext): ExecutionContext;
}
