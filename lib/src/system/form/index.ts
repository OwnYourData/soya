import rdf from "rdf-ext";
const namedNode = rdf.namedNode;

import { SoyaDocument } from "../../interfaces";
import { parseJsonLd } from "../../utils/rdf";
import { JsonSchema, Layout, SoyaForm } from "./interfaces";

export * from './interfaces';

export const getSoyaForm = async (soyaStructure: SoyaDocument): Promise<SoyaForm> => {
  // search for base
  // at first we only support one base
  const dataSet = await parseJsonLd(soyaStructure);
  // @ts-expect-error
  const mainClass = dataSet.match(
    undefined,
    namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
    namedNode('https://www.w3.org/2002/07/owl#Class'),
  ).toArray()[0];


  // all properties
  const allProps = dataSet.match(
    undefined,
    namedNode(`http://www.w3.org/1999/02/22-rdf-syntax-ns#type`),
    namedNode('https://www.w3.org/2002/07/owl#DatatypeProperty'),
  ).toArray();

  const schema: JsonSchema = {
    type: 'object',
    properties: {},
  };
  const ui: Layout = {
    type: 'VerticalLayout',
    elements: [],
  };
  const retVal: SoyaForm = {
    schema,
    ui,
  };

  // this if is just here to please typescript
  // obviously it does not get that schema.properties is always set
  // weirdly it thinks it could undefined...
  if (!schema.properties)
    return retVal;

  for (const prop of allProps) {
    const dt = dataSet.match(
      prop.subject,
      namedNode(`https://www.w3.org/2000/01/rdf-schema#range`),
      undefined,
    ).toArray()[0];

    if (!dt)
      continue;

    // @ts-ignore
    let URL = globalThis.URL;
    if (!URL) // node envs
      URL = import('url');

    const dtUrl = new URL(dt.object.value);
    if (dtUrl.pathname !== '/2001/XMLSchema')
      continue;

    let type: string | undefined;
    let format: string | undefined;

    switch (dtUrl.hash.substring(1).toLowerCase()) {
      case 'date':
        type = 'string';
        format = 'date';
        break;
      default:
        type = 'string';
    }

    const dtSubParts = dt.subject.value.split('/');
    const propName = dtSubParts[dtSubParts.length - 1];

    if (!propName)
      continue;

    schema.properties[propName] = {
      type,
      format,
    }
  }

  ui.elements = Object.keys(schema.properties).map(propName => ({
    type: 'Control',
    scope: `#/properties/${propName}`,
  }));

  return retVal;
}