import { IntSoyaDocument } from "../../interfaces";
import { DateRange, NumberRange, parseRange } from "../../utils/range";

interface GraphItem {
  "@id": string;
  [key: string]: any;
}

const arrayifyIfLeaf = (obj: any) => {

  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const key in obj) {
      obj[key] = arrayifyIfLeaf(obj[key]);
    }

    return obj;
  }
  else if (Array.isArray(obj))
    return obj;
  else
    return [obj];
}

export const handleOverlay = (doc: IntSoyaDocument, overlay: any) => {
  let mainItem: GraphItem | undefined;

  switch (overlay.type) {
    case 'OverlayAnnotation': mainItem = handleAnnotation(doc, overlay); break;
    case 'OverlayAlignment': mainItem = handleAlignment(doc, overlay); break;
    case 'OverlayClassification': mainItem = handleClassification(doc, overlay); break;
    case 'OverlayEncoding': mainItem = handleEncoding(doc, overlay); break;
    case 'OverlayFormat': mainItem = handleFormat(doc, overlay); break;
    case 'OverlayValidation': mainItem = handleValidation(doc, overlay); break;
    case 'OverlayTransformation': mainItem = handleTransformation(doc, overlay); break;
    case 'OverlayForm': mainItem = handleForm(doc, overlay); break;
    // for unsupported overlays we just return here
    // all following code will not be executed
    default: return;
  }

  // if the overlay method did not provide a main item
  // we just create one artificially
  if (!mainItem) {
    mainItem = {
      "@id": overlay.type,
    };
    doc.graph.push(mainItem);
  }

  // add meta information
  // already existing items from mainItem take precedence and must not be overwritten!
  const metaizedItem = Object.assign({
    '@type': overlay.type,
    'onBase': overlay.base,
    name: overlay.name,
  }, mainItem);

  // reassign properties
  Object.assign(mainItem, metaizedItem);
};

const handleForm = (doc: IntSoyaDocument, overlay: any): GraphItem => {
  const { graph } = doc;

  const item = {
    '@id': `${overlay.base}Form`,
    'schema': overlay.schema,
    'ui': overlay.ui,
    'tag': overlay.tag,
    'language': overlay.language,
  };

  graph.push(item);

  return item;
}

const handleTransformation = (doc: IntSoyaDocument, overlay: any): GraphItem => {
  const { graph } = doc;

  const item = {
    '@id': `${overlay.base}Transformation`,
    'engine': overlay.engine,
    'value': overlay.value,
  };
  graph.push(item);

  return item;
}

const handleValidation = (doc: IntSoyaDocument, overlay: any): GraphItem => {
  const { graph } = doc;

  const shacl = {
    '@id': `${overlay.base}Shape`,
    '@type': 'sh:NodeShape',
    'sh:targetClass': overlay.base,
    'sh:property': [] as any[],
  };
  graph.push(shacl);

  for (const attrName in overlay.attributes) {
    const attr = overlay.attributes[attrName];
    const constraints: { [key: string]: any } = {};

    for (const constraintKey in attr) {
      const value = attr[constraintKey];

      if (constraintKey === 'pattern') {
        constraints['sh:pattern'] = value;
      }
      else if (constraintKey === 'cardinality') {
        const range = parseRange(value);

        if (range instanceof NumberRange) {
          if (range.min)
            constraints['sh:minCount'] = range.min;
          if (range.max)
            constraints['sh:maxCount'] = range.max;
        }
      } else if (constraintKey === 'length') {
        const range = parseRange(value);

        if (range instanceof NumberRange) {
          if (range.min)
            constraints['sh:minLength'] = range.min;
          if (range.max)
            constraints['sh:maxLength'] = range.max;
        }
      } else if (constraintKey === 'valueRange') {
        const range = parseRange(value);

        if (range instanceof NumberRange) {
          if (range.min)
            constraints['sh:minRange'] = range.min;
          if (range.max)
            constraints['sh:maxRange'] = range.max;
        } else if (range instanceof DateRange) {
          if (range.min)
            constraints['sh:minRange'] = {
              '@type': 'xsd:date',
              '@value': range.min,
            };
          if (range.max)
            constraints['sh:maxRange'] = {
              '@type': 'xsd:date',
              '@value': range.max,
            };
        }
      } else if (constraintKey === 'valueOption') {
        if (Array.isArray(value))
          constraints['sh:in'] = {
            '@list': value.map(x => {
              if (x && x.id) {
                // rename property (if it exists) from id to @id
                x['@id'] = x.id;
                delete x.id;
              }

              return x;
            }),
          }
      }
    }

    shacl['sh:property'].push({
      'sh:path': `${attrName}`,
      ...constraints,
    });
  }

  return shacl;
}

const handleFormat = (doc: IntSoyaDocument, overlay: any): undefined => {
  const { graph } = doc;

  for (const attrName in overlay.attributes) {
    let encoding = overlay.attributes[attrName];

    graph.push({
      '@id': `${attrName}`,
      'format': encoding,
    });
  }

  return undefined;
}

const handleEncoding = (doc: IntSoyaDocument, overlay: any): undefined => {
  const { graph } = doc;

  for (const attrName in overlay.attributes) {
    let encoding = overlay.attributes[attrName];

    graph.push({
      '@id': `${attrName}`,
      'encoding': encoding,
    });
  }

  return undefined;
}

const handleClassification = (doc: IntSoyaDocument, overlay: any): undefined => {
  const { graph } = doc;

  for (const attrName in overlay.attributes) {
    let classifications = overlay.attributes[attrName];

    if (!Array.isArray(classifications))
      classifications = [classifications];

    graph.push({
      '@id': `${attrName}`,
      'classification': classifications,
    });
  }

  return undefined;
}

const handleAnnotation = (doc: IntSoyaDocument, overlay: any): undefined => {
  const { graph } = doc;

  const handleAttribute = (annotation: any, attrName: string) => {
    const attributeObject: any = {
      '@id': `${attrName}`,
    };
    graph.push(attributeObject);

    for (const aTypeKey in annotation) {
      attributeObject[aTypeKey] = arrayifyIfLeaf(annotation[aTypeKey]);
    }
  }

  handleAttribute(overlay.class, overlay.base);

  for (const attrName in overlay.attributes) {
    let annotation = overlay.attributes[attrName];
    handleAttribute(annotation, attrName);
  }

  return undefined;
}

const handleAlignment = (doc: IntSoyaDocument, overlay: any): undefined => {
  const { graph } = doc;

  for (const attrName in overlay.attributes) {
    let relations = overlay.attributes[attrName];

    if (!Array.isArray(relations))
      relations = [relations];

    graph.push({
      '@id': `${attrName}`,
      'rdfs:subPropertyOf': relations,
    });
  }

  return undefined;
}