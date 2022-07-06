import StageBuilder from './stage-builder';
import { Algebra } from 'sparqljs';
import { PipelineStage } from '../pipeline/pipeline-engine';
import { Bindings } from '../../rdf/bindings';
import ExecutionContext from '../context/execution-context';
/**
 * A MinusStageBuilder evaluates MINUS clauses
 * @author Thomas Minier
 */
export default class MinusStageBuilder extends StageBuilder {
    execute(source: PipelineStage<Bindings>, node: Algebra.GroupNode, context: ExecutionContext): PipelineStage<Bindings>;
}
