import jsyaml from 'js-yaml';
import { SoyaDocument, IntSoyaDocument } from '../../interfaces';
import { logger } from '../../services/logger';
import { handleOverlay } from './overlays';

// according to https://www.w3.org/TR/xmlschema-2/#built-in-primitive-datatypes
const xsTypes = [
  'string',
  'boolean',
  'decimal',
  'float',
  'double',
  'duration',
  'dateTime',
  'time',
  'date',
  'gYearMonth',
  'gYear',
  'gMonthDay',
  'gDay',
  'gMonth',
  'hexBinary',
  'base64Binary',
  'anyURI',
  'QName',
  'NOTATION',
]

const handleBase = (doc: IntSoyaDocument, base: any) => {
  const { graph } = doc;
  const baseName = base.name;

  graph.push({
    '@id': baseName,
    '@type': "owl:Class",
    'subClassOf': base.subClassOf || 'soya:Base',
  });

  for (const attrName in base.attributes) {
    const specifiedDataType = base.attributes[attrName];
    // for matching, also lowercase all xsTypes
    const xsdIndex = xsTypes.map(x => x.toLowerCase()).indexOf(specifiedDataType.toLowerCase());

    const dataType = xsdIndex !== -1 ?
      `xsd:${xsTypes[xsdIndex]}` :
      specifiedDataType;

    graph.push({
      '@id': attrName,
      '@type': 'owl:DatatypeProperty',
      'domain': base.name,
      'range': dataType,
    })
  }

  if (Array.isArray(base.subClasses)) {
    for (const subBase of base.subClasses) {
      // set subClassOf implicitly
      subBase.subClassOf = baseName;
      handleBase(doc, subBase);
    }
  }
}

export const yaml2soya = async (yamlContent: string, contextUrl: string, baseUrl: string): Promise<SoyaDocument | undefined> => {
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