import StageBuilder from './stage-builder';
import { PipelineStage } from '../pipeline/pipeline-engine';
import { Algebra } from 'sparqljs';
import { Bindings } from '../../rdf/bindings';
import Graph from '../../rdf/graph';
import ExecutionContext from '../context/execution-context';
/**
 * The base class to implements to evaluate Property Paths.
 * A subclass of this class only has to implement the `_executePropertyPath` method to provide an execution logic for property paths.
 * @abstract
 * @author Thomas Minier
 */
export default abstract class PathStageBuilder extends StageBuilder {
    /**
     * Return the RDF Graph to be used for BGP evaluation.
     * * If `iris` is empty, returns the default graph
     * * If `iris` has a single entry, returns the corresponding named graph
     * * Otherwise, returns an UnionGraph based on the provided iris
     * @param  iris - List of Graph's iris
     * @return An RDF Graph
     */
    _getGraph(iris: string[]): Graph;
    /**
     * Get a {@link PipelineStage} for evaluating a succession of property paths, connected by joins.
     * @param source - Input {@link PipelineStage}
     * @param  triples - Triple patterns
     * @param  context - Execution context
     * @return A {@link PipelineStage} which yield set of bindings from the pipeline of joins
     */
    execute(source: PipelineStage<Bindings>, triples: Algebra.PathTripleObject[], context: ExecutionContext): PipelineStage<Bindings>;
    /**
     * Get a {@link PipelineStage} for evaluating the property path.
     * @param  subject - Path subject
     * @param  path  - Property path
     * @param  obj   - Path object
     * @param  context - Execution context
     * @return A {@link PipelineStage} which yield set of bindings
     */
    _buildIterator(subject: string, path: Algebra.PropertyPath, obj: string, context: ExecutionContext): PipelineStage<Bindings>;
    /**
     * Execute a property path against a RDF Graph.
     * @param  subject - Path subject
     * @param  path  - Property path
     * @param  obj   - Path object
     * @param  graph - RDF graph
     * @param  context - Execution context
     * @return A {@link PipelineStage} which yield RDF triples matching the property path
     */
    abstract _executePropertyPath(subject: string, path: Algebra.PropertyPath, obj: string, graph: Graph, context: ExecutionContext): PipelineStage<Algebra.TripleObject>;
}
