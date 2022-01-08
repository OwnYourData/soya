import { JsonLdContextNormalized } from "jsonld-context-parser";
/**
 * A tree structure that holds all contexts,
 * based on their position in the JSON object.
 *
 * Positions are identified by a path of keys.
 */
export declare class ContextTree {
    private readonly subTrees;
    private context;
    getContext(keys: string[]): Promise<{
        context: JsonLdContextNormalized;
        depth: number;
    }> | null;
    setContext(keys: any[], context: Promise<JsonLdContextNormalized> | null): void;
    removeContext(path: string[]): void;
}
