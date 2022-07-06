import { PipelineStage } from '../pipeline/pipeline-engine';
import StageBuilder from './stage-builder';
import { CustomFunctions } from '../../operators/expressions/sparql-expression';
import { Algebra } from 'sparqljs';
import { Bindings } from '../../rdf/bindings';
import ExecutionContext from '../context/execution-context';
/**
 * An AggregateStageBuilder handles the evaluation of Aggregations operations,
 * GROUP BY and HAVING clauses in SPARQL queries.
 * @see https://www.w3.org/TR/sparql11-query/#aggregates
 * @author Thomas Minier
 */
export default class AggregateStageBuilder extends StageBuilder {
    /**
     * Build a {@link PipelineStage} for the evaluation of SPARQL aggregations
     * @param source  - Input {@link PipelineStage}
     * @param query   - Parsed SPARQL query (logical execution plan)
     * @param options - Execution options
     * @return A {@link PipelineStage} which evaluate SPARQL aggregations
     */
    execute(source: PipelineStage<Bindings>, query: Algebra.RootNode, context: ExecutionContext, customFunctions?: CustomFunctions): PipelineStage<Bindings>;
    /**
     * Build a {@link PipelineStage} for the evaluation of a GROUP BY clause
     * @param source  - Input {@link PipelineStage}
     * @param  groupby - GROUP BY clause
     * @param  options - Execution options
     * @return A {@link PipelineStage} which evaluate a GROUP BY clause
     */
    _executeGroupBy(source: PipelineStage<Bindings>, groupby: Algebra.Aggregation[], context: ExecutionContext, customFunctions?: CustomFunctions): PipelineStage<Bindings>;
    /**
     * Build a {@link PipelineStage} for the evaluation of a HAVING clause
     * @param  source  - Input {@link PipelineStage}
     * @param  having  - HAVING clause
     * @param  options - Execution options
     * @return A {@link PipelineStage} which evaluate a HAVING clause
     */
    _executeHaving(source: PipelineStage<Bindings>, having: Algebra.Expression[], context: ExecutionContext, customFunctions?: CustomFunctions): PipelineStage<Bindings>;
}
