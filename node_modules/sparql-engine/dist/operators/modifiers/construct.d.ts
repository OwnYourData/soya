import { PipelineStage } from '../../engine/pipeline/pipeline-engine';
import { Algebra } from 'sparqljs';
import { Bindings } from '../../rdf/bindings';
/**
 * A ConstructOperator transform solution mappings into RDF triples, according to a template
 * @see {@link https://www.w3.org/TR/2013/REC-sparql11-query-20130321/#construct}
 * @param source  - Source {@link PipelineStage}
 * @param templates - Set of triples patterns in the CONSTRUCT clause
 * @return A {@link PipelineStage} which evaluate the CONSTRUCT modifier
 * @author Thomas Minier
 */
export default function construct(source: PipelineStage<Bindings>, query: any): PipelineStage<Algebra.TripleObject>;
