import yaml from 'js-yaml';

export type SoyaFormOption = {
  tag?: string;
  language?: string;
};

export type SoyaFormResponse = {
  schema: any;
  ui: any;
  options: SoyaFormOption[];
};

export type SoyaQueryResult = {
  name: string;
  dri?: string;
};

const normalizeRepoBase = (repoBase: string): string => repoBase.replace(/\/+$/, '');

const getOverlays = (doc: any): any[] => {
  // In repository YAML, overlays usually live under `content.overlays`.
  // Some older exports may put it at the root.
  return (doc?.content?.overlays ?? doc?.overlays ?? []) as any[];
};

const isOverlayForm = (overlay: any): boolean =>
  String(overlay?.type ?? '').toLowerCase() === 'overlayform';

const getOverlayTag = (overlay: any): string | undefined =>
  overlay?.tag ?? overlay?.soya_tag ?? overlay?.meta?.tag;

const getOverlayLanguage = (overlay: any): string | undefined =>
  overlay?.language ?? overlay?.lang ?? overlay?.meta?.language;

export async function fetchSoyaYaml(repoBase: string, soyaName: string): Promise<any> {
  const base = normalizeRepoBase(repoBase);
  const url = `${base}/${encodeURIComponent(soyaName)}/yaml`;

  const res = await fetch(url, { headers: { Accept: 'text/plain' } });
  if (!res.ok) throw new Error(`SOyA pull failed (HTTP ${res.status})`);
  const text = await res.text();
  const doc = yaml.load(text);
  if (!doc || typeof doc !== 'object') throw new Error('Invalid SOyA YAML');
  return doc;
}

function pickOverlay(
  overlays: any[],
  opts: { tag?: string; language?: string }
): any | undefined {
  const candidates = overlays.filter(isOverlayForm);
  if (candidates.length === 0) return undefined;

  const tag = (opts.tag ?? '').trim();
  const language = (opts.language ?? '').trim();

  if (tag && language) {
    const exact = candidates.find(
      (o) => getOverlayTag(o) === tag && getOverlayLanguage(o) === language
    );
    if (exact) return exact;
  }

  if (tag) {
    const byTag = candidates.find((o) => getOverlayTag(o) === tag);
    if (byTag) return byTag;
  }

  if (language) {
    const byLang = candidates.find((o) => getOverlayLanguage(o) === language);
    if (byLang) return byLang;
  }

  return candidates[0];
}

export async function fetchFormFromRepo(args: {
  repoBase: string;
  soyaName: string;
  tag?: string;
  language?: string;
}): Promise<SoyaFormResponse> {
  const doc = await fetchSoyaYaml(args.repoBase, args.soyaName);
  const overlays = getOverlays(doc).filter(isOverlayForm);

  const options: SoyaFormOption[] = overlays.map((o) => ({
    tag: getOverlayTag(o),
    language: getOverlayLanguage(o),
  }));

  const selected = pickOverlay(overlays, { tag: args.tag, language: args.language });
  if (!selected) {
    throw new Error(`No OverlayForm found in SOyA structure '${args.soyaName}'`);
  }

  return {
    schema: selected?.schema ?? {},
    ui: selected?.ui ?? {},
    options,
  };
}

export async function querySoya(repoBase: string, name: string): Promise<SoyaQueryResult[]> {
  const base = normalizeRepoBase(repoBase);
  const url = `${base}/api/soya/query?name=${encodeURIComponent(name)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`SOyA query failed (HTTP ${res.status})`);

  const json: any = await res.json();
  if (!Array.isArray(json)) return [];

  return json
    .map((item: any): SoyaQueryResult | null => {
      if (typeof item === 'string') return { name: item };
      if (!item || typeof item !== 'object') return null;

      const n =
        item.name ??
        item.soya_name ??
        item.soya_dri ??
        item.dri ??
        item.id ??
        undefined;

      if (!n) return null;

      return {
        name: String(n),
        dri: item.dri ? String(item.dri) : item.soya_dri ? String(item.soya_dri) : undefined,
      };
    })
    .filter(Boolean) as SoyaQueryResult[];
}