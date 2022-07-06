import { PipelineStage } from '../engine/pipeline/pipeline-engine';
import { CustomFunctions } from './expressions/sparql-expression';
import { Algebra } from 'sparqljs';
import { Bindings } from '../rdf/bindings';
/**
 * Evaluate SPARQL Filter clauses
 * @see {@link https://www.w3.org/TR/sparql11-query/#expressions}
 * @author Thomas Minier
 * @param source - Input {@link PipelineStage}
 * @param expression - FILTER expression
 * @param customFunctions - User-defined SPARQL functions (optional)
 * @return A {@link PipelineStage} which evaluate the FILTER operation
 */
export default function sparqlFilter(source: PipelineStage<Bindings>, expression: Algebra.Expression, customFunctions?: CustomFunctions): PipelineStage<Bindings>;
