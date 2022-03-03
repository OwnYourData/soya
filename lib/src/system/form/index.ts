import { UISchemaElement } from "@jsonforms/core";
import { FormRenderError } from "../../errors";
import { SoyaDocument } from "../../interfaces";
import { parseJsonLd } from "../../utils/rdf";
import { SparqlQueryBuilder } from "../../utils/sparql";
import { JsonSchema, Layout, SoyaForm } from "./interfaces";

export * from './interfaces';

const splitLast = (value: string | undefined, split: string): string | undefined => {
  if (!value)
    return value;
  
  const arr = value.split(split);
  return arr[arr.length - 1];
}

const getLastUriPart = (uri: string): string | undefined => {
  return splitLast(splitLast(uri, '/'), '#');
}

interface FormBuilderOptions {
  language?: string;
}

class FormBuilder {
  private _ui: Layout;

  constructor(
    private _builder: SparqlQueryBuilder,
    private _mainClassUri: string,
    public readonly options: FormBuilderOptions = {},
  ) {
    this._ui = {
      type: 'VerticalLayout',
      elements: [],
    };
  }

  private _handleClass = async (
    name: string,
    classUri: string,
    layoutSubPath: string = '',
  ): Promise<JsonSchema> => {
    const schema: JsonSchema = {
      type: 'object',
      properties: {},
      required: [],
    };

    // this if is just here to please typescript
    // obviously it does not get that schema.properties is always set
    // weirdly it thinks it could undefined...
    if (!schema.properties || !schema.required)
      return schema;

    const layout: Layout = {
      type: 'Group',
      // @ts-expect-error FIXME: label is not recognized, probably an error in official types
      // capitalize first letter
      label: name.charAt(0).toUpperCase() + name.slice(1),
      elements: [],
    }
    this._ui.elements.push(layout);

    const query = `
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT * WHERE {
      ?prop rdfs:domain <${classUri}> .
      ?prop a owl:DatatypeProperty .
      ?prop rdfs:range ?range .
    }`
    const allProps = await this._builder.query(query);

    for (const prop of allProps) {
      const propUri = prop.get('?prop');
      const range = prop.get('?range');

      if (!range || !propUri)
        continue;

      const propName = getLastUriPart(propUri);

      if (!propName)
        continue;

      const propSchema: JsonSchema = schema.properties[propName] = {};

      // check if URI exists as a graph object
      const refRange = await this._builder.query(`
        SELECT * WHERE {
          <${range}> ?p ?o .
        }`);

      if (refRange.length !== 0) {
        // it's a graph object
        // start recursion
        schema.properties[propName] = await this._handleClass(
          propName,
          range,
          `${layoutSubPath}${propName}/properties/`
        );
      } else {
        // it's something else (e.g. XML schema)
        // try to get hash from XML schema string
        switch (range.split('#')[1]) {
          case 'date':
            propSchema.type = 'string';
            propSchema.format = 'date';
            break;
          default:
            propSchema.type = 'string';
        }

        // see if we can get some information out of a SHACL shape
        const shaclConstraintList = await this._builder.query(`
          PREFIX sh: <http://www.w3.org/ns/shacl#>
          SELECT * WHERE {
            ?shprop sh:path <${propUri}> .
            OPTIONAL { ?shprop sh:minCount ?minCount . }
            OPTIONAL { ?shprop sh:maxLength ?maxLength . }
            OPTIONAL { ?shprop sh:pattern ?pattern . }
            OPTIONAL { ?shprop sh:in ?in . }
          }`);

        let minCount: number = 0;
        if (shaclConstraintList[0]) {
          const shaclConstraint = shaclConstraintList[0];

          const _minCount = shaclConstraint.get('?minCount');

          if (_minCount && (minCount = parseInt(_minCount)) >= 1)
            schema.required.push(propName);

          const maxLength = shaclConstraint.get('?maxLength');
          if (maxLength)
            propSchema.maxLength = parseInt(maxLength);

          const pattern = shaclConstraint.get('?pattern');
          if (pattern)
            propSchema.pattern = pattern;
        }

        const multiItems = await this._builder.query(`
          PREFIX sh: <http://www.w3.org/ns/shacl#>
          PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
          SELECT * WHERE {
              ?shprop sh:path <${propUri}> .
              ?shprop sh:in ?in .
              ?in rdf:rest*/rdf:first ?entry .
          }`);

        if (multiItems.length !== 0) {
          if (minCount >= 1) {
            propSchema.type = 'array';
            propSchema.uniqueItems = true;
          }
          propSchema.enum = multiItems.map(x => x.get('?entry')).filter(x => !!x) as string[]; // `as` is safe
        }

        const element: UISchemaElement = {
          type: 'Control',
          // @ts-expect-error FIXME: scope is not recognized, probably an error in official types
          scope: `#/properties/${layoutSubPath}${propName}`,
        };
        layout.elements.push(element);

        const labelQuery = await this._builder.query(`
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT * WHERE {
          <${propUri}> rdfs:label ?label .
          FILTER(lang(?label) = "${this.options.language || 'en'}")
        }`);
        if (labelQuery[0])
          // @ts-expect-error FIXME: label is not recognized, probably an error in official types
          element.label = labelQuery[0].get('?label')
            // split off language tag
            ?.split('@')[0]
            // remove leading and trailing quotes
            ?.slice(1, -1) || undefined;
      }
    }

    return schema;
  }

  build = async (): Promise<SoyaForm> => {
    const name = getLastUriPart(this._mainClassUri);
    if (!name)
      throw new FormRenderError('Main class name not found.');

    const retVal: SoyaForm = {
      schema: await this._handleClass(
        name,
        this._mainClassUri,
      ),
      ui: this._ui,
    };

    return retVal;
  }
}

export const getSoyaForm = async (
  soyaStructure: SoyaDocument,
  options?: FormBuilderOptions,
): Promise<SoyaForm> => {
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

  return new FormBuilder(
    builder,
    mainClassUri,
    options,
  ).build();
}