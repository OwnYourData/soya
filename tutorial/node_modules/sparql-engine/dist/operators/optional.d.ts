import { PipelineStage } from '../engine/pipeline/pipeline-engine';
import { Algebra } from 'sparqljs';
import { PlanBuilder } from '../engine/plan-builder';
import { Bindings } from '../rdf/bindings';
import ExecutionContext from '../engine/context/execution-context';
/**
 * Handles an SPARQL OPTIONAL clause
 * @see {@link https://www.w3.org/TR/sparql11-query/#optionals}
 * @author Thomas Minier
 * @param source - Input {@link PipelineStage}
 * @param patterns - OPTIONAL clause, i.e., a SPARQL group pattern
 * @param builder - Instance of the current {@link PlanBuilder}
 * @param context - Execution context
 * @return A {@link PipelineStage} which evaluate the OPTIONAL operation
 */
export default function optional(source: PipelineStage<Bindings>, patterns: Algebra.PlanNode[], builder: PlanBuilder, context: ExecutionContext): PipelineStage<Bindings>;
