import { Overlay, CommandPlugin, OverlayResult } from "./interface";
import SHACLValidator from "rdf-validate-shacl";
import { parseJsonLd } from "../utils/rdf";
import { logger } from "../services/logger";
import rdf from "rdf-ext";

const namedNode = rdf.namedNode;

export class SoyaValidate implements CommandPlugin {

  run = async (overlay: Overlay, data: any): Promise<OverlayResult> => {
    const dataSet = await parseJsonLd(data);

    if (dataSet.length === 0)
      throw new Error('Input data is not valid JSON-LD!');

    const layerSet = await parseJsonLd(overlay);
    const validator = new SHACLValidator(layerSet);
    const res = await validator.validate(dataSet);

    // this are some additional class checks
    // SHACL is not really made to give invalid results if it has an empty set it's applied on
    // therefore we additionally check for the availabiligy of all classes that are defined as SHACL shapes
    const requiredClasses = layerSet.match(
      undefined,
      namedNode('http://www.w3.org/ns/shacl#targetClass'),
      undefined,
    );

    const availableClasses = dataSet.match(
      undefined,
      namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      undefined,
    )

    const classChecks: any[] = [];
    // check, if all required node shapes are available
    for (const required of requiredClasses) {
      if (availableClasses.match(
        undefined,
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        required.object,
      ).length === 0)
        classChecks.push({
          message: 'Missing class',
          name: required.object.value,
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