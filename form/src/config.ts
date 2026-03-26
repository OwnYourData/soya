export type RuntimeConfig = {
  repoBaseUrl: string;
  repoMode: 'public' | 'private';
};

let configPromise: Promise<RuntimeConfig> | null = null;

function normalizeRepoBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (!configPromise) {
    configPromise = (async () => {
      const res = await fetch('/api/runtime-config', {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load runtime config (HTTP ${res.status})`);
      }

      const json = await res.json();

      if (!json?.repoBaseUrl || typeof json.repoBaseUrl !== 'string') {
        throw new Error('Missing repoBaseUrl in runtime config');
      }

      const repoMode: 'public' | 'private' =
        json.repoMode === 'private' ? 'private' : 'public';

      return {
        repoBaseUrl: normalizeRepoBaseUrl(json.repoBaseUrl),
        repoMode,
      };
    })();
  }

  return configPromise;
}