import { SoyaDocument } from "../../interfaces";
import { getLastUriPart, parseJsonLd } from "../../utils/rdf";
import { SparqlQueryBuilder } from "../../utils/sparql";

const getMainClass = async (doc: SoyaDocument): Promise<string> => {
  const dataSet = await parseJsonLd(doc);
  const builder = new SparqlQueryBuilder(dataSet);

  // find first class in from
  const classes = await builder.query(`
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
    SELECT ?s WHERE {
      ?s a owl:Class .
    }`);

  const mainClass = classes[0];
  if (!mainClass)
    throw new Error('Could not find main class');

  const mainClassUri = mainClass.get('?s');
  if (!mainClassUri)
    throw new Error('Could not find main class');

  return mainClassUri;
}

interface BuildPathParentResult {
  parent: string;
  path: string[];
}

const getPathToParent = async (builder: SparqlQueryBuilder, uri: string, path: string[] = []): Promise<BuildPathParentResult> => {
  const name = getLastUriPart(uri);
  if (!name)
    throw new Error('Could not extract name from uri');

  path.push(name);

  // find domain of property
  const mappings1 = await builder.query(`
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

  SELECT ?what WHERE {
    <${uri}> rdfs:domain ?what .
}`);

  if (mappings1.length === 0)
    return {
      parent: uri,
      path,
    };

  const domain = mappings1[0]?.get('?what') as string;
  // find property, where domain is used as range
  const mappings2 = await builder.query(`
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

  SELECT ?who WHERE {
    ?who rdfs:range <${domain}> .
}`);

  if (mappings2.length === 0)
    return {
      parent: domain,
      path,
    };

  const prop = mappings2[0]?.get('?who') as string;
  return getPathToParent(builder, prop, path);
}

const buildNestedObject = (res: any, prop: string[], value: string[]): void => {
  const last = prop.pop();
  if (last && prop.length === 0)
    res[last] = `{{${value.reverse().join('.')}}}`;
  else if (last && prop.length > 0) {
    res[last] = {}
    buildNestedObject(res[last], prop, value);
  }
}

export const map = async (from: SoyaDocument, to: SoyaDocument): Promise<any> => {
  const fromMainClass = await getMainClass(from);

  const dataSet = await parseJsonLd(from);
  dataSet.addAll(await parseJsonLd(to));
  const builder = new SparqlQueryBuilder(dataSet);

  const mappings = await builder.query(`
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?pFrom ?pTo WHERE {
  ?pFrom rdfs:subPropertyOf* ?superProp .
  ?pTo   rdfs:subPropertyOf* ?superProp .

  FILTER(?pFrom != ?pTo)
}`);

  const res: any = {};
  // construct return object
  for (const mapping of mappings) {
    const from = mapping.get('?pFrom');
    const to = mapping.get('?pTo');

    if (!from || !to)
      continue;

    const fromPath = await getPathToParent(builder, to);
    // if fromMainClass is not equal to parent
    // we have found a path to a different class and just omit it
    // only if we've found a path to our mainClass
    // we'll include it in the final object
    if (fromPath.parent !== fromMainClass)
      continue;

    const toPath = await getPathToParent(builder, from)

    buildNestedObject(res, fromPath.path, toPath.path);
  }

  return res;
}