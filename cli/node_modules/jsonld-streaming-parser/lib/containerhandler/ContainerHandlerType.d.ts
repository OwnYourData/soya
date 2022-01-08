import { ParsingContext } from "../ParsingContext";
import { Util } from "../Util";
import { IContainerHandler } from "./IContainerHandler";
/**
 * Container handler for @type.
 *
 * This will add this entry to the parent node, and use the current key as an rdf:type value.
 */
export declare class ContainerHandlerType implements IContainerHandler {
    canCombineWithGraph(): boolean;
    handle(containers: {
        [typeName: string]: boolean;
    }, parsingContext: ParsingContext, util: Util, keys: string[], value: any, depth: number): Promise<void>;
}
