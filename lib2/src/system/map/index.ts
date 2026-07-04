import { SoyaDocument } from "../../interfaces";
import { getLastUriPart, isIRI, parseJsonLd } from "../../utils/rdf";
import { SparqlQueryBuilder } from "../../utils/sparql";

const SUB_PROPERTY_KEYS = ['rdfs:subPropertyOf', 'subPropertyOf'];

/**
 * Extracts all prefix definitions (simple string entries ending
 * with a gen-delim character) from a document's @context.
 */
const getPrefixMap = (doc: SoyaDocument): Record<string, string> => {
  const prefixes: Record<string, string> = {};

  for (const [key, value] of Object.entries(doc['@context'] ?? {})) {
    if (!key.startsWith('@') && typeof value === 'string' && /[/#:]$/.test(value))
      prefixes[key] = value;
  }

  return prefixes;
};

/**
 * Expands a compact IRI ("prefix:suffix") using the given prefix map.
 * Returns undefined if the value is not a compact IRI or the prefix is unknown.
 */
const expandCompactIri = (value: string, prefixes: Record<string, string>): string | undefined => {
  const idx = value.indexOf(':');

  if (idx <= 0)
    return undefined;

  const suffix = value.slice(idx + 1);
  // absolute IRIs like https://... are no compact IRIs
  if (suffix.startsWith('//'))
    return undefined;

  const namespace = prefixes[value.slice(0, idx)];
  return namespace ? namespace + suffix : undefined;
};

/**
 * Alignment overlays reference other properties via compact IRIs, e.g.
 * "rdfs:subPropertyOf": ["oyd_organisation:phone"].
 *
 * As "rdfs:subPropertyOf" is used as compact IRI (and not via the term
 * "subPropertyOf" defined in the soya context), JSON-LD does NOT apply
 * any type coercion — the values end up as plain string literals in the
 * RDF graph instead of IRIs. This breaks property-path matching across
 * structures and crashes follow-up SPARQL queries.
 *
 * This function expands those values with the document's @context prefixes
 * and wraps them in { "@id": ... } so they are parsed as proper IRIs.
 */
const normalizeAlignments = (doc: SoyaDocument): SoyaDocument => {
  const prefixes = getPrefixMap(doc);
  const clone: SoyaDocument = JSON.parse(JSON.stringify(doc));

  for (const item of clone['@graph'] ?? []) {
    for (const key of SUB_PROPERTY_KEYS) {
      const value = item[key];

      if (!value)
        continue;

      const values = Array.isArray(value) ? value : [value];
      item[key] = values.map((v: any) => {
        if (typeof v !== 'string')
          return v;

        return { '@id': expandCompactIri(v, prefixes) ?? v };
      });
    }
  }

  return clone;
};

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

  // expand alignment values (compact IRIs) into proper IRIs
  // before building the RDF dataset
  const dataSet = await parseJsonLd(normalizeAlignments(from));
  dataSet.addAll(await parseJsonLd(normalizeAlignments(to)));
  const builder = new SparqlQueryBuilder(dataSet);

  const mappings = await builder.query(`
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?pFrom ?pTo WHERE {
  ?pFrom rdfs:subPropertyOf* ?superProp .
  ?pTo   rdfs:subPropertyOf* ?superProp .

  # only match actual properties of the structures
  # (both always carry an rdfs:domain), not the shared
  # super-property itself
  ?pFrom rdfs:domain ?dFrom .
  ?pTo   rdfs:domain ?dTo .

  FILTER(?pFrom != ?pTo)
}`);

  const res: any = {};
  // construct return object
  for (const mapping of mappings) {
    const from = mapping.get('?pFrom');
    const to = mapping.get('?pTo');

    // guard against bindings that are no valid IRIs (e.g. literals),
    // as they can not be injected into follow-up SPARQL queries
    if (!from || !to || !isIRI(from) || !isIRI(to))
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