import StageBuilder from './stage-builder';
import { PipelineStage } from '../pipeline/pipeline-engine';
import { Bindings } from '../../rdf/bindings';
import ExecutionContext from '../context/execution-context';
/**
 * A DistinctStageBuilder evaluates DISTINCT modifiers
 * @author Thomas Minier
 */
export default class DistinctStageBuilder extends StageBuilder {
    execute(source: PipelineStage<Bindings>, context: ExecutionContext): PipelineStage<Bindings>;
}
