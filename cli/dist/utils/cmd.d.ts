interface CmdArgs {
    default?: string[];
    repo?: string;
    verbose?: boolean[];
    help?: false;
    executable?: string;
    version: boolean;
}
export declare const printCliHelp: (command?: string | undefined) => Promise<never>;
export declare const cmdArgs: CmdArgs;
export {};
