import Dataset from '../../rdf/dataset';
import { Algebra } from 'sparqljs';
/**
 * Rewrite an ADD query into a INSERT query
 * @see https://www.w3.org/TR/2013/REC-sparql11-update-20130321/#add
 * @param  addQuery - Parsed ADD query
 * @param  dataset - related RDF dataset
 * @return Rewritten ADD query
 */
export declare function rewriteAdd(addQuery: Algebra.UpdateCopyMoveNode, dataset: Dataset): Algebra.UpdateQueryNode;
/**
 * Rewrite a COPY query into a CLEAR + INSERT/DELETE query
 * @see https://www.w3.org/TR/2013/REC-sparql11-update-20130321/#copy
 * @param copyQuery - Parsed COPY query
 * @param dataset - related RDF dataset
 * @return Rewritten COPY query, i.e., a sequence [CLEAR query, INSERT query]
 */
export declare function rewriteCopy(copyQuery: Algebra.UpdateCopyMoveNode, dataset: Dataset): [Algebra.UpdateClearNode, Algebra.UpdateQueryNode];
/**
 * Rewrite a MOVE query into a CLEAR + INSERT/DELETE + CLEAR query
 * @see https://www.w3.org/TR/2013/REC-sparql11-update-20130321/#move
 * @param moveQuery - Parsed MOVE query
 * @param dataset - related RDF dataset
 * @return Rewritten MOVE query, i.e., a sequence [CLEAR query, INSERT query, CLEAR query]
 */
export declare function rewriteMove(moveQuery: Algebra.UpdateCopyMoveNode, dataset: Dataset): [Algebra.UpdateClearNode, Algebra.UpdateQueryNode, Algebra.UpdateClearNode];
/**
 * Extract property paths triples and classic triples from a set of RDF triples.
 * It also performs a first rewriting of some property paths.
 * @param  bgp - Set of RDF triples
 * @return A tuple [classic triples, triples with property paths, set of variables added during rewriting]
 */
export declare function extractPropertyPaths(bgp: Algebra.BGPNode): [Algebra.TripleObject[], Algebra.PathTripleObject[], string[]];
/**
 * Rewriting utilities for Full Text Search queries
 */
export declare namespace fts {
    /**
     * A Full Text Search query
     */
    interface FullTextSearchQuery {
        /** The pattern queried by the full text search */
        pattern: Algebra.TripleObject;
        /** The SPARQL varibale on which the full text search is performed */
        variable: string;
        /** The magic triples sued to configured the full text search query */
        magicTriples: Algebra.TripleObject[];
    }
    /**
     * The results of extracting full text search queries from a BGP
     */
    interface ExtractionResults {
        /** The set of full text search queries extracted from the BGP */
        queries: FullTextSearchQuery[];
        /** Regular triple patterns, i.e., those who should be evaluated as a regular BGP */
        classicPatterns: Algebra.TripleObject[];
    }
    /**
     * Extract all full text search queries from a BGP, using magic triples to identify them.
     * A magic triple is an IRI prefixed by 'https://callidon.github.io/sparql-engine/search#' (ses:search, ses:rank, ses:minRank, etc).
     * @param bgp - BGP to analyze
     * @return The extraction results
     */
    function extractFullTextSearchQueries(bgp: Algebra.TripleObject[]): ExtractionResults;
}
