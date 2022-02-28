import { FormRenderError } from "../../errors";
import { SoyaDocument } from "../../interfaces";
import { parseJsonLd } from "../../utils/rdf";
import { SparqlQueryBuilder } from "../../utils/sparql";
import { JsonSchema, Layout, SoyaForm } from "./interfaces";

export * from './interfaces';

const getLastUriPart = (uri: string): string | undefined => {
  const split = uri.split('/');
  return split[split.length - 1];
}

const handleClass = async (
  name: string,
  builder: SparqlQueryBuilder,
  classUri: string,
  rootLayout: Layout,
  layoutSubPath: string = '',
): Promise<JsonSchema> => {
  const schema: JsonSchema = {
    type: 'object',
    properties: {},
  };

  // this if is just here to please typescript
  // obviously it does not get that schema.properties is always set
  // weirdly it thinks it could undefined...
  if (!schema.properties)
    return schema;

  const layout: Layout = {
    type: 'Group',
    // @ts-expect-error FIXME: label is not recognized, probably an error in official types
    // capitalize first letter
    label: name.charAt(0).toUpperCase() + name.slice(1),
    elements: [],
  }
  rootLayout.elements.push(layout);

  const allProps = await builder.query(`
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT ?prop ?range WHERE {
      ?prop rdfs:domain <${classUri}> .
      ?prop a owl:DatatypeProperty .
      ?prop rdfs:range ?range .
    }`);

  for (const prop of allProps) {
    const propUri = prop.get('?prop');
    const range = prop.get('?range');

    if (!range || !propUri)
      continue;

    const propName = getLastUriPart(propUri);

    if (!propName)
      continue;

    // check if URI exists as a graph object
    const refRange = await builder.query(`
      SELECT * WHERE {
        <${range}> ?p ?o .
      }`);

    if (refRange.length !== 0) {
      // it's a graph object
      // start recursion
      schema.properties[propName] = await handleClass(
        propName,
        builder,
        range,
        rootLayout,
        `${layoutSubPath}${propName}/properties/`
      );
    } else {
      // it's something else (e.g. XML schema)
      let type: string | undefined;
      let format: string | undefined;

      // try to get hash from XML schema string
      switch (range.split('#')[1]) {
        case 'date':
          type = 'string';
          format = 'date';
          break;
        default:
          type = 'string';
      }

      // see if we can get some information out of a SHACL shape
      const shaclConstraintList = await builder.query(`
        PREFIX sh: <http://www.w3.org/ns/shacl#>
        SELECT ?class ?prop ?min ?max WHERE {
          ?class a sh:NodeShape .
          ?class sh:property ?prop .
          ?class sh:targetClass <${classUri}> .
          ?prop sh:minCount ?min .
          ?prop sh:maxCount ?max .
        }`);

      let minLength: string | undefined;
      let maxLength: string | undefined;

      if (shaclConstraintList[0]) {
        const shaclConstraint = shaclConstraintList[0];

        minLength = shaclConstraint.get('?min') || undefined;
        maxLength = shaclConstraint.get('?max') || undefined;
      }

      schema.properties[propName] = {
        type,
        format,

        minLength: minLength ? parseInt(minLength) : undefined,
        maxLength: maxLength ? parseInt(maxLength) : undefined,
      }
      layout.elements.push({
        type: 'Control',
        // @ts-expect-error FIXME: scope is not recognized, probably an error in official types
        scope: `#/properties/${layoutSubPath}${propName}`,
      });
    }
  }

  return schema;
}

export const getSoyaForm = async (soyaStructure: SoyaDocument): Promise<SoyaForm> => {
  const dataSet = await parseJsonLd(soyaStructure);
  const builder = new SparqlQueryBuilder(dataSet);

  const classes = await builder.query(`
  PREFIX owl: <http://www.w3.org/2002/07/owl#>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  SELECT ?s WHERE {
    ?s a owl:Class .
    # exclude all classes that are nested in a parent class
    FILTER NOT EXISTS {
      ?rel rdfs:range ?s .
    }
  }`);

  if (!classes[0])
    throw new FormRenderError('Main class not found.');

  // we only support one base for now
  const mainClass = classes[0];
  const mainClassUri = mainClass.get('?s');

  if (!mainClassUri)
    throw new FormRenderError('Main class URI not found.');

  const name = getLastUriPart(mainClassUri);
  if (!name)
    throw new FormRenderError('Main class name not found.');

  const ui: Layout = {
    type: 'VerticalLayout',
    elements: [],
  };
  const retVal: SoyaForm = {
    schema: await handleClass(
      name,
      builder,
      mainClassUri,
      ui
    ),
    ui,
  };

  return retVal;
}