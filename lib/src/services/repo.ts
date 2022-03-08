import { Vaultifier, VaultMinMeta, VaultPostItem } from 'vaultifier/dist/main';
import { logger } from './logger';

// const DEFAULT_REPO = 'http://localhost:8080';
export const DEFAULT_REPO = 'https://soya.data-container.net';
export const DEFAULT_SOYA_NAMESPACE = 'https://ns.ownyourdata.eu/ns/soya-context.json';

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
  constructor(
    public repo: string = DEFAULT_REPO,
  ) { }

  private static INSTANCE = new RepoService();

  static getInstance = () => RepoService.INSTANCE;
  static initialize = (instance: RepoService) => RepoService.INSTANCE = instance;

  // TODO: implement caching

  getVaultifier = async (): Promise<Vaultifier> => {
    const v = new Vaultifier(this.repo);
    await v.initialize();

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

  private _pullCache: { [path: string]: any } = {};
  pull = async (path: string): Promise<any> => {
    if (this._pullCache[path])
      return this._pullCache[path];
    else
      return this._pullCache[path] = await this.get(`/${path}`, false);
  }

  private _push = async (cb: (vaultifier: Vaultifier) => Promise<VaultMinMeta>): Promise<VaultMinMeta> => {
    const v = await this.getVaultifier();
    const meta = await cb(v);

    return meta;
  }

  pushValue = async (data: any): Promise<VaultMinMeta> => {
    return this._push((v) => {
      logger.debug('Pushing value');
      logger.debug(JSON.stringify(data));
      return v.postValue(data);
    });
  }

  pushItem = async (item: VaultPostItem): Promise<VaultMinMeta> => {
    return this._push((v) => {
      logger.debug('Pushing item');
      logger.debug(JSON.stringify(item));
      return v.postItem(item);
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