import { ParsingContext } from "../ParsingContext";
import { Util } from "../Util";
import { IContainerHandler } from "./IContainerHandler";
/**
 * Container handler for @index.
 *
 * This will ignore the current key and add this entry to the parent node.
 */
export declare class ContainerHandlerIndex implements IContainerHandler {
    canCombineWithGraph(): boolean;
    handle(containers: {
        [typeName: string]: boolean;
    }, parsingContext: ParsingContext, util: Util, keys: string[], value: any, depth: number): Promise<void>;
}
