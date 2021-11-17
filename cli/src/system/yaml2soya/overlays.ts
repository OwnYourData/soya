import { SoyaDocument } from ".";
import { DateRange, NumberRange, parseRange } from "../../utils/range";

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

export const handleOverlay = (doc: SoyaDocument, overlay: any, baseUrl: string) => {
  switch (overlay.type) {
    case 'OverlayAnnotation': handleAnnotation(doc, overlay); break;
    case 'OverlayAlignment': handleAlignment(doc, overlay); break;
    case 'OverlayClassification': handleClassification(doc, overlay); break;
    case 'OverlayEncoding': handleEncoding(doc, overlay); break;
    case 'OverlayFormat': handleFormat(doc, overlay); break;
    case 'OverlayValidation': handleValidation(doc, overlay); break;
    case 'OverlayTransformation': handleTransformation(doc, overlay); break;
    // for unsupported overlays we just return here
    // all following code will not be executed
    default: return;
  }

  // add an informational element
  doc.graph.push({
    '@id': overlay.type,
    '@type': overlay.type,
    'onBase': `${baseUrl}/${overlay.base}/`,
    name: overlay.name,
  })
};

const handleTransformation = (doc: SoyaDocument, overlay: any) => {
  const { graph } = doc;

  const item = {
    '@id': `${overlay.base}Transformation`,
    'engine': overlay.engine,
    'value': overlay.value,
  };
  graph.push(item);
}

const handleValidation = (doc: SoyaDocument, overlay: any) => {
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
      }
    }

    shacl['sh:property'].push({
      'sh:path': `${attrName}`,
      ...constraints,
    });
  }
}

const handleFormat = (doc: SoyaDocument, overlay: any) => {
  const { graph } = doc;

  for (const attrName in overlay.attributes) {
    let encoding = overlay.attributes[attrName];

    graph.push({
      '@id': `${attrName}`,
      'format': encoding,
    });
  }
}

const handleEncoding = (doc: SoyaDocument, overlay: any) => {
  const { graph } = doc;

  for (const attrName in overlay.attributes) {
    let encoding = overlay.attributes[attrName];

    graph.push({
      '@id': `${attrName}`,
      'encoding': encoding,
    });
  }
}

const handleClassification = (doc: SoyaDocument, overlay: any) => {
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
}

const handleAnnotation = (doc: SoyaDocument, overlay: any) => {
  const { graph } = doc;

  const handleAttribute = (annotation: any, attrName: string, base?: string) => {
    const attributeObject: any = {
      '@id': base ? `${attrName}` : attrName,
    };
    graph.push(attributeObject);

    for (const aTypeKey in annotation) {
      attributeObject[aTypeKey] = arrayifyIfLeaf(annotation[aTypeKey]);
    }
  }

  handleAttribute(overlay.class, overlay.base);

  for (const attrName in overlay.attributes) {
    let annotation = overlay.attributes[attrName];
    handleAttribute(annotation, attrName, overlay.base);
  }
}

const handleAlignment = (doc: SoyaDocument, overlay: any) => {
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
}