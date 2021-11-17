import { Vaultifier, VaultItem } from 'vaultifier/dist/main';
import { logger } from './logger';

// const DEFAULT_REPO = 'http://localhost:8080';
export const DEFAULT_REPO = 'https://soya.data-container.net';
export const DEFAULT_SOYA_NAMESPACE = 'https://ns.ownyourdata.eu/ns/soya-context.json';

export class SoyaService {
  constructor(
    public repo: string = DEFAULT_REPO,
  ) { }

  private static INSTANCE = new SoyaService();

  static getInstance = () => SoyaService.INSTANCE;
  static initialize = (instance: SoyaService) => SoyaService.INSTANCE = instance;

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

  pull = async (path: string): Promise<any> => {
    return this.get(`/${path}`, false);
  }

  push = async (data: any): Promise<VaultItem> => {
    const v = await this.getVaultifier();
    const meta = await v.postValue(data);

    logger.debug('Return value of push', meta);
    logger.debug(`Fetching item with id ${meta.id}`);
    return v.getItem({
      id: meta.id,
    });
  }

  similar = async (data: any): Promise<any> => {
    return this.post(`/api/soya/similar`, false, data);
  }

  info = async (path: string): Promise<any> => {
    return this.get(`/${path}/info`, false);
  }
}