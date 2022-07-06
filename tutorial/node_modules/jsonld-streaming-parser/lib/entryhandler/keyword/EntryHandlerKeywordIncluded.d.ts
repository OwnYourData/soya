import { ParsingContext } from "../../ParsingContext";
import { Util } from "../../Util";
import { EntryHandlerKeyword } from "./EntryHandlerKeyword";
/**
 * Handles @included entries.
 */
export declare class EntryHandlerKeywordIncluded extends EntryHandlerKeyword {
    constructor();
    handle(parsingContext: ParsingContext, util: Util, key: any, keys: any[], value: any, depth: number): Promise<any>;
}
