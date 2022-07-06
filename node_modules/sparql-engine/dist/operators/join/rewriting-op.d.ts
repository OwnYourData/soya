import ExecutionContext from '../../engine/context/execution-context';
import Graph from '../../rdf/graph';
import { Bindings } from '../../rdf/bindings';
import { Algebra } from 'sparqljs';
import { PipelineStage } from '../../engine/pipeline/pipeline-engine';
import BGPStageBuilder from '../../engine/stages/bgp-stage-builder';
/**
 * A special operator used to evaluate a UNION query with a RDF Graph,
 * and then rewrite bindings generated and performs union with original bindings.
 * It is designed to be used in the bound join algorithm
 * @author Thomas Minier
 * @private
 * @param  graph - Graph queried
 * @param  bgpBucket - List of BGPs to evaluate
 * @param  rewritingTable - Map <rewriting key -> original bindings>
 * @param  context - Query execution context
 * @return A pipeline stage which evaluates the query.
 */
export default function rewritingOp(graph: Graph, bgpBucket: Algebra.TripleObject[][], rewritingTable: Map<number, Bindings>, builder: BGPStageBuilder, context: ExecutionContext): PipelineStage<Bindings>;
