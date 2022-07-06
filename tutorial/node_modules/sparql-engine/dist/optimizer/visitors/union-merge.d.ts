import PlanVisitor from '../plan-visitor';
import { Algebra } from 'sparqljs';
/**
 * Implements the UNION Merge rule: all SPARQL UNION clauses in the same group pattern
 * should be merged as one single UNION clause.
 * @author Thomas Minier
 */
export default class UnionMerge extends PlanVisitor {
    visitUnion(node: Algebra.GroupNode): Algebra.PlanNode;
}
