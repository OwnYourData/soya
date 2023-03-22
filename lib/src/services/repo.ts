import { Vaultifier, VaultMinMeta, VaultPostItem } from 'vaultifier/dist/main';
import { Cache } from './cache';
import { logger } from './logger';

// const DEFAULT_REPO = 'http://localhost:8080';
export const DEFAULT_REPO = 'https://soya.ownyourdata.eu';
export const DEFAULT_SOYA_NAMESPACE = 'https://ns.ownyourdata.eu/ns/soya-context.json';
export const DEFAULT_XSD = 'http://www.w3.org/2001/XMLSchema#';

export interface SoyaQueryResult {
  name: string,
  dri: string,
}

export interface SoyaQuery {
  name?: string,
}

export interface SoyaInfo {
  name: string;
  dri: string;
  history: {
    schema: string;
    date: string;
  }[];
  bases: string[];
  overlays: {
    type: string;
    name: string;
    base: string;
  };
}

export class RepoService {
  private _cache = new Cache();

  constructor(
    // repo must not be changed after RepoService instance has been created
    public readonly repo: string = DEFAULT_REPO,
  ) { }

  private static INSTANCE = new RepoService();

  static getInstance = () => RepoService.INSTANCE;
  static initialize = (instance: RepoService) => RepoService.INSTANCE = instance;

  private _vaultifier: Vaultifier | undefined = undefined;
  getVaultifier = async (): Promise<Vaultifier> => {
    let v = this._vaultifier;

    if (!v) {
      logger.debug(`Initializing vaultifier: ${this.repo}`);
      this._vaultifier = v = new Vaultifier(this.repo);
      await v.initialize();
    }

    return v;
  }

  get = async (url: string, usesAuth: boolean): Promise<any> => {
    logger.debug(`GETting ${url}`);
    const { data: res } = await (await this.getVaultifier()).get(url, usesAuth);

    return res;
  }

  post = async (url: string, usesAuth: boolean, data?: any): Promise<any> => {
    logger.debug(`POSTing ${url}`);
    const { data: res } = await (await this.getVaultifier()).post(url, usesAuth, data);

    return res;
  }

  pull = async (path: string): Promise<any> => {
    return this._cache.get(path, () => this.get(`/${path}`, false));
  }

  private _push = async (cb: (vaultifier: Vaultifier) => Promise<VaultMinMeta>): Promise<VaultMinMeta> => {
    const v = await this.getVaultifier();
    const meta = await cb(v);

    logger.debug(`Returned id from push: ${meta.id}`);

    return meta;
  }

  /**
   * @deprecated 
   */
  pushValue = async (data: any): Promise<VaultMinMeta> => {
    return this._push((v) => {
      logger.debug('Pushing value');
      logger.debug(JSON.stringify(data));
      return v.postValue(data);
    });
  }

  // we extend the VaultPostItem type here to allow for additional properties
  // that might be soya specific
  pushItem = async (item: VaultPostItem & { [key: string]: any }): Promise<VaultMinMeta> => {
    return this._push(async (v) => {
      logger.debug('Pushing item');
      logger.debug(JSON.stringify(item));
      return v.parsePostResult(await v.post('/api/data', false, item));
    });
  }

  similar = async (data: any): Promise<any> => {
    return this.post(`/api/soya/similar`, false, data);
  }

  query = async (query: SoyaQuery): Promise<SoyaQueryResult[]> => {
    // @ts-expect-error TypeScript is not happy with this, i know...
    return this.get(`/api/soya/query?${Object.keys(query).map(x => `${x}=${(query[x])}`).join('&')}`, false) as Promise<SoyaQueryResult[]>
  }

  // TODO: check if interface is still applicable (SoyaInfo)
  async info(path: string[]): Promise<SoyaInfo[]>;
  async info(path: string): Promise<SoyaInfo>;
  async info(path: string | string[]): Promise<SoyaInfo | SoyaInfo[]> {
    if (Array.isArray(path))
      return this.post(`/api/soya/info`, false, path);
    else
      return this.get(`/${path}/info`, false);
  }
}