import StageBuilder from './stage-builder';
import { PipelineStage } from '../pipeline/pipeline-engine';
import { Algebra } from 'sparqljs';
import { Bindings } from '../../rdf/bindings';
import ExecutionContext from '../context/execution-context';
/**
 * A GraphStageBuilder evaluates GRAPH clauses in a SPARQL query.
 * @author Thomas Minier
 */
export default class GraphStageBuilder extends StageBuilder {
    /**
     * Build a {@link PipelineStage} to evaluate a GRAPH clause
     * @param  source  - Input {@link PipelineStage}
     * @param  node    - Graph clause
     * @param  options - Execution options
     * @return A {@link PipelineStage} used to evaluate a GRAPH clause
     */
    execute(source: PipelineStage<Bindings>, node: Algebra.GraphNode, context: ExecutionContext): PipelineStage<Bindings>;
    /**
     * Returns a {@link PipelineStage} used to evaluate a GRAPH clause
     * @param  source    - Input {@link PipelineStage}
     * @param  iri       - IRI of the GRAPH clause
     * @param  subquery  - Subquery to be evaluated
     * @param  options   - Execution options
     * @return A {@link PipelineStage} used to evaluate a GRAPH clause
     */
    _buildIterator(source: PipelineStage<Bindings>, iri: string, subquery: Algebra.RootNode, context: ExecutionContext): PipelineStage<Bindings>;
}
