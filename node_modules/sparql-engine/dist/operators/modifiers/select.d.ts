import { PipelineStage } from '../../engine/pipeline/pipeline-engine';
import { Algebra } from 'sparqljs';
import { Bindings } from '../../rdf/bindings';
/**
 * Evaluates a SPARQL SELECT operation, i.e., perform a selection over sets of solutions bindings
 * @see {@link https://www.w3.org/TR/2013/REC-sparql11-query-20130321/#select}
 * @author Thomas Minier
 * @author Corentin Marionneau
 * @param source - Input {@link PipelineStage}
 * @param query - SELECT query
 * @return A {@link PipelineStage} which evaluate the SELECT modifier
 */
export default function select(source: PipelineStage<Bindings>, query: Algebra.RootNode): PipelineStage<Bindings>;
