import { IntSoyaDocument } from "../../interfaces";
import { DateRange, NumberRange, parseRange } from "../../utils/range";
import { tryUseXsdDataType } from '../../utils/xsd';

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
    default: 
      // TODO: should be cleaned up!!!
      mainItem = overlay;
      doc.graph.push(overlay);
  }

  // if the overlay method did not provide a main item
  // we just create one artificially
  console.log("haha");
  if (!mainItem) {
    console.log("hihi");
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

const validationProcessOr = (elements: any): any[] => {
  const constraintsArray: any[] = [];
  for (const attrName in elements) {
    if (attrName === 'or') {
      for (const orGroup in elements[attrName]) {
        const attrib_constraints = validationProcessAttributes(elements[attrName][orGroup]);
        if (attrib_constraints.length > 0) {
          constraintsArray.push({'sh:property': attrib_constraints});
        }
        for (const val in elements[attrName][orGroup]) {
          if (val === 'datatype') {
            constraintsArray.push({'sh:datatype': {'@id': tryUseXsdDataType(elements[attrName][orGroup][val]).dataType}});
          }
        }
      }
    }
  }
  return constraintsArray;
}

const validationProcessAttributes = (attributes: any): any[] => {
  const constraintsArray: any[] = [];
  for (const attrName in attributes) {
    const constraints: { [key: string]: any } = {};
    const attr = attributes[attrName];
    if (!(attrName === 'or' || attrName === 'datatype')) {
      constraints['sh:path'] = attrName;
      for (const constraintKey in attr) {
        const value = attr[constraintKey];
        if (constraintKey === 'attributes') {
          const attr_constraints = validationProcessAttributes(value);
          if (attr_constraints.length > 0) {
            constraints['sh:property'] = attr_constraints;
          }
          const constraintsOr = validationProcessOr(value)
          if (constraintsOr.length > 0) {
            constraints['sh:or'] = {'@list': constraintsOr};
          }
        } else {
          if (constraintKey === 'pattern') {
            constraints['sh:pattern'] = value;
          } else if (constraintKey === 'cardinality') {
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
            if (Array.isArray(value)) {
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
        }
      }
      constraintsArray.push(constraints);
    }
  }
  return constraintsArray;
}

const handleValidation = (doc: IntSoyaDocument, overlay: any): GraphItem => {
  const { graph } = doc;

  const attrib_constraints = validationProcessAttributes(overlay.attributes);
  const or_constraints = validationProcessOr(overlay.attributes);
  if (or_constraints.length > 0) {
    attrib_constraints.push({'sh:or': {'@list': or_constraints}});
  }

  const shacl = {
    '@id': `${overlay.base}Shape`,
    '@type': 'sh:NodeShape',
    'sh:targetClass': overlay.base,
    'sh:property': attrib_constraints,
  };

  graph.push(shacl);
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
