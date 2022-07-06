import { ParsingContext } from "../../ParsingContext";
import { Util } from "../../Util";
import { EntryHandlerKeyword } from "./EntryHandlerKeyword";
/**
 * Handles @value entries.
 */
export declare class EntryHandlerKeywordValue extends EntryHandlerKeyword {
    constructor();
    validate(parsingContext: ParsingContext, util: Util, keys: any[], depth: number, inProperty: boolean): Promise<boolean>;
    test(parsingContext: ParsingContext, util: Util, key: any, keys: any[], depth: number): Promise<boolean>;
    handle(parsingContext: ParsingContext, util: Util, key: any, keys: any[], value: any, depth: number): Promise<any>;
}
