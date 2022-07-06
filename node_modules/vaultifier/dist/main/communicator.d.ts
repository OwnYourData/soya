import { AxiosResponse } from "axios";
export declare type NetworkResponse = Pick<AxiosResponse, 'data' | 'headers' | 'request' | 'status'>;
export interface NetworkAdapter {
    get: (url: string, headers?: any) => Promise<NetworkResponse>;
    post: (url: string, data?: any, headers?: any) => Promise<NetworkResponse>;
    put: (url: string, data?: any, headers?: any) => Promise<NetworkResponse>;
    delete: (url: string, headers?: any) => Promise<NetworkResponse>;
}
export declare class Communicator {
    private token?;
    private networkAdapter;
    private tokenCallback?;
    constructor();
    private _usesAuthentication;
    setTokenCallback: (callback: () => Promise<string>) => void;
    setNetworkAdapter: (adapter?: NetworkAdapter | undefined) => NetworkAdapter;
    refreshToken(): Promise<string | undefined>;
    hasToken(): boolean;
    getToken(): string | undefined;
    get(url: string, usesAuth?: boolean): Promise<NetworkResponse>;
    post(url: string, usesAuth?: boolean, data?: any): Promise<NetworkResponse>;
    put(url: string, usesAuth?: boolean, data?: any): Promise<NetworkResponse>;
    delete(url: string, usesAuth?: boolean): Promise<NetworkResponse>;
    private tryCatch;
    private _placeNetworkCall;
    private _getHeaders;
    private _baseHeaders;
    private _getDataHeaders;
}
