import StageBuilder from './stage-builder';
import { Algebra } from 'sparqljs';
import { PipelineStage } from '../pipeline/pipeline-engine';
import { Bindings } from '../../rdf/bindings';
import ExecutionContext from '../context/execution-context';
/**
 * A OrderByStageBuilder evaluates ORDER BY clauses
 * @author Thomas Minier
 */
export default class OrderByStageBuilder extends StageBuilder {
    execute(source: PipelineStage<Bindings>, orders: Algebra.OrderComparator[], context: ExecutionContext): PipelineStage<Bindings>;
}
