import { parseJsonLd } from "../../utils/rdf";
import { SoyaInstance, SoyaDocument } from "../../interfaces";
import { SparqlQueryBuilder } from "../../utils/sparql";

const iterateItemProps = async (builder: SparqlQueryBuilder, item: any, flatJson: any, base: string) => {
  for (const prop in flatJson) {
    const val = flatJson[prop];

    if (typeof val === 'object') {
      const refClasses = await builder.query(`
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX base: <${base}>
      SELECT ?o WHERE {
        base:${prop} rdfs:range ?o .
      }`);

      if (refClasses[0]) {
        const refClass = refClasses[0].get('?o');

        if (refClass) {
          const type = refClass.replace(base, '');

          if (Array.isArray(val))
            item[prop] = val.map(x => {
              x['@type'] = type;
              return x;
            });
          else {
            const subItem: any = {
              "@type": type,
            }
            item[prop] = [subItem];

            await iterateItemProps(builder, subItem, val, base);
          }
        }
      }
    }
    else
      item[prop] = flatJson[prop];
  }
}

export const flat2ld = async (flatJson: any, soyaStructure: SoyaDocument): Promise<SoyaInstance> => {
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
    if (mainClass) {
      const mainClassName = mainClass.get('?s');

      if (mainClassName) {
        const item: any = {
          "@type": mainClassName.replace(retItem["@context"]["@vocab"], ''),
        }
        graph.push(item);

        await iterateItemProps(builder, item, flatItem, base);
      }
    }
  }

  return retItem;
}