export declare const exitWithError: (message: string) => never;
export declare const makeTempDir: () => Promise<[
    () => Promise<void>,
    string
]>;
export declare const escapeFilename: (name: string) => string;
