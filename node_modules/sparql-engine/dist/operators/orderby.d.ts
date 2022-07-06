import { PipelineStage } from '../engine/pipeline/pipeline-engine';
import { Algebra } from 'sparqljs';
import { Bindings } from '../rdf/bindings';
/**
 * A OrderByOperator implements a ORDER BY clause, i.e.,
 * it sorts solution mappings produced by another operator
 * @see {@link https://www.w3.org/TR/2013/REC-sparql11-query-20130321/#modOrderBy}
 * @author Thomas Minier
 * @param source - Input {@link PipelineStage}
 * @param comparators - Set of ORDER BY comparators
 * @return A {@link PipelineStage} which evaluate the ORDER BY operation
 */
export default function orderby(source: PipelineStage<Bindings>, comparators: Algebra.OrderComparator[]): PipelineStage<Bindings>;
