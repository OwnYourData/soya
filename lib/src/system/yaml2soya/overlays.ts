import { IntSoyaDocument } from "../../interfaces";
import { DateRange, NumberRange, parseRange } from "../../utils/range";
import { tryUseXsdDataType } from "../../utils/xsd";
import axios from "axios";

interface GraphItem {
    "@id": string;
    [key: string]: any;
}

interface BaseAttributeInfo {
    rawType?: string;
    containerType?: string;
    elementType?: string;
    range?: string;
}

type BaseIndex = Record<string, Record<string, BaseAttributeInfo>>;

const genericsRegex = /^(\w+)<(.+)>$/;
const RDF_LIST = "http://www.w3.org/1999/02/22-rdf-syntax-ns#List";

const arrayifyIfLeaf = (obj: any) => {
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        for (const key in obj) {
            obj[key] = arrayifyIfLeaf(obj[key]);
        }

        return obj;
    } else if (Array.isArray(obj)) {
        return obj;
    } else {
        return [obj];
    }
};

const isResolvableUrl = (value: string): boolean => {
    return /^https?:\/\/[^/\s]+/i.test(value);
};

const normalizeToArray = (value: any): any[] => {
    if (value == null) return [];
    return Array.isArray(value) ? value : [value];
};

const extractIdValue = (value: any): string | undefined => {
    if (!value) return undefined;

    if (typeof value === "string") {
        return value;
    }

    if (typeof value === "object") {
        if (typeof value["@id"] === "string") return value["@id"];
        if (typeof value.id === "string") return value.id;
        if (typeof value["@value"] === "string") return value["@value"];
    }

    return undefined;
};

const stripBaseIri = (value: string | undefined): string | undefined => {
    if (!value) return value;

    const hashPos = value.lastIndexOf("#");
    const slashPos = value.lastIndexOf("/");
    const pos = Math.max(hashPos, slashPos);

    return pos >= 0 ? value.substring(pos + 1) : value;
};

const buildBaseIndexFromYaml = (bases: any[]): BaseIndex => {
    const index: BaseIndex = {};

    for (const base of bases || []) {
        const baseName = base?.name;
        if (!baseName) continue;

        const baseEntry: Record<string, BaseAttributeInfo> = index[baseName] || {};
        index[baseName] = baseEntry;

        for (const attrName in base.attributes || {}) {
            const rawType = base.attributes[attrName];
            const match = typeof rawType === "string" ? genericsRegex.exec(rawType) : null;

            if (match) {
                const containerType = match[1];
                const elementType = match[2];

                if (containerType && elementType) {
                    baseEntry[attrName] = {
                        rawType,
                        containerType: containerType.toLowerCase(),
                        elementType: elementType.trim(),
                    };
                    continue;
                }
            }

            baseEntry[attrName] = {
                rawType,
                elementType: rawType,
            };
        }
    }

    return index;
};

const buildBaseIndexFromRemoteJsonLd = async (baseUrl: string): Promise<BaseIndex> => {
    const response = await axios.get(baseUrl, {
        headers: {
            Accept: "application/ld+json, application/json",
        },
    });

    const remote = response.data;

    if (!remote || typeof remote !== "object") {
        throw new Error(`Could not load valid JSON-LD from ${baseUrl}`);
    }

    const graph = remote?.["@graph"] || remote?.graph || [];

    if (!Array.isArray(graph)) {
        throw new Error(`Remote JSON-LD at ${baseUrl} does not contain an @graph`);
    }

    const index: BaseIndex = {};

    for (const item of graph) {
        const attrId = extractIdValue(item?.["@id"]);
        const domainValue = extractIdValue(item?.domain);
        const rangeValue = extractIdValue(item?.range);

        if (!attrId || !domainValue) continue;

        const baseName = stripBaseIri(domainValue);
        const attrName = stripBaseIri(attrId);

        if (!baseName || !attrName) continue;

        const baseEntry: Record<string, BaseAttributeInfo> = index[baseName] || {};
        index[baseName] = baseEntry;

        const containerTypeValue =
            extractIdValue(item?.["soya:containerType"]) || item?.["soya:containerType"];

        const elementTypes = normalizeToArray(item?.["soya:containerElementTypes"])
            .map(extractIdValue)
            .filter((x): x is string => !!x);

        const firstElementType =
            elementTypes.length > 0 ? stripBaseIri(elementTypes[0]) : stripBaseIri(rangeValue);

        baseEntry[attrName] = {
            range: rangeValue,
            containerType:
                typeof containerTypeValue === "string"
                    ? containerTypeValue.toLowerCase()
                    : undefined,
            elementType: firstElementType,
        };
    }

    return index;
};

