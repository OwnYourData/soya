export interface IntSoyaDocument {
  ['@context']: {
    ['@version']: number,
    ['@base']: string,
    ['@import']: string,
    [key: string]: string | number,
  },

  // graph is named incorrectly
  // it should be @graph
  // however dealng with special characters is not so easy in node
  // therefore we work with plain "graph" until the end
  // shortly before plotting the document, we'll rename it to "@graph"
  graph: any[],
}

export type SoyaDocument = Omit<IntSoyaDocument, 'graph'> & { '@graph': any[] };

export type IntSoyaInstance = {
  "@context": {
    "@version": number,
    "@vocab": string,
  },
} & Pick<IntSoyaDocument, 'graph'>;

export type SoyaInstance = Omit<IntSoyaInstance, 'graph'> & { '@graph': any[] };

export const isInstance = (document: any): document is SoyaInstance => {
  return document['@context'] && document['@context']['@vocab'];
}