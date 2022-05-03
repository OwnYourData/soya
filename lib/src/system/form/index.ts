import { UISchemaElement } from "@jsonforms/core";
import { FormRenderError } from "../../errors";
import { SoyaDocument } from "../../interfaces";
import { isIRI, parseJsonLd } from "../../utils/rdf";
import { SparqlQueryBuilder } from "../../utils/sparql";
import { JsonSchema, Layout, SoyaFormOptions, SoyaFormResponse, StaticForm } from "./interfaces";

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

class FormBuilder {
  private _ui: Layout;

  constructor(
    private _builder: SparqlQueryBuilder,
    private _mainClassUri: string,
    public readonly options: SoyaFormOptions,
  ) {
    this._ui = {
      type: 'VerticalLayout',
      elements: [],
    };
  }

  private _getTranslatedProperty = async (propUri: string, predicate: string = 'rdfs:label'): Promise<string | undefined> => {
    if (!isIRI(propUri))
      return;

    const language = this.options.language ?? 'en';
    const query = await this._builder.query(`
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      SELECT * WHERE {
        <${propUri}> ${predicate} ?var .
        FILTER(lang(?var) = "${language}")
      }`);

    if (query[0])
      return query[0].get('?var')
        // split off language tag
        ?.split('@')[0]
        // remove leading and trailing quotes
        ?.slice(1, -1) || undefined;
    else
      return;
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

      // we don't check URIs from w3.org for linked classes
      // as they can be used as "primitive" data types
      // e.g. owl:Class with an enumeration of possible classes
      if (!range.startsWith('http://www.w3.org')) {
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

          // proceed with next property
          continue;
        }
      }

      // it's something else (e.g. XML schema)
      // try to get hash from XML schema string
      propSchema.type = 'string';

      switch (range.split('#')[1]) {
        case 'date':
          propSchema.format = 'date';
          break;
        case 'time':
          propSchema.format = 'time';
          break;
        case 'dateTime':
          propSchema.format = 'date-time';
          break;
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

      // TODO: unfortunately this query is SUPER SLOW for big graphs
      // ... I mean, really really slow
      // ... unlike this one https://www.youtube.com/watch?v=XeD_WB17NBc
      // most probably this is due to the * operator

      // const multiItems = await this._builder.query(`
      //   PREFIX sh: <http://www.w3.org/ns/shacl#>
      //   PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      //   SELECT * WHERE {
      //       ?shprop sh:path ?propUri .
      //       ?shprop sh:in ?in .
      //       ?in rdf:rest*/rdf:first ?entry .
      //   }`);

      // BEGIN of ugly rewrite of above SPARQL query
      const firstItem = await this._builder.query(`
          PREFIX sh: <http://www.w3.org/ns/shacl#>
          PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
          SELECT * WHERE {
            ?shprop sh:path <${propUri}> .
            ?shprop sh:in ?in .
            ?in rdf:first ?entry .
          }`);

      // this enum format is defined by jsonforms
      // however they don't seem to export an interface
      const enumList: {
        const: string,
        title: string,
      }[] = [];
      const addEnumItem = async (valueOrIRI: string) => {
        const _value = getLastUriPart(valueOrIRI) ?? valueOrIRI;

        enumList.push({
          const: _value,
          title: await this._getTranslatedProperty(valueOrIRI) ?? _value,
        });
      }

      if (firstItem.length !== 0) {
        let item = firstItem[0];
        const firstValue = item?.get('?entry');

        if (item && firstValue) {
          await addEnumItem(firstValue);

          const subItems = await this._builder.query(`
              PREFIX sh: <http://www.w3.org/ns/shacl#>
              PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
              SELECT * WHERE {   
                ?in rdf:rest ?rest .
                ?rest rdf:first ?first .
              }`);

          let rest: string | null | undefined = item.get('?in');

          // this resolves the chained list of rest and first
          while (rest) {
            const tempItem = subItems.find(x => x.get('?in') === rest);
            const tempRest = tempItem?.get('?rest');
            const value = tempItem?.get('?first');

            if (value)
              await addEnumItem(value);

            rest = tempRest;
          }
        }
      }
      // END of ugly rewrite of above SPARQL query

      if (enumList.length !== 0) {
        if (minCount >= 1) {
          propSchema.type = 'array';
          propSchema.uniqueItems = true;
        }
        propSchema.oneOf = enumList;
      }

      const element: UISchemaElement = {
        type: 'Control',
        // @ts-expect-error FIXME: scope is not recognized, probably an error in official types
        scope: `#/properties/${layoutSubPath}${propName}`,
      };
      layout.elements.push(element);

      // @ts-expect-error FIXME: label is not recognized, probably an error in official types
      element.label = await this._getTranslatedProperty(propUri);

      // @ts-expect-error FIXME: label is not recognized, probably an error in official types
      element.description = await this._getTranslatedProperty(
        propUri,
        'rdfs:comment',
      );
    }

    return schema;
  }

  build = async (): Promise<SoyaFormResponse> => {
    const name = getLastUriPart(this._mainClassUri);
    if (!name)
      throw new FormRenderError('Main class name not found.');

    const retVal: SoyaFormResponse = {
      schema: await this._handleClass(
        name,
        this._mainClassUri,
      ),
      ui: this._ui,
      options: [],
    };

    // FIXME: This query does unfortunately not work
    // although it does work within graphDB
    // Therefore we have to go the manual, programmatic way ...

    // get all available languages
    // const langQuery = await this._builder.query(`
    // PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    // SELECT DISTINCT (lang(?label) as ?lang) WHERE {
    //     ?shprop rdfs:label ?label .
    // }`);
    const langQuery = await this._builder.query(`
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT ?label WHERE {
        ?shprop rdfs:label ?label .
    }`);
    if (langQuery.length !== 0)
      retVal.options = (langQuery
        .map(x => x.get('?label'))
        .map(x => {
          const s = x?.split('@');
          if (s)
            return s[s.length - 1];

          return;
        })
        .filter((val, index, self) => !!val && self.indexOf(val) === index) as string[])
        .map(lang => ({
          language: lang,
        }));

    return retVal;
  }
}

export const getSoyaForm = async (
  soyaStructure: SoyaDocument,
  options: SoyaFormOptions = {},
): Promise<SoyaFormResponse> => {
  // check if there is a static form available
  // ui and schema are currently our "fingerprint" for finding form schemas

  const staticForms: StaticForm[] = soyaStructure["@graph"].filter(x => !!x.ui || !!x.schema);

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

  const defaultForm = await new FormBuilder(
    builder,
    mainClassUri,
    options,
  ).build();

  // check if we can find the requested form in our static forms
  const requestedForm = staticForms.find(f =>
    f.language == options.language &&
    f.tag == options.tag
    // fallback is of course our computed form
  ) ?? defaultForm;

  const formOptions: SoyaFormOptions[] = [
    ...defaultForm.options,
    ...staticForms.map<SoyaFormOptions>(f => ({
      language: f.language,
      tag: f.tag,
    }))
  ];

  return {
    // substitute schema with schema from computed form, if not available
    schema: requestedForm.schema ?? defaultForm.schema,
    // substitute ui with ui from computed form, if not available
    ui: requestedForm.ui ?? defaultForm.ui,
    // distinct the list of options
    // so that we do not show an option combination twice
    options: formOptions.filter((fo, idx, arr) => {
      return arr.findIndex((val) =>
        val.language === fo.language &&
        val.tag === fo.tag
      ) === idx;
    })
  };
}