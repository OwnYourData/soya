import { AsyncCache } from './cache-interfaces';
import { PipelineStage } from '../pipeline/pipeline-engine';
import { Bindings } from '../../rdf/bindings';
import { Algebra } from 'sparqljs';
export interface BasicGraphPattern {
    patterns: Algebra.TripleObject[];
    graphIRI: string;
}
/**
 * An async cache that stores the solution bindings from BGP evaluation
 * @author Thomas Minier
 */
export interface BGPCache extends AsyncCache<BasicGraphPattern, Bindings, string> {
    /**
     * Search for a BGP in the cache that is a subset of the input BGP
     * This method enable the user to use the Semantic caching technique,
     * to evaluate a BGP using one of its cached subset.
     * @param bgp - Basic Graph pattern
     * @return A pair [subset BGP, set of patterns not in cache]
     */
    findSubset(bgp: BasicGraphPattern): [Algebra.TripleObject[], Algebra.TripleObject[]];
    /**
     * Access the cache and returns a pipeline stage that returns the content of the cache for a given BGP
     * @param bgp - Cache key, i.e., a Basic Graph pattern
     * @param onCancel - Callback invoked when the cache entry is deleted before being committed, so we can produce an alternative pipeline stage to continue query processing. Typically, it is the pipeline stage used to evaluate the BGP without the cache.
     * @return A pipeline stage that returns the content of the cache entry for the given BGP
     */
    getAsPipeline(bgp: BasicGraphPattern, onCancel?: () => PipelineStage<Bindings>): PipelineStage<Bindings>;
}
/**
 * An implementation of a {@link BGPCache} using an {@link AsyncLRUCache}
 * @author Thomas Minier
 */
export declare class LRUBGPCache implements BGPCache {
    private readonly _allKeys;
    private readonly _patternsPerBGP;
    private readonly _cache;
    /**
     * Constructor
     * @param maxSize - The maximum size of the cache
     * @param maxAge - Maximum age in ms
     */
    constructor(maxSize: number, maxAge: number);
    has(bgp: BasicGraphPattern): boolean;
    update(bgp: BasicGraphPattern, item: Bindings, writerID: string): void;
    get(bgp: BasicGraphPattern): Promise<Bindings[]> | null;
    getAsPipeline(bgp: BasicGraphPattern, onCancel?: () => PipelineStage<Bindings>): PipelineStage<Bindings>;
    commit(bgp: BasicGraphPattern, writerID: string): void;
    delete(bgp: BasicGraphPattern, writerID: string): void;
    count(): number;
    findSubset(bgp: BasicGraphPattern): [Algebra.TripleObject[], Algebra.TripleObject[]];
}
