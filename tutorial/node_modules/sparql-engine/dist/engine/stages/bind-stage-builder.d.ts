import StageBuilder from './stage-builder';
import { Algebra } from 'sparqljs';
import { PipelineStage } from '../pipeline/pipeline-engine';
import { Bindings } from '../../rdf/bindings';
import ExecutionContext from '../context/execution-context';
import { CustomFunctions } from '../../operators/expressions/sparql-expression';
/**
 * A BindStageBuilder evaluates BIND clauses
 * @author Thomas Minier
 */
export default class BindStageBuilder extends StageBuilder {
    execute(source: PipelineStage<Bindings>, bindNode: Algebra.BindNode, customFunctions: CustomFunctions, context: ExecutionContext): PipelineStage<Bindings>;
}
