export declare const Storage: {
    isSupported: () => boolean;
    get: (key: string) => string | undefined;
    getObject: <T>(key: string) => T | undefined;
    pop: (key: string) => string | undefined;
    set: (key: string, value: any) => void;
    remove: (key: string) => void;
};
