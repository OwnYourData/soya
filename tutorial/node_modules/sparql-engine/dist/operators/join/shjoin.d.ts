import { PipelineStage } from '../../engine/pipeline/pipeline-engine';
import { Bindings } from '../../rdf/bindings';
/**
 * Perform a Symmetric Hash Join between two sources
 * @param  joinKey - SPARQL variable used as join attribute
 * @param  left - Left source (a {@link PipelineStage})
 * @param  right - Right source (a {@link PipelineStage})
 * @return A {@link PipelineStage} that performs a symmetric hash join between the sources
 */
export default function symHashJoin(joinKey: string, left: PipelineStage<Bindings>, right: PipelineStage<Bindings>): PipelineStage<Bindings>;
