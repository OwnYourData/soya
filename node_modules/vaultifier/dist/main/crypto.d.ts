import _canonicalize from 'canonicalize';
export declare const canonicalize: typeof _canonicalize;
export interface CryptoObject {
    value: string;
    nonce: string;
    version?: string;
}
export interface CipherObject {
    cipher: string;
    isHashed?: boolean;
}
export declare const createSha256Hex: (value: string) => Promise<string>;
export declare const encrypt: (text: string, publicKey: string) => Promise<CryptoObject>;
export declare const decrypt: (cryptoObject: CryptoObject, cipherObject: CipherObject) => Promise<string>;
export declare const isEncrypted: (item: any) => boolean;
export declare const getRandomString: (size: number) => string;
export declare const generateHashlink: (data: any, urls?: any, meta?: any) => Promise<string>;
