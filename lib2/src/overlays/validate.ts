import { OverlayPlugin, OverlayResult } from "./interface";
import SHACLValidator from "rdf-validate-shacl";
import { factory, parseJsonLd } from "../utils/rdf";
import { logger } from "../services/logger";
import { SoyaDocument } from "../interfaces";
import { SparqlQueryBuilder } from "../utils/sparql";

const RDF_FIRST = factory.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#first");

// Für Set-Attribute ohne verschachtelte Attribute erzeugt SOyA Sequenzpfade
// (Attribut / rdf:rest* / rdf:first). SHACL meldet dafür den Blank Node des
// Pfads; im Ergebnis wird stattdessen das Attribut (erstes Pfadglied) gemeldet.
const resolveResultPath = (layerSet: any, path: any): any => {
  if (!path || path.termType !== "BlankNode")
    return path;

  for (const quad of layerSet.match(path, RDF_FIRST)) {
    if (quad.object.termType === "NamedNode")
      return quad.object;
  }

  return path;
};

const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const SH = "http://www.w3.org/ns/shacl#";
const RDF_TYPE = factory.namedNode(`${RDF}type`);
const RDF_REST = factory.namedNode(`${RDF}rest`);
const RDF_NIL = `${RDF}nil`;
const SH_PROPERTY = factory.namedNode(`${SH}property`);
const SH_PATH = factory.namedNode(`${SH}path`);
const SH_MESSAGE = factory.namedNode(`${SH}message`);
const SH_TARGET_CLASS = factory.namedNode(`${SH}targetClass`);
const SOYA_UNIQUE_KEY = factory.namedNode("https://w3id.org/soya/ns#uniqueKey");

const objectsOf = (dataset: any, subject: any, predicate: any): any[] =>
  [...dataset.match(subject, predicate)].map((q: any) => q.object);

// Elemente eines Attributwerts: bei einer RDF-Liste (Set-Attribut als @list)
// deren Glieder, sonst der Wert selbst.
const listMembers = (dataSet: any, value: any): any[] => {
  const members: any[] = [];
  const isList = value.termType !== "Literal" &&
    (value.value === RDF_NIL || dataSet.match(value, RDF_FIRST).size > 0);

  if (!isList)
    return [value];

  let node = value;
  const seen = new Set<string>();
  while (node && node.value !== RDF_NIL && !seen.has(node.value)) {
    seen.add(node.value);
    members.push(...objectsOf(dataSet, node, RDF_FIRST));
    node = objectsOf(dataSet, node, RDF_REST)[0];
  }

  return members;
};

// Eindeutigkeit (YAML "unique: <Attribut>"): Zwei Elemente eines Attributs
// dürfen nicht denselben Wert für das Schlüssel-Attribut haben. SHACL Core
// kann das nicht ausdrücken; die Prüfung läuft daher hier, für Attribute der
// obersten Ebene einer OverlayValidation (Shape mit sh:targetClass).
const checkUniqueKeys = (layerSet: any, dataSet: any): any[] => {
  const results: any[] = [];

  for (const keyQuad of [...layerSet.match(null, SOYA_UNIQUE_KEY)]) {
    const shape = keyQuad.subject;
    const keyAttr = keyQuad.object;
    const path = objectsOf(layerSet, shape, SH_PATH).find((t: any) => t.termType === "NamedNode");
    if (!path)
      continue;

    const messages = objectsOf(layerSet, shape, SH_MESSAGE);
    const targetClasses = [...layerSet.match(null, SH_PROPERTY, shape)]
      .flatMap((q: any) => objectsOf(layerSet, q.subject, SH_TARGET_CLASS));

    for (const targetClass of targetClasses) {
      for (const typeQuad of [...dataSet.match(null, RDF_TYPE, targetClass)]) {
        const focus = typeQuad.subject;
        const counts = new Map<string, number>();

        for (const value of objectsOf(dataSet, focus, path)) {
          for (const member of listMembers(dataSet, value)) {
            for (const key of objectsOf(dataSet, member, keyAttr)) {
              const id = `${key.termType}|${key.value}`;
              counts.set(id, (counts.get(id) || 0) + 1);
            }
          }
        }

        for (const [id, count] of counts) {
          if (count < 2)
            continue;

          const keyValue = id.substring(id.indexOf("|") + 1);
          const literals = messages.length > 0
            ? messages
            : [factory.literal(`Value '${keyValue}' of '${keyAttr.value}' is not unique`)];

          // gleiche Form wie die Ergebnisse aus SHACL
          results.push({
            id: focus,
            message: literals.map((m: any) => ({
              value: m.value,
              datatype: { termType: "NamedNode", value: m.datatype.value },
              language: m.language,
            })),
            termType: path.termType,
            value: path.value,
            severity: { value: `${SH}Violation` },
          });
        }
      }
    }
  }

  return results;
};

export class SoyaValidate implements OverlayPlugin {

  run = async (soyaDoc: SoyaDocument, data: any): Promise<OverlayResult> => {
    const dataSet = await parseJsonLd(data);

    if (dataSet.length === 0)
      throw new Error('Input data is not valid JSON-LD!');

    const layerSet = await parseJsonLd(soyaDoc);
    const validator = new SHACLValidator(layerSet);
    const res = await validator.validate(dataSet);

    const layerBuilder = new SparqlQueryBuilder(layerSet);
    // const requiredClasses = await layerBuilder.query(`
    // PREFIX sh: <http://www.w3.org/ns/shacl#>
    // SELECT ?c WHERE {
    //   ?s a sh:NodeShape .
    //   ?s sh:targetClass ?c .
    // }`);
    const requiredClasses = await layerBuilder.query(`
    PREFIX sh: <http://www.w3.org/ns/shacl#>
    SELECT ?c WHERE {
      ?s sh:targetClass ?c .
    }`);

    const dataBuilder = new SparqlQueryBuilder(dataSet);
    const classChecks: any[] = [];

    // this are some additional class checks
    // SHACL is not really made to give invalid results if it has an empty set it's applied on
    // therefore we additionally check for the availabiligy of all classes that are defined as SHACL shapes
    for (const required of requiredClasses) {
      const requiredClassUri = required.get('?c');
      const matches = await dataBuilder.query(`
      SELECT ?s WHERE {
        ?s a <${requiredClassUri}> .
      }`);

      const exists = matches.length !== 0;

      // check, if all required node shapes are available
      if (!exists)
        classChecks.push({
          message: 'Missing class',
          name: requiredClassUri,
        });
    }

    logger.debug('Data to validate:', dataSet);
    logger.debug('SHACL:', layerSet);

    const uniqueResults = checkUniqueKeys(layerSet, dataSet);

    return {
      data: {
        isValid: res.conforms && uniqueResults.length === 0 && classChecks.length === 0,
        results: [
          ...res.results.map(x => ({
            id: x.focusNode,
            message: x.message,
            ...resolveResultPath(layerSet, x.path),
            severity: x.severity,
          })),
          ...uniqueResults,
        ],
        classChecks,
      }
    };
  }
}