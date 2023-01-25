import { OverlayPlugin, OverlayResult } from "./interface";
import SHACLValidator from "rdf-validate-shacl";
import { parseJsonLd } from "../utils/rdf";
import { logger } from "../services/logger";
import { SoyaDocument } from "../interfaces";
import { SparqlQueryBuilder } from "../utils/sparql";

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
    PREFIX soya: <https://ns.ownyourdata.eu/soya/v1#>
    SELECT ?c WHERE {
      ?s a soya:OverlayValidation .
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
          ...x.path,
          severity: x.severity,
        })),
        classChecks,
      }
    };
  }
}