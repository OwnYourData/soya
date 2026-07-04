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

const REPO_API_BASE = '/api/repo';

function asArray<T = any>(x: any): T[] {
  return Array.isArray(x) ? (x as T[]) : [];
}

function extractOverlayForm(
  doc: any,
  tag?: string,
  language?: string
): { overlay: any; options: SoyaFormOption[] } {
  const overlays = asArray(doc?.content?.overlays ?? doc?.overlays);
  const formOverlays = overlays.filter((o) =>
    String(o?.type ?? '').toLowerCase().includes('overlayform')
  );

  if (formOverlays.length === 0) {
    throw new Error('No OverlayForm found in SOyA structure');
  }

  const options: SoyaFormOption[] = formOverlays.map((o) => ({
    tag: o?.tag ? String(o.tag) : undefined,
    language: o?.language ? String(o.language) : undefined,
  }));

  let candidates = formOverlays;

  if (tag) {
    candidates = candidates.filter((o) => String(o?.tag ?? '') === tag);
  }

  if (language) {
    candidates = candidates.filter(
      (o) => String(o?.language ?? '') === language
    );
  }

  if (candidates.length === 0) {
    candidates = formOverlays;
  }

  return { overlay: candidates[0], options };
}

export async function fetchSoyaYaml(soyaName: string): Promise<string> {
  const url = `${REPO_API_BASE}/${encodeURIComponent(soyaName)}/yaml`;

  const res = await fetch(url, {
    headers: {
      Accept: 'text/plain',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch SOyA YAML (HTTP ${res.status})`);
  }

  return (await res.text()).replace(/\r\n?/g, '\n');
}

/**
 * Fetches a GENERATED default form for a SOyA structure without form overlay.
 *
 * Served by server.mjs (/api/form/...), which proxies to a soya-web-cli
 * instance running soya-js' getSoyaForm — the same logic as "soya form"
 * on the command line.
 */
export async function fetchGeneratedForm(args: {
  soyaName: string;
  tag?: string;
  language?: string;
}): Promise<SoyaFormResponse> {
  const params = new URLSearchParams();
  if (args.language) params.set('language', args.language);
  if (args.tag) params.set('tag', args.tag);
  const qs = params.toString();

  const url = `/api/form/${encodeURIComponent(args.soyaName)}${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to generate form (HTTP ${res.status})`);
  }

  const json = await res.json();

  if (!json?.schema || !json?.ui) {
    throw new Error('Generated form is missing schema/ui');
  }

  return {
    schema: json.schema,
    ui: json.ui,
    options: Array.isArray(json.options) ? json.options : [],
  };
}

export async function fetchFormFromRepo(args: {
  soyaName: string;
  tag?: string;
  language?: string;
}): Promise<SoyaFormResponse> {
  const yamlText = await fetchSoyaYaml(args.soyaName);

  let doc: any;
  try {
    doc = yaml.load(yamlText);
  } catch (e: any) {
    throw new Error(`Failed to parse SOyA YAML: ${String(e?.message ?? e)}`);
  }

  let extracted: { overlay: any; options: SoyaFormOption[] };
  try {
    extracted = extractOverlayForm(doc, args.tag, args.language);
  } catch {
    // structure has no form overlay
    // -> fall back to a server-side generated default form
    return fetchGeneratedForm(args);
  }

  const { overlay, options } = extracted;

  if (!overlay?.schema || !overlay?.ui) {
    // form overlay exists but is unusable -> fall back as well
    return fetchGeneratedForm(args);
  }

  return {
    schema: overlay.schema,
    ui: overlay.ui,
    options,
  };
}

export async function querySoya(name: string): Promise<SoyaQueryResult[]> {
  const url = `${REPO_API_BASE}/query?name=${encodeURIComponent(name)}`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    return [];
  }

  const raw = await res.json();

  if (!Array.isArray(raw)) {
    return [];
  }

  const out: SoyaQueryResult[] = [];

  for (const x of raw) {
    if (typeof x === 'string') {
      const v = x.trim();
      if (v) out.push({ name: v, dri: v });
      continue;
    }

    if (x && typeof x === 'object') {
      const driRaw =
        (x as any).dri ??
        (x as any).DRI ??
        (x as any).id ??
        (x as any).identifier ??
        (x as any).soya_dri;

      const labelRaw =
        (x as any).name ??
        (x as any).title ??
        (x as any).label ??
        (x as any).soya_name;

      const dri = driRaw ? String(driRaw).trim() : undefined;
      const label = labelRaw ? String(labelRaw).trim() : '';

      if (!label && !dri) continue;

      out.push({
        name: label || (dri as string),
        dri,
      });
    }
  }

  return out;
}