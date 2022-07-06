import { PipelineStage } from '../engine/pipeline/pipeline-engine';
import { Bindings } from '../rdf/bindings';
import { PlanBuilder } from '../engine/plan-builder';
import ExecutionContext from '../engine/context/execution-context';
/**
 * Evaluates a SPARQL FILTER (NOT) EXISTS clause
 * TODO this function could be simplified using a filterMap like operator, we should check if Rxjs offers that filterMap
 * @author Thomas Minier
 * @param source    - Source {@link PipelineStage}
 * @param groups    - Content of the FILTER clause
 * @param builder   - Plan builder used to evaluate subqueries
 * @param notexists - True if the filter is NOT EXISTS, False otherwise
 * @param context   - Execution context
 * @return A {@link PipelineStage} which evaluate the FILTER (NOT) EXISTS operation
 */
export default function exists(source: PipelineStage<Bindings>, groups: any[], builder: PlanBuilder, notexists: boolean, context: ExecutionContext): PipelineStage<Bindings>;
