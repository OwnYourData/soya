import jsyaml from 'js-yaml';
import { PrintableSoyaDocument, SoyaDocument } from '../../interfaces';
import { logger } from '../../services/logger';
import { handleOverlay } from './overlays';

const xsTypes = [
  'string',
  'decimal',
  'integer',
  'float',
  'boolean',
  'date',
  'time',
];

const handleBase = (doc: SoyaDocument, base: any) => {
  const { graph } = doc;

  graph.push({
    '@id': base.name,
    '@type': "owl:Class",
    'subClassOf': 'Base',
  });

  for (const attrName in base.attributes) {
    const specifiedDataType = base.attributes[attrName];
    const specifiedDataTypeLC = specifiedDataType.toLowerCase();

    const dataType = xsTypes.indexOf(specifiedDataTypeLC) !== -1 ?
      `xsd:${specifiedDataTypeLC}` :
      specifiedDataType;

    graph.push({
      '@id': attrName,
      '@type': 'owl:DatatypeProperty',
      'domain': base.name,
      'range': dataType,
    })
  }
}

export const yaml2soya = async (yamlContent: string, contextUrl: string, baseUrl: string): Promise<PrintableSoyaDocument | undefined> => {
  const yaml: any = jsyaml.load(yamlContent);

  if (!yaml || typeof yaml !== 'object') {
    logger.error('Can not parse YAML!');
    return;
  }

  const { meta, content } = yaml;

  const doc: SoyaDocument = {
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

  if (Array.isArray(content.base))
    for (const base of content.base) {
      handleBase(doc, base);
    }
  if (Array.isArray(content.overlays))
    for (const overlay of content.overlays) {
      handleOverlay(doc, overlay);
    }

  // this is where the rename of "graph" to "@graph" happens
  const printable: PrintableSoyaDocument = {
    '@context': doc['@context'],
    '@graph': doc.graph,
  };

  return printable;
}