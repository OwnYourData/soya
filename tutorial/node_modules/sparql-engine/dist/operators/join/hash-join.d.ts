import { PipelineStage } from '../../engine/pipeline/pipeline-engine';
import { Bindings } from '../../rdf/bindings';
/**
 * Perform a traditional Hash join between two sources, i.e., materialize the right source in a hash table and then read from the left source while probing into the hash table.
 * @param  left - Left source (a {@link PipelineStage})
 * @param  right - Right source (a {@link PipelineStage})
 * @param  joinKey - SPARQL variable used as join attribute
 * @return A {@link PipelineStage} which performs a Hash join
 */
export default function hashJoin(left: PipelineStage<Bindings>, right: PipelineStage<Bindings>, joinKey: string): PipelineStage<Bindings>;
