import { ParsingContext } from "../ParsingContext";
import { Util } from "../Util";
import { IContainerHandler } from "./IContainerHandler";
/**
 * Container handler for @id.
 *
 * It assumes that the current key is the identifier of the current value.
 * This will add this value to the parent node.
 */
export declare class ContainerHandlerIdentifier implements IContainerHandler {
    canCombineWithGraph(): boolean;
    handle(containers: {
        [typeName: string]: boolean;
    }, parsingContext: ParsingContext, util: Util, keys: string[], value: any, depth: number): Promise<void>;
}