const resolveValidationBaseIndex = async (
    overlayBase: string,
    content?: any,
): Promise<BaseIndex> => {
    if (!isResolvableUrl(overlayBase)) {
        return buildBaseIndexFromYaml(content?.bases || []);
    }

    return await buildBaseIndexFromRemoteJsonLd(overlayBase);
};

const resolveBaseEntryName = (overlayBase: string, baseIndex: BaseIndex): string => {
    if (baseIndex[overlayBase]) return overlayBase;

    const stripped = stripBaseIri(overlayBase);
    if (stripped && baseIndex[stripped]) return stripped;

    return overlayBase;
};

const getAttrInfo = (
    baseIndex: BaseIndex,
    currentBase: string,
    attrName: string,
): BaseAttributeInfo | undefined => {
    return baseIndex[currentBase]?.[attrName];
};

const isSetAttribute = (attrInfo?: BaseAttributeInfo): boolean => {
    return attrInfo?.containerType === "set" || attrInfo?.range === RDF_LIST;
};

const isComplexAttribute = (
    attrInfo: BaseAttributeInfo | undefined,
    baseIndex: BaseIndex,
): boolean => {
    if (!attrInfo?.elementType) return false;
    return !!baseIndex[attrInfo.elementType];
};

const buildListElementPath = (): any => {
    return {
        "@list": [
            {
                "sh:zeroOrMorePath": {
                    "@id": "rdf:rest",
                },
            },
            {
                "@id": "rdf:first",
            },
        ],
    };
};

const buildSetValuePath = (attrName: string): any => {
    return {
        "@list": [
            {
                "@id": attrName,
            },
            {
                "sh:zeroOrMorePath": {
                    "@id": "rdf:rest",
                },
            },
            {
                "@id": "rdf:first",
            },
        ],
    };
};

const applyCardinalityRange = (
    target: { [key: string]: any },
    value: string,
): void => {
    const range = parseRange(value);

    if (range instanceof NumberRange) {
        if (range.min != null) target["sh:minCount"] = range.min;
        if (range.max != null) target["sh:maxCount"] = range.max;
    }
};

const buildNodeShapeFromAttributes = (
    attributes: any,
    currentBase: string,
    baseIndex: BaseIndex,
): any => {
    const propertyConstraints = validationProcessAttributes(attributes, currentBase, baseIndex);
    const orConstraints = validationProcessOr(attributes, currentBase, baseIndex);

    const nodeShape: { [key: string]: any } = {
        "@type": "sh:NodeShape",
    };

    if (propertyConstraints.length > 0) {
        nodeShape["sh:property"] = propertyConstraints;
    }

    if (orConstraints.length > 0) {
        nodeShape["sh:or"] = {
            "@list": orConstraints,
        };
    }

    return nodeShape;
};

const validationProcessOr = (
    elements: any,
    currentBase: string,
    baseIndex: BaseIndex,
): any[] => {
    const constraintsArray: any[] = [];

    for (const attrName in elements) {
        if (attrName === "or") {
            for (const orGroup in elements[attrName]) {
                const nodeShape = buildNodeShapeFromAttributes(
                    elements[attrName][orGroup],
                    currentBase,
                    baseIndex,
                );

                constraintsArray.push(nodeShape);

                for (const val in elements[attrName][orGroup]) {
                    if (val === "datatype") {
                        constraintsArray.push({
                            "sh:datatype": {
                                "@id": tryUseXsdDataType(elements[attrName][orGroup][val]).dataType,
                            },
                        });
                    }
                }
            }
        }
    }

    return constraintsArray;
};

