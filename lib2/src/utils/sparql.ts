

import DatasetExt from "rdf-ext/lib/Dataset";
import { Bindings, ExecutionContext, Graph, HashMapDataset, PipelineInput, PipelineStage, PlanBuilder } from "sparql-engine";
import { Algebra } from "sparqljs";
import rdf from "rdf-ext";
import NamedNodeExt from "rdf-ext/lib/NamedNode";
import { QueryOutput } from "sparql-engine/dist/engine/plan-builder";
import BlankNodeExt from "rdf-ext/lib/BlankNode";
import LiteralExt from "rdf-ext/lib/Literal";
import VariableExt from "rdf-ext/lib/Variable";
import { isIRI } from "./rdf";
const namedNode = rdf.namedNode;
const blankNode = rdf.blankNode;

const mapMatchToExt = (val: string): NamedNodeExt<string> | BlankNodeExt | undefined => {
  if (val.startsWith('?'))
    return;

  if (isIRI(val))
    return namedNode(val);
  else
    return blankNode(val);
}

const mapExtToString = (x: NamedNodeExt | LiteralExt | BlankNodeExt | VariableExt): string => {
  let ret = x.value;

  if ((x as LiteralExt).language)
    ret = `"${ret}"@${(x as LiteralExt).language}`;

  return ret;
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
      mapMatchToExt(subject),
      mapMatchToExt(predicate),
      mapMatchToExt(object),
    );

    return Array.from(res).map((x): Algebra.TripleObject => ({
      subject: mapExtToString(x.subject),
      predicate: mapExtToString(x.predicate),
      object: mapExtToString(x.object),
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