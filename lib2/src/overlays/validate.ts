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

    return {
      data: {
        isValid: res.conforms && classChecks.length === 0,
        results: res.results.map(x => ({
          id: x.focusNode,
          message: x.message,
          ...resolveResultPath(layerSet, x.path),
          severity: x.severity,
        })),
        classChecks,
      }
    };
  }
}