const validationProcessAttributes = (
    attributes: any,
    currentBase: string,
    baseIndex: BaseIndex,
): any[] => {
    const constraintsArray: any[] = [];

    for (const attrName in attributes) {
        const attr = attributes[attrName];

        if (attrName === "or" || attrName === "datatype") {
            continue;
        }

        const attrInfo = getAttrInfo(baseIndex, currentBase, attrName);
        const attrIsSet = isSetAttribute(attrInfo);
        const attrIsComplex = isComplexAttribute(attrInfo, baseIndex);

        const constraints: { [key: string]: any } = {
            "sh:path": attrName,
        };

        let hasNestedAttributes = false;
        let hasScalarConstraints = false;
        let pendingCardinality: string | undefined;

        for (const constraintKey in attr) {
            const value = attr[constraintKey];

            if (constraintKey === "attributes") {
                hasNestedAttributes = true;

                const childBase = attrInfo?.elementType || currentBase;

                if (attrIsSet) {
                    const listElementShape: { [key: string]: any } = {
                        "@type": "sh:PropertyShape",
                        "sh:path": buildListElementPath(),
                        "sh:node": buildNodeShapeFromAttributes(value, childBase, baseIndex),
                    };

                    if (pendingCardinality) {
                        applyCardinalityRange(listElementShape, pendingCardinality);
                    }

                    constraints["sh:property"] = [listElementShape];
                } else {
                    const childConstraints = validationProcessAttributes(value, childBase, baseIndex);
                    const childOrConstraints = validationProcessOr(value, childBase, baseIndex);

                    if (childConstraints.length > 0) {
                        constraints["sh:property"] = childConstraints;
                    }

                    if (childOrConstraints.length > 0) {
                        constraints["sh:or"] = {
                            "@list": childOrConstraints,
                        };
                    }
                }

                continue;
            }

            hasScalarConstraints = true;

            if (constraintKey === "pattern") {
                constraints["sh:path"] = attrIsSet && !attrIsComplex ? buildSetValuePath(attrName) : attrName;
                constraints["sh:pattern"] = value;
            } else if (constraintKey === "cardinality") {
                pendingCardinality = value;

                if (attrIsSet && attrIsComplex) {
                    constraints["sh:path"] = attrName;
                    applyCardinalityRange(constraints, value);
                } else {
                    constraints["sh:path"] = attrIsSet && !hasNestedAttributes && !attrIsComplex
                        ? buildSetValuePath(attrName)
                        : attrName;

                    applyCardinalityRange(constraints, value);
                }
            } else if (constraintKey === "length") {
                constraints["sh:path"] = attrIsSet && !attrIsComplex ? buildSetValuePath(attrName) : attrName;

                const range = parseRange(value);

                if (range instanceof NumberRange) {
                    if (range.min != null) constraints["sh:minLength"] = range.min;
                    if (range.max != null) constraints["sh:maxLength"] = range.max;
                }
            } else if (constraintKey === "valueRange") {
                constraints["sh:path"] = attrIsSet && !attrIsComplex ? buildSetValuePath(attrName) : attrName;

                const range = parseRange(value);

                if (range instanceof NumberRange) {
                    if (range.min != null) constraints["sh:minInclusive"] = range.min;
                    if (range.max != null) constraints["sh:maxInclusive"] = range.max;
                } else if (range instanceof DateRange) {
                    if (range.min) {
                        constraints["sh:minRange"] = {
                            "@type": "xsd:date",
                            "@value": range.min,
                        };
                    }
                    if (range.max) {
                        constraints["sh:maxRange"] = {
                            "@type": "xsd:date",
                            "@value": range.max,
                        };
                    }
                }
            } else if (constraintKey === "valueOption") {
                constraints["sh:path"] = attrIsSet && !attrIsComplex ? buildSetValuePath(attrName) : attrName;

                if (Array.isArray(value)) {
                    constraints["sh:in"] = {
                        "@list": value.map((x) => {
                            if (x && x.id) {
                                x["@id"] = x.id;
                                delete x.id;
                            }

                            return x;
                        }),
                    };
                }
            } else if (constraintKey === "message") {
                constraints["sh:message"] = value;
            }
        }

        if (attrIsSet && hasScalarConstraints && !hasNestedAttributes) {
            constraints["@type"] = "sh:PropertyShape";
        }

        constraintsArray.push(constraints);
    }

    return constraintsArray;
};

const handleValidation = async (
    doc: IntSoyaDocument,
    overlay: any,
    content?: any,
): Promise<GraphItem> => {
    const { graph } = doc;

    const baseIndex = await resolveValidationBaseIndex(overlay.base, content);
    const rootBase = resolveBaseEntryName(overlay.base, baseIndex);

    const attribConstraints = validationProcessAttributes(
        overlay.attributes,
        rootBase,
        baseIndex,
    );

    const orConstraints = validationProcessOr(
        overlay.attributes,
        rootBase,
        baseIndex,
    );

    if (orConstraints.length > 0) {
        attribConstraints.push({ "sh:or": { "@list": orConstraints } });
    }

    const shacl = {
        "@id": `${overlay.base}OverlayValidation`,
        "@type": overlay.type,
        "onBase": overlay.base,
        "name": overlay.name,
        "sh:targetClass": overlay.base,
        "sh:property": attribConstraints,
    };

    graph.push(shacl);
    return shacl;
};

