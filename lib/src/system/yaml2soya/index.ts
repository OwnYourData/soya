import jsyaml from 'js-yaml';
import { SoyaDocument, IntSoyaDocument } from '../../interfaces';
import { logger } from '../../services/logger';
import { handleOverlay } from './overlays';
import { tryUseXsdDataType } from '../../utils/xsd';


const genericsRegex = /^(\w+)<(.+)>$/;

const handleBase = (doc: IntSoyaDocument, base: any) => {
  const { graph } = doc;
  const baseName = base.name;

  graph.push({
    '@id': baseName,
    '@type': "owl:Class",
    'subClassOf': base.subClassOf || 'soya:Base',
  });

  for (const attrName in base.attributes) {
    let specifiedDataType = base.attributes[attrName];
    let containerType: string | undefined = undefined

    const genericMatches = genericsRegex.exec(specifiedDataType);
    // if we have two matches we've found a generic
    if (genericMatches && genericMatches.length >= 3) {
      containerType = genericMatches[1];
      specifiedDataType = genericMatches[2];
    }

    let { dataType, isXsd } = tryUseXsdDataType(specifiedDataType);

    const graphItem: any = {
      '@id': attrName,
      // use DataTypeProperty if our datatype could be identified as xsd datatype
      // use ObjectProperty otherwise -> more general
      '@type': `owl:${isXsd ? 'Datatype' : 'Object'}Property`,
      'domain': base.name,
      'range': containerType ?
        // currently we don't care about the specific container type
        // and treat everything like a list
        // here we also see that the contained data type is basically
        // lost, just rdf:List remains
        // this is due to the limitation of rdf not knowing about the 
        // datatype that's used inside the list. rdf just does not care
        // This COULD be properly solved by adding some SHACL statements
        // to restrict what data types are allowed to be used inside the list
        'http://www.w3.org/1999/02/22-rdf-syntax-ns#List'
        : dataType,
    };

    if (containerType) {
      // lowercase, because most container types in json-ld are lowercase
      graphItem['soya:containerType'] = containerType.toLowerCase();
      graphItem['soya:containerElementTypes'] = dataType
        // within list<...> or set<...> there could be mutliple types specified, like
        // list<number | string>
        // therefore we split all items here
        .split('|')
        .map(
          // here we use the fully qualified name, as "containerElementTypes" is a custom property
          x => doc['@context']['@base'] + x
            // and then trim any leading/trailing whitespace
            .trim()
        );
    }

    graph.push(graphItem);
  }

  if (Array.isArray(base.subClasses)) {
    for (const subBase of base.subClasses) {
      // set subClassOf implicitly
      subBase.subClassOf = baseName;
      handleBase(doc, subBase);
    }
  }
}

export const yaml2soya = async (yamlContent: string, contextUrl: string, baseUrl: string, xsdUrl: string): Promise<SoyaDocument | undefined> => {
  const yaml: any = jsyaml.load(yamlContent);

  if (!yaml || typeof yaml !== 'object') {
    logger.error('Can not parse YAML!');
    return;
  }

  const { meta, content } = yaml;

  const doc: IntSoyaDocument = {
    "@context": {
      "@version": 1.1,
      "@import": contextUrl,
      "@base": `${baseUrl}/${meta.name}/`,
      "xsd": xsdUrl,
    },
    graph: [],
  }

  if (meta.namespace && typeof meta.namespace === 'object') {
    for (const nsKey in meta.namespace) {
      doc['@context'][nsKey] = meta.namespace[nsKey];
    }
  }

  if (Array.isArray(content.bases))
    for (const base of content.bases) {
      handleBase(doc, base);
    }
  if (Array.isArray(content.overlays))
    for (const overlay of content.overlays) {
      handleOverlay(doc, overlay);
    }

  // this is where the rename of "graph" to "@graph" happens
  const printable: SoyaDocument = {
    '@context': doc['@context'],
    '@graph': doc.graph,
  };

  return printable;
}