import { Term } from 'rdf-js';
declare const _default: {
    'https://callidon.github.io/sparql-engine/functions#cosh': (x: Term) => Term;
    'https://callidon.github.io/sparql-engine/functions#sinh': (x: Term) => Term;
    'https://callidon.github.io/sparql-engine/functions#tanh': (x: Term) => Term;
    'https://callidon.github.io/sparql-engine/functions#coth': (x: Term) => Term;
    'https://callidon.github.io/sparql-engine/functions#sech': (x: Term) => Term;
    'https://callidon.github.io/sparql-engine/functions#csch': (x: Term) => Term;
    'https://callidon.github.io/sparql-engine/functions#toDegrees': (x: Term) => Term;
    'https://callidon.github.io/sparql-engine/functions#toRadians': (x: Term) => Term;
    'https://callidon.github.io/sparql-engine/functions#strsplit': (term: Term, separator: Term) => Iterable<Term>;
};
/**
 * Implementation of NON standard SPARQL operations offered by the framework
 * All arguments are pre-compiled from string to RDF.js terms
 * @author Thomas Minier
 */
export default _default;
