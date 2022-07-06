import 'cross-fetch/polyfill';
import { IDocumentLoader } from "./IDocumentLoader";
import { IJsonLdContext } from "./JsonLdContext";
/**
 * Loads documents via the fetch API.
 */
export declare class FetchDocumentLoader implements IDocumentLoader {
    private readonly fetcher?;
    constructor(fetcher?: (url: string, init: RequestInit) => Promise<Response>);
    load(url: string): Promise<IJsonLdContext>;
}
