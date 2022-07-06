import { Term } from 'rdf-js';
declare type TermRows = {
    [key: string]: Term[];
};
declare const _default: {
    'https://callidon.github.io/sparql-engine/aggregates#accuracy': (a: string, b: string, rows: TermRows) => Term;
    'https://callidon.github.io/sparql-engine/aggregates#gmean': (variable: string, rows: TermRows) => Term;
    'https://callidon.github.io/sparql-engine/aggregates#mse': (a: string, b: string, rows: TermRows) => Term;
    'https://callidon.github.io/sparql-engine/aggregates#rmse': (a: string, b: string, rows: TermRows) => Term;
    'https://callidon.github.io/sparql-engine/aggregates#precision': (a: string, b: string, rows: TermRows) => Term;
    'https://callidon.github.io/sparql-engine/aggregates#recall': (a: string, b: string, rows: TermRows) => Term;
    'https://callidon.github.io/sparql-engine/aggregates#f1': (a: string, b: string, rows: TermRows) => Term;
};
/**
 * Implementation of Non standard SPARQL aggregations offered by the framework
 * All arguments are pre-compiled from string to RDF.js terms
 * @author Thomas Minier
 */
export default _default;
