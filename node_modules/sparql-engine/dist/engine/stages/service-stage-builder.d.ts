import StageBuilder from './stage-builder';
import { Algebra } from 'sparqljs';
import { PipelineStage } from '../pipeline/pipeline-engine';
import { Bindings } from '../../rdf/bindings';
import ExecutionContext from '../context/execution-context';
/**
 * A ServiceStageBuilder is responsible for evaluation a SERVICE clause in a SPARQL query.
 * @author Thomas Minier
 * @author Corentin Marionneau
 */
export default class ServiceStageBuilder extends StageBuilder {
    /**
     * Build a {@link PipelineStage} to evaluate a SERVICE clause
     * @param  source  - Input {@link PipelineStage}
     * @param  node    - Service clause
     * @param  options - Execution options
     * @return A {@link PipelineStage} used to evaluate a SERVICE clause
     */
    execute(source: PipelineStage<Bindings>, node: Algebra.ServiceNode, context: ExecutionContext): PipelineStage<Bindings>;
    /**
     * Returns a {@link PipelineStage} used to evaluate a SERVICE clause
     * @abstract
     * @param source    - Input {@link PipelineStage}
     * @param iri       - Iri of the SERVICE clause
     * @param subquery  - Subquery to be evaluated
     * @param options   - Execution options
     * @return A {@link PipelineStage} used to evaluate a SERVICE clause
     */
    _buildIterator(source: PipelineStage<Bindings>, iri: string, subquery: Algebra.RootNode, context: ExecutionContext): PipelineStage<Bindings>;
}
