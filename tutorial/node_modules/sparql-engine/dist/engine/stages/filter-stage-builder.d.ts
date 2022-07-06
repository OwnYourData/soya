import StageBuilder from './stage-builder';
import { Algebra } from 'sparqljs';
import { PipelineStage } from '../pipeline/pipeline-engine';
import { Bindings } from '../../rdf/bindings';
import ExecutionContext from '../context/execution-context';
import { CustomFunctions } from '../../operators/expressions/sparql-expression';
/**
 * A FilterStageBuilder evaluates FILTER clauses
 * @author Thomas Minier
 */
export default class FilterStageBuilder extends StageBuilder {
    execute(source: PipelineStage<Bindings>, filterNode: Algebra.FilterNode, customFunctions: CustomFunctions, context: ExecutionContext): PipelineStage<Bindings>;
}
