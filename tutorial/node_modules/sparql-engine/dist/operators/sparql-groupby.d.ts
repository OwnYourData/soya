import { PipelineStage } from '../engine/pipeline/pipeline-engine';
import { Bindings } from '../rdf/bindings';
/**
 * Apply a SPARQL GROUP BY clause
 * @see {@link https://www.w3.org/TR/sparql11-query/#groupby}
 * @author Thomas Minier
 * @param source - Input {@link PipelineStage}
 * @param variables - GROUP BY variables
 * @return A {@link PipelineStage} which evaluate the GROUP BY operation
 */
export default function sparqlGroupBy(source: PipelineStage<Bindings>, variables: string[]): PipelineStage<any>;
