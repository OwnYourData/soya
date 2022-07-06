import { PipelineStage } from '../engine/pipeline/pipeline-engine';
import { Algebra } from 'sparqljs';
import { Bindings } from '../rdf/bindings';
import { CustomFunctions } from './expressions/sparql-expression';
/**
 * Apply a SPARQL BIND clause
 * @see {@link https://www.w3.org/TR/sparql11-query/#bind}
 * @author Thomas Minier
 * @author Corentin Marionneau
 * @param source - Source {@link PipelineStage}
 * @param variable  - SPARQL variable used to bind results
 * @param expression - SPARQL expression
 * @return A {@link PipelineStage} which evaluate the BIND operation
 */
export default function bind(source: PipelineStage<Bindings>, variable: string, expression: Algebra.Expression | string, customFunctions?: CustomFunctions): PipelineStage<Bindings>;
