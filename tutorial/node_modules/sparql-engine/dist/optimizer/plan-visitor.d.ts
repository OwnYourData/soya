import { Algebra } from 'sparqljs';
/**
 * A Visitor which performs a Depth-first traversal of a SPARQL query expression tree
 * and transforms each node.
 * Subclasses are used to implements SPARQl query optimization rules.
 * @author Thomas Minier
 */
export default class PlanVisitor {
    /**
     * Visit all nodes starting from this one, using a depth-first traversal,
     * and transform them.
     * @param  node - Root of the expression tree to traverse
     * @return The transformed expression tree
     */
    visit(node: Algebra.PlanNode): Algebra.PlanNode;
    /**
     * Visit and transform a Basic Graph Pattern node.
     * By default, peform no transformation on the node.
     * @param  node - Basic Graph Pattern node
     * @return The transformed Basic Graph Pattern node
     */
    visitBGP(node: Algebra.BGPNode): Algebra.PlanNode;
    /**
     * Visit and transform a SPARQL Group pattern node.
     * By default, recursively transform all members of the group.
     * @param  node - SPARQL Group pattern node
     * @return The transformed SPARQL Group pattern node
     */
    visitGroup(node: Algebra.GroupNode): Algebra.PlanNode;
    /**
     * Visit and transform a SPARQL OPTIONAL node.
     * By default, recursively transform all members of the OPTIONAL.
     * @param  node - SPARQL OPTIONAL node
     * @return The transformed SPARQL OPTIONAL node
     */
    visitOptional(node: Algebra.GroupNode): Algebra.PlanNode;
    /**
     * Visit and transform a SPARQL UNION node.
     * By default, recursively transform all members of the UNION.
     * @param  node - SPARQL UNION node
     * @return The transformed SPARQL UNION node
     */
    visitUnion(node: Algebra.GroupNode): Algebra.PlanNode;
    /**
     * Visit and transform a SPARQL FILTER node.
     * By default, peform no transformation on the node.
     * @param  node - SPARQL FILTER node
     * @return The transformed SPARQL FILTER node
     */
    visitFilter(node: Algebra.FilterNode): Algebra.PlanNode;
    /**
     * Visit and transform a SPARQL GRAPH node.
     * By default, recursively transform all members of the GRAPH.
     * @param  node - SPARQL GRAPH node
     * @return The transformed SPARQL GRAPH node
     */
    visitGraph(node: Algebra.GraphNode): Algebra.PlanNode;
    /**
     * Visit and transform a SPARQL SERVICE node.
     * By default, recursively transform all members of the SERVICE.
     * @param  node - SPARQL SERVICE node
     * @return The transformed SPARQL SERVICE node
     */
    visitService(node: Algebra.ServiceNode): Algebra.PlanNode;
    /**
     * Visit and transform a SPARQL BIND node.
     * By default, peform no transformation on the node.
     * @param  node - SPARQL BIND node
     * @return The transformed SPARQL BIND node
     */
    visitBind(node: Algebra.BindNode): Algebra.PlanNode;
    /**
     * Visit and transform a SPARQL VALUES node.
     * By default, peform no transformation on the node.
     * @param  node - SPARQL VALUES node
     * @return The transformed SPARQL VALUES node
     */
    visitValues(node: Algebra.ValuesNode): Algebra.PlanNode;
}
