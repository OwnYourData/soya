import { ParsingContext } from "../../ParsingContext";
import { Util } from "../../Util";
import { EntryHandlerKeyword } from "./EntryHandlerKeyword";
/**
 * Handles @nest entries.
 */
export declare class EntryHandlerKeywordNest extends EntryHandlerKeyword {
    constructor();
    handle(parsingContext: ParsingContext, util: Util, key: any, keys: any[], value: any, depth: number): Promise<any>;
}
