import { logger } from "./logger";

interface CacheItem {
  timestamp: number;
  data: any;
}

export class Cache {
  readonly cache: Map<string, CacheItem> = new Map();

  constructor(
    // in ms
    // 60 minutes by default
    public cacheTime: number = 30 * 60 * 1000,
  ) { }

  get = async (path: string, action: () => Promise<CacheItem>): Promise<CacheItem> => {
    const log = logger.child({tag: `Cache ${path}`});

    const now = new Date().getTime();
    let item = this.cache.get(path)

    if (!item || (item.timestamp + this.cacheTime) > now) {
      log.debug('Refreshing');
      
      item = await action();
      this.cache.set(path, item);
    } else {
      log.debug('Using cached result');
    }

    return item;
  }
}