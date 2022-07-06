import { PipelineStage } from '../../engine/pipeline/pipeline-engine';
import Graph from '../../rdf/graph';
import { Bindings } from '../../rdf/bindings';
import { Algebra } from 'sparqljs';
import ExecutionContext from '../../engine/context/execution-context';
/**
 * Perform a join between a source of solution bindings (left relation)
 * and a triple pattern (right relation) using the Index Nested Loop Join algorithm.
 * This algorithm is more efficient if the cardinality of the left relation is smaller
 * than the cardinality of the right one.
 * @param source - Left input (a {@link PipelineStage})
 * @param pattern - Triple pattern to join with (right relation)
 * @param graph   - RDF Graph on which the join is performed
 * @param context - Execution context
 * @return A {@link PipelineStage} which evaluate the join
 * @author Thomas Minier
 */
export default function indexJoin(source: PipelineStage<Bindings>, pattern: Algebra.TripleObject, graph: Graph, context: ExecutionContext): PipelineStage<Bindings>;
