import { Term } from 'rdf-js';
declare type TermRows = {
    [key: string]: Term[];
};
declare const _default: {
    count: (variable: string, rows: TermRows) => Term;
    sum: (variable: string, rows: TermRows) => Term;
    avg: (variable: string, rows: TermRows) => Term;
    min: (variable: string, rows: TermRows) => Term;
    max: (variable: string, rows: TermRows) => Term;
    group_concat: (variable: string, rows: TermRows, sep: string) => Term;
    sample: (variable: string, rows: TermRows) => Term;
};
/**
 * SPARQL Aggregation operations.
 * Each operation takes an arguments a SPARQL variable and a row of bindings, i.e., a list of
 * solutions bindings on which the aggregation must be applied.
 * Each operations is expected to return a term, as with classic SPARQL operations
 * @see https://www.w3.org/TR/sparql11-query/#aggregateAlgebra
 * @author Thomas Minier
 */
export default _default;
