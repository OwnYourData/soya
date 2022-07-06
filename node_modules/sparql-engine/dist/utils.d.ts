import { Algebra } from 'sparqljs';
import { BGPCache } from './engine/cache/bgp-cache';
import { Bindings } from './rdf/bindings';
import { BlankNode, Literal, NamedNode, Term } from 'rdf-js';
import { Moment } from 'moment';
import { PipelineStage } from './engine/pipeline/pipeline-engine';
import BGPStageBuilder from './engine/stages/bgp-stage-builder';
import ExecutionContext from './engine/context/execution-context';
import Graph from './rdf/graph';
/**
 * RDF related utilities
 */
export declare namespace rdf {
    /**
     * Test if two triple (patterns) are equals
     * @param a - First triple (pattern)
     * @param b - Second triple (pattern)
     * @return True if the two triple (patterns) are equals, False otherwise
     */
    function tripleEquals(a: Algebra.TripleObject, b: Algebra.TripleObject): boolean;
    /**
     * Convert an string RDF Term to a RDFJS representation
     * @see https://rdf.js.org/data-model-spec
     * @param term - A string-based term representation
     * @return A RDF.js term
     */
    function fromN3(term: string): Term;
    /**
     * Convert an RDFJS term to a string-based representation
     * @see https://rdf.js.org/data-model-spec
     * @param term A RDFJS term
     * @return A string-based term representation
     */
    function toN3(term: Term): string;
    /**
     * Parse a RDF Literal to its Javascript representation
     * @see https://www.w3.org/TR/rdf11-concepts/#section-Datatypes
     * @param value - Literal value
     * @param type - Literal datatype
     * @return Javascript representation of the literal
     */
    function asJS(value: string, type: string | null): any;
    /**
     * Creates an IRI in RDFJS format
     * @param value - IRI value
     * @return A new IRI in RDFJS format
     */
    function createIRI(value: string): NamedNode;
    /**
     * Creates a Blank Node in RDFJS format
     * @param value - Blank node value
     * @return A new Blank Node in RDFJS format
     */
    function createBNode(value?: string): BlankNode;
    /**
     * Creates a Literal in RDFJS format, without any datatype or language tag
     * @param value - Literal value
     * @return A new literal in RDFJS format
     */
    function createLiteral(value: string): Literal;
    /**
     * Creates an typed Literal in RDFJS format
     * @param value - Literal value
     * @param type - Literal type (integer, float, dateTime, ...)
     * @return A new typed Literal in RDFJS format
     */
    function createTypedLiteral(value: any, type: string): Literal;
    /**
     * Creates a Literal with a language tag in RDFJS format
     * @param value - Literal value
     * @param language - Language tag (en, fr, it, ...)
     * @return A new Literal with a language tag in RDFJS format
     */
    function createLangLiteral(value: string, language: string): Literal;
    /**
     * Creates an integer Literal in RDFJS format
     * @param value - Integer
     * @return A new integer in RDFJS format
     */
    function createInteger(value: number): Literal;
    /**
     * Creates an float Literal in RDFJS format
     * @param value - Float
     * @return A new float in RDFJS format
     */
    function createFloat(value: number): Literal;
    /**
     * Creates a Literal from a boolean, in RDFJS format
     * @param value - Boolean
     * @return A new boolean in RDFJS format
     */
    function createBoolean(value: boolean): Literal;
    /**
     * Creates a True boolean, in RDFJS format
     * @return A new boolean in RDFJS format
     */
    function createTrue(): Literal;
    /**
     * Creates a False boolean, in RDFJS format
     * @return A new boolean in RDFJS format
     */
    function createFalse(): Literal;
    /**
     * Creates a Literal from a Moment.js date, in RDFJS format
     * @param date - Date, in Moment.js format
     * @return A new date literal in RDFJS format
     */
    function createDate(date: Moment): Literal;
    /**
     * Creates an unbounded literal, used when a variable is not bounded in a set of bindings
     * @return A new literal in RDFJS format
     */
    function createUnbound(): Literal;
    /**
     * Clone a literal and replace its value with another one
     * @param  base     - Literal to clone
     * @param  newValue - New literal value
     * @return The literal with its new value
     */
    function shallowCloneTerm(term: Term, newValue: string): Term;
    /**
     * Test if a RDFJS Term is a Literal
     * @param term - RDFJS Term
     * @return True of the term is a Literal, False otherwise
     */
    function termIsLiteral(term: Term): term is Literal;
    /**
     * Test if a RDFJS Term is an IRI, i.e., a NamedNode
     * @param term - RDFJS Term
     * @return True of the term is an IRI, False otherwise
     */
    function termIsIRI(term: Term): term is NamedNode;
    /**
     * Test if a RDFJS Term is a Blank Node
     * @param term - RDFJS Term
     * @return True of the term is a Blank Node, False otherwise
     */
    function termIsBNode(term: Term): term is BlankNode;
    /**
     * Test if a RDFJS Literal is a number
     * @param literal - RDFJS Literal
     * @return True of the Literal is a number, False otherwise
     */
    function literalIsNumeric(literal: Literal): boolean;
    /**
     * Test if a RDFJS Literal is a date
     * @param literal - RDFJS Literal
     * @return True of the Literal is a date, False otherwise
     */
    function literalIsDate(literal: Literal): boolean;
    /**
     * Test if a RDFJS Literal is a boolean
     * @param term - RDFJS Literal
     * @return True of the Literal is a boolean, False otherwise
     */
    function literalIsBoolean(literal: Literal): boolean;
    /**
     * Test if two RDFJS Terms are equals
     * @param a - First Term
     * @param b - Second Term
     * @return True if the two RDFJS Terms are equals, False
     */
    function termEquals(a: Term, b: Term): boolean;
    /**
     * Create a RDF triple in Object representation
     * @param  {string} subj - Triple's subject
     * @param  {string} pred - Triple's predicate
     * @param  {string} obj  - Triple's object
     * @return A RDF triple in Object representation
     */
    function triple(subj: string, pred: string, obj: string): Algebra.TripleObject;
    /**
     * Count the number of variables in a Triple Pattern
     * @param  {Object} triple - Triple Pattern to process
     * @return The number of variables in the Triple Pattern
     */
    function countVariables(triple: Algebra.TripleObject): number;
    /**
     * Return True if a string is a SPARQL variable
     * @param  str - String to test
     * @return True if the string is a SPARQL variable, False otherwise
     */
    function isVariable(str: string): boolean;
    /**
     * Return True if a string is a RDF Literal
     * @param  str - String to test
     * @return True if the string is a RDF Literal, False otherwise
     */
    function isLiteral(str: string): boolean;
    /**
     * Return True if a string is a RDF IRI/URI
     * @param  str - String to test
     * @return True if the string is a RDF IRI/URI, False otherwise
     */
    function isIRI(str: string): boolean;
    /**
     * Get the value (excluding datatype & language tags) of a RDF literal
     * @param literal - RDF Literal
     * @return The literal's value
     */
    function getLiteralValue(literal: string): string;
    /**
     * Hash Triple (pattern) to assign it an unique ID
     * @param triple - Triple (pattern) to hash
     * @return An unique ID to identify the Triple (pattern)
     */
    function hashTriple(triple: Algebra.TripleObject): string;
    /**
     * Create an IRI under the XSD namespace
     * (<http://www.w3.org/2001/XMLSchema#>)
     * @param suffix - Suffix appended to the XSD namespace to create an IRI
     * @return An new IRI, under the XSD namespac
     */
    function XSD(suffix: string): string;
    /**
     * Create an IRI under the RDF namespace
     * (<http://www.w3.org/1999/02/22-rdf-syntax-ns#>)
     * @param suffix - Suffix appended to the RDF namespace to create an IRI
     * @return An new IRI, under the RDF namespac
     */
    function RDF(suffix: string): string;
    /**
     * Create an IRI under the SEF namespace
     * (<https://callidon.github.io/sparql-engine/functions#>)
     * @param suffix - Suffix appended to the SES namespace to create an IRI
     * @return An new IRI, under the SES namespac
     */
    function SEF(suffix: string): string;
    /**
     * Create an IRI under the SES namespace
     * (<https://callidon.github.io/sparql-engine/search#>)
     * @param suffix - Suffix appended to the SES namespace to create an IRI
     * @return An new IRI, under the SES namespac
     */
    function SES(suffix: string): string;
}
/**
 * SPARQL related utilities
 */
