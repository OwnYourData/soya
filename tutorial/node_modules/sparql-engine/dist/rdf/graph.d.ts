import { PipelineInput, PipelineStage } from '../engine/pipeline/pipeline-engine';
import { Algebra } from 'sparqljs';
import { Bindings } from './bindings';
import { GRAPH_CAPABILITY } from './graph_capability';
import ExecutionContext from '../engine/context/execution-context';
/**
 * Metadata used for query optimization
 */
export interface PatternMetadata {
    triple: Algebra.TripleObject;
    cardinality: number;
    nbVars: number;
}
/**
 * An abstract RDF Graph, accessed through a RDF Dataset
 * @abstract
 * @author Thomas Minier
 */
export default abstract class Graph {
    private _iri;
    private _capabilities;
    constructor();
    /**
     * Get the IRI of the Graph
     * @return The IRI of the Graph
     */
    get iri(): string;
    /**
     * Set the IRI of the Graph
     * @param value - The new IRI of the Graph
     */
    set iri(value: string);
    /**
     * Test if a graph has a capability
     * @param  token - Capability tested
     * @return True if the graph has the reuqested capability, false otherwise
     */
    _isCapable(token: GRAPH_CAPABILITY): boolean;
    /**
     * Insert a RDF triple into the RDF Graph
     * @param  triple - RDF Triple to insert
     * @return A Promise fulfilled when the insertion has been completed
     */
    abstract insert(triple: Algebra.TripleObject): Promise<void>;
    /**
     * Delete a RDF triple from the RDF Graph
     * @param  triple - RDF Triple to delete
     * @return A Promise fulfilled when the deletion has been completed
     */
    abstract delete(triple: Algebra.TripleObject): Promise<void>;
    /**
     * Get a {@link PipelineInput} which finds RDF triples matching a triple pattern in the graph.
     * @param pattern - Triple pattern to find
     * @param context - Execution options
     * @return A {@link PipelineInput} which finds RDF triples matching a triple pattern
     */
    abstract find(pattern: Algebra.TripleObject, context: ExecutionContext): PipelineInput<Algebra.TripleObject>;
    /**
     * Remove all RDF triples in the Graph
     * @return A Promise fulfilled when the clear operation has been completed
     */
    abstract clear(): Promise<void>;
    /**
     * Estimate the cardinality of a Triple pattern, i.e., the number of matching RDF Triples in the RDF Graph.
     * @param  triple - Triple pattern to estimate cardinality
     * @return A Promise fulfilled with the pattern's estimated cardinality
     */
    estimateCardinality(triple: Algebra.TripleObject): Promise<number>;
    /**
     * Get a {@link PipelineStage} which finds RDF triples matching a triple pattern and a set of keywords in the RDF Graph.
     * The search can be constrained by min and max relevance (a 0 to 1 score signifying how closely the literal matches the search terms).
     *
     * The {@link Graph} class provides a default implementation that computes the relevance
     * score as the percentage of words matching the list of input keywords.
     * If the minRank and/or maxRanks parameters are used, then
     * the graph materializes all matching RDF triples, sort them by descending rank and then
     * selects the appropriates ranks.
     * Otherwise, the rank is not computed and all triples are associated with a rank of -1.
     *
     * Consequently, the default implementation should works fines for a basic usage, but more advanced users
     * should provides their own implementation, integrated with their own backend.
     * For example, a SQL-based RDF Graph should rely on GIN or GIST indexes for the full text search.
     * @param pattern - Triple pattern to find
     * @param variable - SPARQL variable on which the keyword search is performed
     * @param keywords - List of keywords to seach for occurence
     * @param matchAll - True if only values that contain all of the specified search terms should be considered.
     * @param minRelevance - Minimum relevance score (set it to null to disable it)
     * @param maxRelevance - Maximum relevance score (set it to null to disable it)
     * @param minRank - Minimum rank of the matches (set it to null to disable it)
     * @param maxRank - Maximum rank of the matches (set it to null to disable it)
     * @param context - Execution options
     * @return A {@link PipelineInput} which output tuples of shape [matching RDF triple, score, rank].
     * @example
     * const pattern = { subject: '?s', predicate: 'foaf:name', object: '?n'}
     * const keywords = [ 'Ann' , 'Bob' ]
     * // Find the top 100 RDF triples matching the pattern where ?n contains the keyword 'Ann' or 'Bob'
     * // with a minimum relevance score of 0.25 and no maximum relevance score.
     * const pipeline = graph.fullTextSearch(pattern, '?n', keywords, 0.25, null, null, 100, context)
     * pipeline.subscribe(item => {
     *   console.log(`Matching RDF triple ${item[0]} with score ${item[1]} and rank ${item[2]}`)
     * }, console.error, () => console.log('Search completed!'))
     */
    fullTextSearch(pattern: Algebra.TripleObject, variable: string, keywords: string[], matchAll: boolean, minRelevance: number | null, maxRelevance: number | null, minRank: number | null, maxRank: number | null, context: ExecutionContext): PipelineStage<[Algebra.TripleObject, number, number]>;
    /**
     * Evaluates an union of Basic Graph patterns on the Graph using a {@link PipelineStage}.
     * @param  patterns - The set of BGPs to evaluate
     * @param  context - Execution options
     * @return A {@link PipelineStage} which evaluates the Basic Graph pattern on the Graph
     */
    evalUnion(patterns: Algebra.TripleObject[][], context: ExecutionContext): PipelineStage<Bindings>;
    /**
     * Evaluates a Basic Graph pattern, i.e., a set of triple patterns, on the Graph using a {@link PipelineStage}.
     * @param  bgp - The set of triple patterns to evaluate
     * @param  context - Execution options
     * @return A {@link PipelineStage} which evaluates the Basic Graph pattern on the Graph
     */
    evalBGP(bgp: Algebra.TripleObject[], context: ExecutionContext): PipelineStage<Bindings>;
}
