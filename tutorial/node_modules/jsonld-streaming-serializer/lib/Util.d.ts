import { JsonLdContextNormalized } from "jsonld-context-parser";
import * as RDF from "@rdfjs/types";
/**
 * Utility functions and methods.
 */
export declare class Util {
    static readonly XSD: string;
    static readonly XSD_STRING: string;
    static readonly RDF: string;
    static readonly RDF_TYPE: string;
    static readonly RDF_JSON: string;
    static readonly I18N: string;
    /**
     * Convert an RDF term to a JSON value.
     * @param {Term} term An RDF term.
     * @param {JsonLdContextNormalized} context The context.
     * @param {ITermToValueOptions} options Conversion options.
     * @return {any} A JSON value.
     */
    static termToValue(term: RDF.Term, context: JsonLdContextNormalized, options?: ITermToValueOptions): any;
    /**
     * Convert a string term to a native type.
     * If no conversion is possible, the original string will be returned.
     * @param {string} value An RDF term's string value.
     * @param {string} type
     * @return {any}
     */
    static stringToNativeType(value: string, type: string): any;
}
export interface ITermToValueOptions {
    /**
     * If '@id' objects without other entries should be compacted.
     */
    compactIds?: boolean;
    /**
     * If literals should be converted to primitive types, such as booleans and integers.
     * Defaults to false.
     */
    useNativeTypes?: boolean;
    /**
     * If vocab-mode should be used for term compacting.
     * Defaults to false.
     */
    vocab?: boolean;
    /**
     * The mode by which the values with a certain base direction should be transformed from RDF.
     * * 'i18n-datatype': objects have a https://www.w3.org/ns/i18n# datatype.
     * * 'compound-literal': reified values using rdf:value, rdf:direction and rdf:language.
     */
    rdfDirection?: 'i18n-datatype' | 'compound-literal';
}
