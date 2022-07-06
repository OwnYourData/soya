import { Algebra } from 'sparqljs';
import PlanVisitor from './plan-visitor';
/**
 * An Optimizer applies a set of optimization rules, implemented using subclasses of {@link PlanVisitor}.
 * @author Thomas Minier
 */
export default class Optimizer {
    private _visitors;
    constructor();
    /**
     * Get an optimizer configured with the default optimization rules
     * @return A new Optimizer pre-configured with default rules
     */
    static getDefault(): Optimizer;
    /**
     * Register a new visitor, which implements an optimization rule.
     * @param visitor - Visitor
     */
    addVisitor(visitor: PlanVisitor): void;
    /**
     * Optimize a SPARQL query expression tree, by applying the set of rules.
     * @param  plan - SPARQL query expression tree to iptimize
     * @return Optimized SPARQL query expression tree
     */
    optimize(plan: Algebra.PlanNode): Algebra.PlanNode;
}
