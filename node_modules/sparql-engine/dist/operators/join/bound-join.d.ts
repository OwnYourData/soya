import { Algebra } from 'sparqljs';
import { Bindings } from '../../rdf/bindings';
import { PipelineStage } from '../../engine/pipeline/pipeline-engine';
import BGPStageBuilder from '../../engine/stages/bgp-stage-builder';
import ExecutionContext from '../../engine/context/execution-context';
import Graph from '../../rdf/graph';
/**
 * Join the set of bindings produced by a pipeline stage with a BGP using the Bound Join algorithm.
 * @author Thomas Minier
 * @param  source - Source of bindings
 * @param  bgp - Basic Pattern to join with
 * @param  graph - Graphe queried
 * @param  Context - Query execution context
 * @return A pipeline stage which evaluates the bound join
 */
export default function boundJoin(source: PipelineStage<Bindings>, bgp: Algebra.TripleObject[], graph: Graph, builder: BGPStageBuilder, context: ExecutionContext): PipelineStage<Bindings>;
