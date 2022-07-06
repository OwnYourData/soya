import { PipelineStage } from '../engine/pipeline/pipeline-engine';
import { Bindings } from '../rdf/bindings';
/**
 * Formats query solutions (bindings or booleans) from a PipelineStage in W3C SPARQL XML format
 * @see https://www.w3.org/TR/2013/REC-rdf-sparql-XMLres-20130321/
 * @author Thomas Minier
 * @author Corentin Marionneau
 * @param source - Input pipeline
 * @return A pipeline s-that yields results in W3C SPARQL XML format
 */
export default function xmlFormat(source: PipelineStage<Bindings | boolean>): PipelineStage<string>;
