import { parseJsonLd } from "../../utils/rdf";
import { SoyaInstance, SoyaDocument } from "../../interfaces";
import { SparqlQueryBuilder } from "../../utils/sparql";

const RDF_LIST = "http://www.w3.org/1999/02/22-rdf-syntax-ns#List";

const isObject = (value: any): value is Record<string, any> => {
    return value !== null && typeof value === "object" && !Array.isArray(value);
};

const isJsonLdKeyword = (prop: string): boolean => {
    return prop.startsWith("@");
};

const isRelevantInputProperty = (prop: string): boolean => {
    const firstChar = prop[0];

    // test if first character is an alpha character 
    // and no number or special character
    // if input json is already jsonld it contains properties like "@context"
    // which we don't want to use in our SPARQL query

    // Ignore JSON-LD keywords such as @context, @graph, @type, ...
    if (!firstChar || isJsonLdKeyword(prop)) return false;

    // Keep existing behaviour: only use properties that start with a word character.
    return /\w/i.test(firstChar);
};

const getRangeType = async (
    builder: SparqlQueryBuilder,
    prop: string,
    base: string
): Promise<string | undefined> => {
    const refClasses = await builder.query(`
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX base: <${base}>
    SELECT ?o WHERE {
      base:${prop} rdfs:range ?o .
    }`);

    const refClass = refClasses[0]?.get("?o");

    if (!refClass) return undefined;

    return refClass;
};

const convertListValue = async (
    builder: SparqlQueryBuilder,
    val: any,
    base: string
): Promise<any[]> => {
    const values = Array.isArray(val) ? val : [val];

    const listItems: any[] = [];

    for (const entry of values) {
        if (isObject(entry)) {
            const subItem: any = {};
            await iterateItemProps(builder, subItem, entry, base);
            listItems.push(subItem);
        } else {
            listItems.push(entry);
        }
    }

    return listItems;
};

const convertTypedObjectArray = async (
    builder: SparqlQueryBuilder,
    val: any[],
    type: string,
    base: string
): Promise<any[]> => {
    const items: any[] = [];

    for (const entry of val) {
        if (isObject(entry)) {
            const subItem: any = {
                "@type": type,
            };

            await iterateItemProps(builder, subItem, entry, base);
            items.push(subItem);
        } else {
            items.push(entry);
        }
    }

    return items;
};

const iterateItemProps = async (
    builder: SparqlQueryBuilder,
    item: any,
    flatJson: any,
    base: string
) => {
    for (const prop in flatJson) {
        const val = flatJson[prop];

        if (!isRelevantInputProperty(prop)) {
            item[prop] = val;
            continue;
        }

        const rangeType = await getRangeType(builder, prop, base);

        if (!rangeType) {
            item[prop] = val;
            continue;
        }

        const type = rangeType.replace(base, "");

        if (rangeType === RDF_LIST) {
            item[prop] = {
                "@list": await convertListValue(builder, val, base),
            };
            continue;
        }

        if (Array.isArray(val)) {
            item[prop] = await convertTypedObjectArray(builder, val, type, base);
            continue;
        }

        if (isObject(val)) {
            const subItem: any = {
                "@type": type,
            };

            item[prop] = [subItem];

            await iterateItemProps(builder, subItem, val, base);
            continue;
        }

        item[prop] = val;
    }
};

export const flat2ld = async (
    flatJson: any,
    soyaStructure: SoyaDocument
): Promise<SoyaInstance> => {
    const graph: any[] = [];
    const base = soyaStructure["@context"]["@base"];

    const retItem: SoyaInstance = {
        "@context": {
            "@version": 1.1,
            "@vocab": base,
        },
        "@graph": graph,
    };

    const flatItems = Array.isArray(flatJson) ? flatJson : [flatJson];
    const dataSet = await parseJsonLd(soyaStructure);
    const builder = new SparqlQueryBuilder(dataSet);

    for (const flatItem of flatItems) {
        const mainClasses = await builder.query(`
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX soya: <https://w3id.org/soya/ns#>
        SELECT ?s WHERE {
          ?s rdfs:subClassOf soya:Base .
        }`);

        const mainClass = mainClasses[0];

        if (!mainClass) continue;

        const mainClassName = mainClass.get("?s");

        if (!mainClassName) continue;

        const item: any = {
            "@type": mainClassName.replace(retItem["@context"]["@vocab"], ""),
        };

        graph.push(item);

        await iterateItemProps(builder, item, flatItem, base);
    }

    return retItem;
};