export const handleOverlay = async (
    doc: IntSoyaDocument,
    overlay: any,
    content?: any,
) => {
    let mainItem: GraphItem | undefined;

    switch (overlay.type) {
        case "OverlayAnnotation":
            mainItem = handleAnnotation(doc, overlay);
            break;
        case "OverlayAlignment":
            mainItem = handleAlignment(doc, overlay);
            break;
        case "OverlayClassification":
            mainItem = handleClassification(doc, overlay);
            break;
        case "OverlayEncoding":
            mainItem = handleEncoding(doc, overlay);
            break;
        case "OverlayFormat":
            mainItem = handleFormat(doc, overlay);
            break;
        case "OverlayValidation":
            mainItem = await handleValidation(doc, overlay, content);
            break;
        case "OverlayTransformation":
            mainItem = handleTransformation(doc, overlay);
            break;
        case "OverlayForm":
            mainItem = handleForm(doc, overlay);
            break;
        default:
            mainItem = overlay;
            doc.graph.push(overlay);
    }

    if (!mainItem) {
        mainItem = {
            "@id": overlay.type,
        };
        doc.graph.push(mainItem);
    }

    const metaizedItem = Object.assign(
        {
            "@type": overlay.type,
            "onBase": overlay.base,
            name: overlay.name,
        },
        mainItem,
    );

    Object.assign(mainItem, metaizedItem);
};

const handleForm = (doc: IntSoyaDocument, overlay: any): GraphItem => {
    const { graph } = doc;

    const item = {
        "@id": `${overlay.base}Form`,
        "schema": overlay.schema,
        "ui": overlay.ui,
        "tag": overlay.tag,
        "language": overlay.language,
    };

    graph.push(item);

    return item;
};

const handleTransformation = (doc: IntSoyaDocument, overlay: any): GraphItem => {
    const { graph } = doc;

    const item = {
        "@id": `${overlay.base}Transformation`,
        "engine": overlay.engine,
        "value": overlay.value,
    };
    graph.push(item);

    return item;
};

const handleFormat = (doc: IntSoyaDocument, overlay: any): undefined => {
    const { graph } = doc;

    for (const attrName in overlay.attributes) {
        const encoding = overlay.attributes[attrName];

        graph.push({
            "@id": `${attrName}`,
            "format": encoding,
        });
    }

    return undefined;
};

const handleEncoding = (doc: IntSoyaDocument, overlay: any): undefined => {
    const { graph } = doc;

    for (const attrName in overlay.attributes) {
        const encoding = overlay.attributes[attrName];

        graph.push({
            "@id": `${attrName}`,
            "encoding": encoding,
        });
    }

    return undefined;
};

const handleClassification = (doc: IntSoyaDocument, overlay: any): undefined => {
    const { graph } = doc;

    for (const attrName in overlay.attributes) {
        let classifications = overlay.attributes[attrName];

        if (!Array.isArray(classifications)) {
            classifications = [classifications];
        }

        graph.push({
            "@id": `${attrName}`,
            "classification": classifications,
        });
    }

    return undefined;
};

const handleAnnotation = (doc: IntSoyaDocument, overlay: any): undefined => {
    const { graph } = doc;

    const handleAttribute = (annotation: any, attrName: string) => {
        const attributeObject: any = {
            "@id": `${attrName}`,
        };
        graph.push(attributeObject);

        for (const aTypeKey in annotation) {
            attributeObject[aTypeKey] = arrayifyIfLeaf(annotation[aTypeKey]);
        }
    };

    handleAttribute(overlay.class, overlay.base);

    for (const attrName in overlay.attributes) {
        const annotation = overlay.attributes[attrName];
        handleAttribute(annotation, attrName);
    }

    return undefined;
};

const handleAlignment = (doc: IntSoyaDocument, overlay: any): undefined => {
    const { graph } = doc;

    for (const attrName in overlay.attributes) {
        let relations = overlay.attributes[attrName];

        if (!Array.isArray(relations)) {
            relations = [relations];
        }

        graph.push({
            "@id": `${attrName}`,
            "rdfs:subPropertyOf": relations,
        });
    }

    return undefined;
};
