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

export const map = async (from: SoyaDocument, to: SoyaDocument): Promise<any> => {
  const fromMainClass = await getMainClass(from);
  const toMainClass = await getMainClass(to);

  const dataSet = await parseJsonLd(from);
  dataSet.addAll(await parseJsonLd(to));
  const builder = new SparqlQueryBuilder(dataSet);

  // TODO: this does currently not include subdomains
  // e.g. if a base has other nested objects
  const mappings = await builder.query(`
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

  SELECT DISTINCT ?pFrom ?pTo WHERE {
    ?pFrom rdfs:domain <${fromMainClass}> ;
           rdfs:subPropertyOf* ?superProp .
    
    ?pTo   rdfs:domain <${toMainClass}> ;
           rdfs:subPropertyOf* ?superProp .    
}`);

  const res: any = {};
  // construct return object
  for (const mapping of mappings) {
    const from = mapping.get('?pFrom');
    const to = mapping.get('?pTo');

    if (!from || !to)
      continue;

    // TODO: What do we do, if we have nested objects?
    res[getLastUriPart(to) ?? to] = `{{${getLastUriPart(from)}}}`
  }

  return res;
}