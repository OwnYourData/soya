import * as RDF from "@rdfjs/types";
import { ParsingContext } from "../ParsingContext";
import { Util } from "../Util";
import { IEntryHandler } from "./IEntryHandler";
/**
 * Handles values that are part of an array.
 */
export declare class EntryHandlerArrayValue implements IEntryHandler<boolean> {
    isPropertyHandler(): boolean;
    isStackProcessor(): boolean;
    validate(parsingContext: ParsingContext, util: Util, keys: any[], depth: number, inProperty: boolean): Promise<boolean>;
    test(parsingContext: ParsingContext, util: Util, key: any, keys: any[], depth: number): Promise<boolean>;
    handle(parsingContext: ParsingContext, util: Util, key: any, keys: any[], value: any, depth: number): Promise<any>;
    protected handleListElement(parsingContext: ParsingContext, util: Util, value: RDF.Term | null, valueOriginal: any, depth: number, listRootKeys: string[], listRootDepth: number): Promise<void>;
}
