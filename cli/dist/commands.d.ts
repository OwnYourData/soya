import { Soya } from "soya-js";
export declare const systemCommands: {
    [key: string]: (params: Array<any>, soya: Soya) => Promise<void>;
};
