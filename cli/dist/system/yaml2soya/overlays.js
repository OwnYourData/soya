"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleOverlay = void 0;
const range_1 = require("../../utils/range");
const arrayifyIfLeaf = (obj) => {
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
};
const handleOverlay = (doc, overlay) => {
    switch (overlay.type) {
        case 'OverlayAnnotation':
            handleAnnotation(doc, overlay);
            break;
        case 'OverlayAlignment':
            handleAlignment(doc, overlay);
            break;
        case 'OverlayClassification':
            handleClassification(doc, overlay);
            break;
        case 'OverlayEncoding':
            handleEncoding(doc, overlay);
            break;
        case 'OverlayFormat':
            handleFormat(doc, overlay);
            break;
        case 'OverlayValidation':
            handleValidation(doc, overlay);
            break;
        case 'OverlayTransformation':
            handleTransformation(doc, overlay);
            break;
        // for unsupported overlays we just return here
        // all following code will not be executed
        default: return;
    }
    // add an informational element
    doc.graph.push({
        '@id': overlay.type,
        '@type': overlay.type,
        'onBase': overlay.base,
        name: overlay.name,
    });
};
exports.handleOverlay = handleOverlay;
const handleTransformation = (doc, overlay) => {
    const { graph } = doc;
    const item = {
        '@id': `${overlay.base}Transformation`,
        'engine': overlay.engine,
        'value': overlay.value,
    };
    graph.push(item);
};
const handleValidation = (doc, overlay) => {
    const { graph } = doc;
    const shacl = {
        '@id': `${overlay.base}Shape`,
        '@type': 'sh:NodeShape',
        'sh:targetClass': overlay.base,
        'sh:property': [],
    };
    graph.push(shacl);
    for (const attrName in overlay.attributes) {
        const attr = overlay.attributes[attrName];
        const constraints = {};
        for (const constraintKey in attr) {
            const value = attr[constraintKey];
            if (constraintKey === 'pattern') {
                constraints['sh:pattern'] = value;
            }
            else if (constraintKey === 'cardinality') {
                const range = (0, range_1.parseRange)(value);
                if (range instanceof range_1.NumberRange) {
                    if (range.min)
                        constraints['sh:minCount'] = range.min;
                    if (range.max)
                        constraints['sh:maxCount'] = range.max;
                }
            }
            else if (constraintKey === 'length') {
                const range = (0, range_1.parseRange)(value);
                if (range instanceof range_1.NumberRange) {
                    if (range.min)
                        constraints['sh:minLength'] = range.min;
                    if (range.max)
                        constraints['sh:maxLength'] = range.max;
                }
            }
            else if (constraintKey === 'valueRange') {
                const range = (0, range_1.parseRange)(value);
                if (range instanceof range_1.NumberRange) {
                    if (range.min)
                        constraints['sh:minRange'] = range.min;
                    if (range.max)
                        constraints['sh:maxRange'] = range.max;
                }
                else if (range instanceof range_1.DateRange) {
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
        shacl['sh:property'].push(Object.assign({ 'sh:path': `${attrName}` }, constraints));
    }
};
const handleFormat = (doc, overlay) => {
    const { graph } = doc;
    for (const attrName in overlay.attributes) {
        let encoding = overlay.attributes[attrName];
        graph.push({
            '@id': `${attrName}`,
            'format': encoding,
        });
    }
};
const handleEncoding = (doc, overlay) => {
    const { graph } = doc;
    for (const attrName in overlay.attributes) {
        let encoding = overlay.attributes[attrName];
        graph.push({
            '@id': `${attrName}`,
            'encoding': encoding,
        });
    }
};
const handleClassification = (doc, overlay) => {
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
};
const handleAnnotation = (doc, overlay) => {
    const { graph } = doc;
    const handleAttribute = (annotation, attrName, base) => {
        const attributeObject = {
            '@id': base ? `${attrName}` : attrName,
        };
        graph.push(attributeObject);
        for (const aTypeKey in annotation) {
            attributeObject[aTypeKey] = arrayifyIfLeaf(annotation[aTypeKey]);
        }
    };
    handleAttribute(overlay.class, overlay.base);
    for (const attrName in overlay.attributes) {
        let annotation = overlay.attributes[attrName];
        handleAttribute(annotation, attrName, overlay.base);
    }
};
const handleAlignment = (doc, overlay) => {
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
};
//# sourceMappingURL=overlays.js.map