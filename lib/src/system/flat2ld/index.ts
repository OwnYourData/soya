import { parseJsonLd } from "../../utils/rdf";
import rdf from "rdf-ext";
import DatasetExt from "rdf-ext/lib/Dataset";
import { SoyaInstance, SoyaDocument } from "../../interfaces";

const namedNode = rdf.namedNode;

const iterateItemProps = (dataSet: DatasetExt, item: any, flatJson: any, base: string) => {
  for (const prop in flatJson) {
    const val = flatJson[prop];

    if (typeof val === 'object') {
      const refClasses = dataSet.match(
        namedNode(`${base}${prop}`),
        namedNode('https://www.w3.org/2000/01/rdf-schema#range'),
        undefined,
      ).toArray();

      if (refClasses[0]) {
        const subItem: any = {
          "@type": refClasses[0].object.value.replace(base, ''),
        }
        item[prop] = [subItem];

        iterateItemProps(dataSet, subItem, val, base);
      }
    }
    else
      item[prop] = flatJson[prop];
  }
}

export const flat2ld = async (flatJson: any, soyaStructure: SoyaDocument): Promise<SoyaInstance> => {
  const base = soyaStructure["@context"]["@base"];
  const returnValue: SoyaInstance = {
    "@context": {
      "@version": 1.1,
      "@vocab": base,
    },
    "@graph": [],
  }

  const dataSet = await parseJsonLd(soyaStructure);
  // console.dir(dataSet, { depth: 10 });

  const mainClass = dataSet.match(
    undefined,
    namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
    namedNode('https://www.w3.org/2002/07/owl#Class'),
  ).toArray()[0];

  const item: any = {
    "@type": mainClass?.subject.value.replace(returnValue["@context"]["@vocab"], ''),
  }
  returnValue["@graph"].push(item);

  iterateItemProps(dataSet, item, flatJson, base);

  return returnValue;
}