export declare namespace sparql {
    /**
     * Hash Basic Graph pattern to assign them an unique ID
     * @param bgp - Basic Graph Pattern to hash
     * @param md5 - True if the ID should be hashed to md5, False to keep it as a plain text string
     * @return An unique ID to identify the BGP
     */
    function hashBGP(bgp: Algebra.TripleObject[], md5?: boolean): string;
    /**
     * Get the set of SPARQL variables in a triple pattern
     * @param  pattern - Triple Pattern
     * @return The set of SPARQL variables in the triple pattern
     */
    function variablesFromPattern(pattern: Algebra.TripleObject): string[];
    /**
     * Perform a join ordering of a set of triple pattern, i.e., a BGP.
     * Sort pattern such as they creates a valid left linear tree without cartesian products (unless it's required to evaluate the BGP)
     * @param  patterns - Set of triple pattern
     * @return Order set of triple patterns
     */
    function leftLinearJoinOrdering(patterns: Algebra.TripleObject[]): Algebra.TripleObject[];
}
/**
 * Utilities related to SPARQL query evaluation
 * @author Thomas Minier
 */
export declare namespace evaluation {
    /**
     * Evaluate a Basic Graph pattern on a RDF graph using a cache
     * @param bgp - Basic Graph pattern to evaluate
     * @param graph - RDF graph
     * @param cache - Cache used
     * @return A pipeline stage that produces the evaluation results
     */
    function cacheEvalBGP(patterns: Algebra.TripleObject[], graph: Graph, cache: BGPCache, builder: BGPStageBuilder, context: ExecutionContext): PipelineStage<Bindings>;
}
/**
 * Bound a triple pattern using a set of bindings, i.e., substitute variables in the triple pattern
 * using the set of bindings provided
 * @param triple  - Triple pattern
 * @param bindings - Set of bindings
 * @return An new, bounded triple pattern
 */
export declare function applyBindings(triple: Algebra.TripleObject, bindings: Bindings): Algebra.TripleObject;
/**
 * Recursively apply bindings to every triple in a SPARQL group pattern
 * @param  group - SPARQL group pattern to process
 * @param  bindings - Set of bindings to use
 * @return A new SPARQL group pattern with triples bounded
 */
export declare function deepApplyBindings(group: Algebra.PlanNode, bindings: Bindings): Algebra.PlanNode;
/**
 * Extends all set of bindings produced by an iterator with another set of bindings
 * @param  source - Source {@link PipelineStage}
 * @param  bindings - Bindings added to each set of bindings procuded by the iterator
 * @return A {@link PipelineStage} that extends bindins produced by the source iterator
 */
export declare function extendByBindings(source: PipelineStage<Bindings>, bindings: Bindings): PipelineStage<Bindings>;
