import { PipelineStage } from '../engine/pipeline/pipeline-engine';
import { Bindings } from '../rdf/bindings';
/**
 * Applies a DISTINCT modifier on the output of another operator.
 * @see {@link https://www.w3.org/TR/2013/REC-sparql11-query-20130321/#modDuplicates}
 * @author Thomas Minier
 * @param source - Input {@link PipelineStage}
 * @return A {@link PipelineStage} which evaluate the DISTINCT operation
 */
export default function sparqlDistinct(source: PipelineStage<Bindings>): PipelineStage<Bindings>;
