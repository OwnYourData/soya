

import DatasetExt from "rdf-ext/lib/Dataset";
import { Bindings, ExecutionContext, Graph, HashMapDataset, PipelineInput, PipelineStage, PlanBuilder } from "sparql-engine";
import { Algebra } from "sparqljs";
import rdf from "rdf-ext";
import NamedNodeExt from "rdf-ext/lib/NamedNode";
import { QueryOutput } from "sparql-engine/dist/engine/plan-builder";
const namedNode = rdf.namedNode;

const getMatchPart = (val: string): NamedNodeExt<string> | undefined => {
  if (!val.startsWith('?'))
    return namedNode(val);

  return;
}

export class SparqlGraph extends Graph {
  constructor(private _graph: DatasetExt) {
    super();
  }

  insert(_: Algebra.TripleObject): Promise<void> {
    throw new Error("Method not implemented.");
  }
  delete(_: Algebra.TripleObject): Promise<void> {
    throw new Error("Method not implemented.");
  }
  find({ subject, predicate, object }: Algebra.TripleObject, _: ExecutionContext): PipelineInput<Algebra.TripleObject> {
    const res = this._graph.match(
      getMatchPart(subject),
      getMatchPart(predicate),
      getMatchPart(object),
    );

    return Array.from(res).map((x): Algebra.TripleObject => ({
      subject: x.subject.value,
      predicate: x.predicate.value,
      object: x.object.value,
    }));
  }
  clear(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

export class SparqlQueryBuilder {
  private _builder: PlanBuilder;

  constructor(_graph: DatasetExt) {
    const graph = new SparqlGraph(_graph);
    const dataset = new HashMapDataset('http://example.org#graph-a', graph);

    this._builder = new PlanBuilder(dataset);
  }

  query = (query: string): Promise<Bindings[]> => {
    const iterator = this._builder.build(query) as PipelineStage<QueryOutput>; // FIXME: this `as` might not be correct!

    return new Promise<Bindings[]>((resolve, reject) => {
      let data: Bindings[] = [];

      iterator.subscribe(
        (val) => data.push(val as Bindings), // FIXME: this `as` might not be correct!
        (err: any) => reject(err),
        () => {
          resolve(data);
        }
      )
    });
  }
}