import { JsonLdParser } from 'jsonld-streaming-parser';
import { IJsonLdSerializerOptions, JsonLdSerializer } from 'jsonld-streaming-serializer';
import factory from "rdf-ext";
import * as jsonld from 'jsonld';
import { ContextDefinition } from 'jsonld';
import { DEFAULT_REPO } from '../services/repo';
import axios from 'axios';
import { Cache } from '../services/cache';

const documentCache = new Cache();
export const parseJsonLd = (input: any) => {
  const parser = new JsonLdParser({
    ignoreMissingContextLinkHeader: true,
    baseIRI: DEFAULT_REPO, // for @ids that are not absolute this value is used as a default (to make it absolute)
    processingMode: '1.1',
    documentLoader: {
      // overwriting document loader here, as default implementation is
      // fetch, which is experimental on node.js
      load: async (url: string) => {
        const cacheItem = await documentCache.get(url, async () => (await axios.get(url)).data);
        return cacheItem.data;
      },
    }
  });

  const str = JSON.stringify(input);

  parser.write(str);
  parser.end();

  return factory.dataset().import(parser);
}

export const serializeJsonLd = async (stream: NodeJS.EventEmitter, options?: IJsonLdSerializerOptions): Promise<string> => {
  const serializer = new JsonLdSerializer({
    compactIds: true,
    ...options,
  });

  const res = await new Promise<string>((resolve, reject) => {
    let output = '';

    serializer.import(stream)
      .on('data', (chunk) => output += chunk)
      .on('error', (err) => reject(err))
      .on('end', () => resolve(output));
  });

  // without context we can not use library jsonld for further compacting the output
  if (!options?.context)
    return res;
  else {
    // jsonld-streaming-serializer does not compact output as small as possible
    // that's why we use package jsonld to compact output even further
    // NOTICE: This is problematic as jsonld does not use streams
    // therefore we lose the memory efficient stream capabilities of jsonld-streaming-serializer
    // but as this cli is not a high-performance tool, we actually don't care :-)
    const obj = JSON.parse(res);
    const compacted = await jsonld.compact(obj, options.context as ContextDefinition);
    return JSON.stringify(compacted);
  };
}

export const isIRI = (value?: string) => {
  // well this is not really elaborate
  // yet better than nothing
  // and also extensible to be more comprehensive in the future
  return value?.startsWith('http');
}

const splitLast = (value: string | undefined, split: string): string | undefined => {
  if (!value)
    return value;

  const arr = value.split(split);
  return arr[arr.length - 1];
}

export const getLastUriPart = (uri: string): string | undefined => {
  return splitLast(splitLast(uri, '/'), '#');
}

export { factory };
