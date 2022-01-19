import DatasetExt from "rdf-ext/lib/Dataset";
import { URL } from "url";
import { crypto } from "vaultifier/dist/main";
import { logger } from "../services/logger";
import { serializeJsonLd } from "./rdf";

export interface JsonLdObject {
  quads: DatasetExt,
  json: any,
}

export interface CalculationResult {
  dri: string,
  baseUri: string,
}

const tryExtractDriFromUris = (value: any): any => {
  if (typeof value === 'string') {
    try {
      // we only try to extract DRIs from URIs
      new URL(value);
    } catch {
      // if it's not an URI, we can already stop here
      return value;
    }

    const match = /\/(zQm[1-9A-HJ-NP-Za-km-z]{44})/.exec(value);

    if (match) {
      const dri = match[1];
      return dri;
    }
  }

  // obviously there is no DRI
  return value;
}

const checkForObjectOrArray = (val: any) => {
  if (val && typeof val === 'object')
    removeDRIsFromObject(val);
  else if (Array.isArray(val))
    removeDRIsFromArray(val);
}

const removeDRIsFromArray = (arr: any[]): any => {
  for (let i = 0, size = arr.length; i < size; i++) {
    arr[i] = tryExtractDriFromUris(arr[i]);
    checkForObjectOrArray(arr[i]);
  }
}

const removeDRIsFromObject = (obj: any): any => {
  for (const prop in obj) {
    const val = obj[prop] = tryExtractDriFromUris(obj[prop]);
    checkForObjectOrArray(val);
  }
}

export const calculateBaseUri = async (obj: Partial<JsonLdObject>, base?: string): Promise<CalculationResult> => {
  if (obj.quads) {
    const context = { ...obj.json['@context'] };
    const serialized = await serializeJsonLd(obj.quads.toStream(), {
      context: context,
    });

    obj.json = JSON.parse(serialized);
  }


  // TODO: removed temporarily until we know how to identify layers, bases and instances
  // remove @id from '@graph' (only for instances)
  // if (Array.isArray(obj.json['@graph'])) {
  //   const graphItems = obj.json['@graph'];

  //   for (const item of graphItems) {
  //     delete item['@id'];
  //   }
  // }

  // go through all properties and check if it is a DRI
  // if yes, remove the URL so only the DRI remains
  removeDRIsFromObject(obj.json);

  // remove @base property from document as we have to calculate DRI without @base
  delete obj.json['@context']['@base'];

  // calculate DRI and add it to document
  logger.debug(`Generating hashlink from document:`);
  logger.debug(crypto.canonicalize(obj.json));
  const dri = await crypto.generateHashlink(obj.json);

  const fullUri = base ? `${base}/${dri}` : dri;
  const baseUri = obj.json['@context']['@base'] = fullUri;

  return {
    dri,
    baseUri
  };
}
