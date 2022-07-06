import { Algebra } from 'sparqljs';
import { Bindings } from '../../rdf/bindings';
import { Term } from 'rdf-js';
/**
 * An input SPARQL expression to be compiled
 */
export declare type InputExpression = Algebra.Expression | string | string[];
/**
 * The output of a SPARQL expression's evaluation, one of the following
 * * A RDFJS Term.
 * * An array of RDFJS Terms.
 * * An iterator that yields RDFJS Terms or null values.
 * * A `null` value, which indicates that the expression's evaluation has failed.
 */
export declare type ExpressionOutput = Term | Term[] | Iterable<Term | null> | null;
/**
 * A SPARQL expression compiled as a function
 */
export declare type CompiledExpression = (bindings: Bindings) => ExpressionOutput;
/**
 * Type alias to describe the shape of custom functions. It's basically a JSON object from an IRI (in string form) to a function of 0 to many RDFTerms that produces an RDFTerm.
 */
export declare type CustomFunctions = {
    [key: string]: (...args: (Term | Term[] | null)[]) => ExpressionOutput;
};
/**
 * Compile and evaluate a SPARQL expression (found in FILTER clauses, for example)
 * @author Thomas Minier
 */
export declare class SPARQLExpression {
    private readonly _expression;
    /**
     * Constructor
     * @param expression - SPARQL expression
     */
    constructor(expression: InputExpression, customFunctions?: CustomFunctions);
    /**
     * Recursively compile a SPARQL expression into a function
     * @param  expression - SPARQL expression
     * @return Compiled SPARQL expression
     */
    private _compileExpression;
    /**
     * Evaluate the expression using a set of mappings
     * @param  bindings - Set of mappings
     * @return Results of the evaluation
     */
    evaluate(bindings: Bindings): ExpressionOutput;
}
