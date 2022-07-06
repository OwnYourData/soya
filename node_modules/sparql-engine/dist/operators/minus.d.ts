import { PipelineStage } from '../engine/pipeline/pipeline-engine';
import { Bindings } from '../rdf/bindings';
/**
 * Evaluates a SPARQL MINUS clause
 * @see {@link https://www.w3.org/TR/sparql11-query/#neg-minus}
 * @author Thomas Minier
 * @param leftSource - Left input {@link PipelineStage}
 * @param rightSource - Right input {@link PipelineStage}
 * @return A {@link PipelineStage} which evaluate the MINUS operation
 */
export default function minus(leftSource: PipelineStage<Bindings>, rightSource: PipelineStage<Bindings>): PipelineStage<Bindings>;
