// App.tsx — MUI v4 kompatibel

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { JsonForms } from '@jsonforms/react';
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';

import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import CircularProgress from '@material-ui/core/CircularProgress';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Brightness4Icon from '@material-ui/icons/Brightness4';
import Brightness7Icon from '@material-ui/icons/Brightness7';

import yaml from 'js-yaml';

import { customRenderers } from './components';
import { evaluteDynamicEnum } from './utils';
import packageJson from '../package.json';
import './App.css';

// --------------------
// Minimal SOyA repo client (no soya-js dependency)
// --------------------

type SoyaFormOption = {
  tag?: string;
  language?: string;
};

type SoyaFormResponse = {
  schema: any;
  ui: any;
  options: SoyaFormOption[];
};

type SoyaQueryResult = {
  name: string;
  dri?: string;
};

function normalizeRepoBase(repo: string): string {
  const r = (repo || '').trim();
  return r.endsWith('/') ? r.slice(0, -1) : r;
}

function asArray<T = any>(x: any): T[] {
  return Array.isArray(x) ? (x as T[]) : [];
}

function extractOverlayForm(
  doc: any,
  tag?: string,
  language?: string
): { overlay: any; options: SoyaFormOption[] } {
  const overlays = asArray(doc?.content?.overlays ?? doc?.overlays);
  const formOverlays = overlays.filter((o) => String(o?.type ?? '').toLowerCase().includes('overlayform'));

  if (formOverlays.length === 0) {
    throw new Error('No OverlayForm found in SOyA structure');
  }

  const options: SoyaFormOption[] = formOverlays.map((o) => ({
    tag: o?.tag ? String(o.tag) : undefined,
    language: o?.language ? String(o.language) : undefined,
  }));

  let candidates = formOverlays;
  if (tag) candidates = candidates.filter((o) => String(o?.tag ?? '') === tag);
  if (language) candidates = candidates.filter((o) => String(o?.language ?? '') === language);

  if (candidates.length === 0) {
    // fallback: no exact match (keep first form overlay)
    candidates = formOverlays;
  }

  return { overlay: candidates[0], options };
}

async function fetchSoyaYaml(repo: string, name: string): Promise<string> {
  const base = normalizeRepoBase(repo);
  const url = `${base}/${encodeURIComponent(name)}/yaml`;

  const res = await fetch(url, { headers: { Accept: 'text/plain' } });
  if (!res.ok) throw new Error(`Failed to fetch SOyA YAML (HTTP ${res.status})`);

  // normalize line breaks just in case
  return (await res.text()).replace(/\r\n?/g, '\n');
}

async function getFormFromRepo(repo: string, name: string, tag?: string, language?: string): Promise<SoyaFormResponse> {
  const yamlText = await fetchSoyaYaml(repo, name);
  let doc: any;
  try {
    doc = yaml.load(yamlText);
  } catch (e: any) {
    throw new Error(`Failed to parse SOyA YAML: ${String(e?.message ?? e)}`);
  }

  const { overlay, options } = extractOverlayForm(doc, tag, language);

  if (!overlay?.schema || !overlay?.ui) {
    throw new Error('OverlayForm is missing schema/ui');
  }

  return {
    schema: overlay.schema,
    ui: overlay.ui,
    options,
  };
}

async function querySchemas(repo: string, name: string): Promise<SoyaQueryResult[]> {
  const base = normalizeRepoBase(repo);
  const url = `${base}/api/soya/query?name=${encodeURIComponent(name)}`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return [];

  const raw = await res.json();
  if (!Array.isArray(raw)) return [];

  // Null-frei (TS-sicher) + name/dri sauber trennen
  const out: SoyaQueryResult[] = [];
  for (const x of raw) {
    if (typeof x === 'string') {
      const v = x.trim();
      if (v) out.push({ name: v, dri: v });
      continue;
    }
    if (x && typeof x === 'object') {
      const driRaw = (x as any).dri ?? (x as any).DRI ?? (x as any).id ?? (x as any).identifier;
      const labelRaw = (x as any).name ?? (x as any).title ?? (x as any).label ?? undefined;

      const dri = driRaw ? String(driRaw).trim() : undefined;
      const label = labelRaw ? String(labelRaw).trim() : '';

      if (!label && !dri) continue;
      out.push({ name: label || (dri as string), dri });
    }
  }
  return out;
}

// ----- Theme helpers (v4) -----
function getInitialTheme(): 'light' | 'dark' {
  const t = new URLSearchParams(window.location.search).get('theme');
  return t === 'dark' ? 'dark' : 'light';
}

// Kleine Helfer
const postMessageSafe = (data: any | (() => any)) => {
  try {
    if (typeof data === 'function') data = data();
    window.parent?.postMessage(data, '*'); // TODO: origin einschränken
  } catch {}
};

const distinctNonEmpty = (values?: (string | undefined)[]) =>
  values
    ?.filter((x): x is string => !!x)
    .filter((x, i, arr) => arr.indexOf(x) === i);

// URL Helper: hält bestehende Parameter, überschreibt nur übergebene Keys
function updateUrl(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams(window.location.search);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || String(v).trim() === '') sp.delete(k);
    else sp.set(k, String(v));
  });
  const next = `${window.location.pathname}?${sp.toString()}`;
  window.history.replaceState({}, '', next);
}

// --------------------------------

export default function App() {
  // THEME
  const [type, setType] = useState<'light' | 'dark'>(getInitialTheme());

  useEffect(() => {
    // vom Parent per postMessage steuerbar machen
    (window as any).setMuiMode = (t: string) => setType(t === 'dark' ? 'dark' : 'light');
  }, []);

  // auf postMessage reagieren (live toggeln)
  useEffect(() => {
    const onMsg = (evt: MessageEvent) => {
      const { type: msgType, theme } = (evt.data || {}) as { type?: string; theme?: string };
      if (msgType === 'jsonforms-theme') (window as any).setMuiMode?.(theme);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // v4: palette.type (nicht mode)
  const theme = useMemo(
    () =>
      createMuiTheme({
        palette: { type }, // 'light' | 'dark'
      }),
    [type]
  );

  // JSONForms Renderers
  const allRenderers = useMemo(() => [...customRenderers, ...materialRenderers], []);

  // SOyA / Form-State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoLoadDone, setAutoLoadDone] = useState(false);

  // Anzeige-Name (soll im Feld & in schemaDri= in der URL bleiben)
  const [schemaDri, setSchemaDri] = useState('');

  // Fetch-Key (nur intern; optional als schemaKey= in der URL)
  const [schemaKey, setSchemaKey] = useState<string>('');

  const [schemaList, setSchemaList] = useState<SoyaQueryResult[]>([]);
  const [tag, setTag] = useState('');
  const [language, setLanguage] = useState('');
  const [viewMode, setViewMode] = useState<'embedded' | 'form-only' | string>('');
  const [customRepo, setCustomRepo] = useState('');

  const showMetadata = viewMode === 'embedded' || viewMode === 'form-only';
  const showDropdowns = viewMode !== 'form-only';

  const [form, setForm] = useState<SoyaFormResponse | undefined>(undefined);
  const [loadError, setLoadError] = useState<string>('');
  const [lastLoadKey, setLastLoadKey] = useState<string>('');
  const [lastLoadErrorKey, setLastLoadErrorKey] = useState<string>('');

  const [data, setData] = useState<any>({});
  const [textData, setTextData] = useState('');
  const [dataUrl, setDataUrl] = useState<string | undefined>(undefined);
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);

  const schemaSearchTimer = useRef<number | null>(null);

  const fetchForm = useCallback(async () => {
    const key = (schemaKey || schemaDri).trim();
    setLastLoadKey(key);
    if (!key) return;

    setIsLoading(true);
    setSchemaList([]);
    setLoadError('');
    try {
      const soyaForm = await getFormFromRepo(customRepo, key, tag || undefined, language || undefined);
      const evaluated = await evaluteDynamicEnum(soyaForm);
      setForm(evaluated);
      setLastLoadErrorKey('');
      setLoadError('');

      updateUrl({
        schemaDri: schemaDri || key,
        schemaKey: schemaKey && schemaKey !== schemaDri ? schemaKey : undefined,
        tag: tag || undefined,
        language: language || undefined,
        viewMode: viewMode || undefined,
        repo: customRepo || undefined,
      });
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : String(e);
      setLastLoadErrorKey(key);
      setLoadError(msg);
      setForm(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [schemaDri, schemaKey, language, tag, customRepo, viewMode]);

  const fetchSchemas = useCallback(
    async (qRaw: string) => {
      const q = qRaw.trim();
      if (q.length < 2) {
        setSchemaList([]);
        return;
      }
      const list = await querySchemas(customRepo, q);
      setSchemaList(list);
    },
    [customRepo]
  );

  useEffect(() => {
    const { searchParams } = new URL(window.location.href);

    // 1) data= (hat Vorrang)
    const dataParam = searchParams.get('data');
    if (dataParam) {
      const tryParse = (s: string) => {
        try { return JSON.parse(s); } catch { return undefined; }
      };

      // 1) direkt JSON?
      let parsed = tryParse(dataParam);

      // 2) einmal decodeURIComponent?
      if (parsed === undefined) parsed = tryParse(decodeURIComponent(dataParam));

      // 3) zweimal decodeURIComponent? (für alte Permalinks mit doppelt encoding)
      if (parsed === undefined) {
        try {
          parsed = tryParse(decodeURIComponent(decodeURIComponent(dataParam)));
        } catch {
          // ignore
        }
      }

      if (parsed !== undefined) setData(parsed);
    }
    // 2) url= (Alternative, wird nur verwendet, wenn data nicht gesetzt ist)
    const urlParam = searchParams.get('url');
    if (!dataParam && urlParam) {
      setDataUrl(urlParam);
    }
    const tokenParam = searchParams.get('token');
    if (tokenParam) setAuthToken(tokenParam);

    const nameParam = (searchParams.get('schemaDri') ?? '').trim();
    const keyParam = (searchParams.get('schemaKey') ?? '').trim();

    setSchemaDri(nameParam);
    setSchemaKey(keyParam); // kann leer sein
    setTag(searchParams.get('tag') ?? '');
    setLanguage(searchParams.get('language') ?? '');
    setViewMode(searchParams.get('viewMode') ?? '');
    setCustomRepo(searchParams.get('repo') ?? 'https://soya.ownyourdata.eu');

    // Mark init done (separat vom Auto-Load)
    setIsInitialized(true);
  }, []);

  // ---- Auto-load once after init (fixes init race) ----
  useEffect(() => {
    if (!isInitialized) return;
    if (autoLoadDone) return;

    // Only autoload if we actually have something to load
    const nameOrKey = (schemaKey || schemaDri).trim();
    if (!nameOrKey) {
      setAutoLoadDone(true);
      return;
    }

    (async () => {
      await fetchForm();
      setAutoLoadDone(true);
    })();
  }, [isInitialized, autoLoadDone, schemaDri, schemaKey, fetchForm]);

  // Daten vom REST-Endpoint laden (Alternative zu data=)
  useEffect(() => {
    if (!dataUrl) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(dataUrl, {
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            Accept: 'application/json',
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const jsonData = await res.json();
        if (!cancelled) {
          setData(jsonData);
          postMessageSafe({ type: 'data', data: jsonData });
        }
      } catch (err) {
        console.warn('Failed to fetch data from url=', dataUrl, err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dataUrl, authToken]);

  useEffect(() => {
    if (!isInitialized) return;
    if (!autoLoadDone) return;
    fetchForm();
  }, [tag, language, isInitialized, autoLoadDone, fetchForm]);

  // Parent über Höhe/Init informieren (minimal)
  useEffect(() => {
    const sendUpdate = () =>
      postMessageSafe({
        type: 'update',
        isInitialized,
        documentHeight: document.documentElement.scrollHeight,
      });
    sendUpdate();
    const onClick = () => sendUpdate();
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [isInitialized]);

  const permalink = useMemo(() => {
    const u = new URL(window.location.href);
    const sp = u.searchParams;

    if (schemaDri) sp.set('schemaDri', schemaDri);
    else sp.delete('schemaDri');

    if (schemaKey && schemaKey !== schemaDri) sp.set('schemaKey', schemaKey);
    else sp.delete('schemaKey');

    if (tag) sp.set('tag', tag);
    else sp.delete('tag');

    if (language) sp.set('language', language);
    else sp.delete('language');

    if (viewMode) sp.set('viewMode', viewMode);
    else sp.delete('viewMode');

    if (customRepo) sp.set('repo', customRepo);
    else sp.delete('repo');

    if (data !== undefined) sp.set('data', JSON.stringify(data));
    else sp.delete('data');

    return u.toString();
  }, [schemaDri, schemaKey, tag, language, viewMode, customRepo, data]);

  const tagOptions = distinctNonEmpty(form?.options.map((x) => x.tag));
  const languageOptions = distinctNonEmpty(form?.options.map((x) => x.language));

  // UI-Bausteine
  const Header1 = !showMetadata ? (
    <Box mb={2}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar style={{ gap: 12 }}>
          <Typography
            variant="h5"
            style={{
              fontWeight: 700,
              letterSpacing: 0.2,
            }}
          >
            OwnYourData SOyA-Forms
          </Typography>

          <Box style={{ flexGrow: 1 }} />

          <Typography variant="body2" color="textSecondary">
            {packageJson.version}
          </Typography>

          <IconButton
            aria-label="toggle theme"
            onClick={() => setType((t) => (t === 'dark' ? 'light' : 'dark'))}
          >
            {type === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Suchzeile (full width) */}
      <Box mt={2} display="flex" alignItems="flex-start" style={{ gap: 12 }}>
        <Box style={{ flexGrow: 1, position: 'relative' }}>
          <TextField
            label="SOyA Schema"
            fullWidth
            value={schemaDri}
            onChange={(e) => {
              const v = e.target.value;

              setSchemaDri(v);
              setSchemaKey(''); // freies Tippen => name==key
              setLoadError('');
              setLastLoadErrorKey('');

              // Debounce: vorherigen Timer abbrechen
              if (schemaSearchTimer.current) {
                window.clearTimeout(schemaSearchTimer.current);
                schemaSearchTimer.current = null;
              }

              // Wenn zu kurz: Liste leeren und fertig
              if (v.trim().length < 2) {
                setSchemaList([]);
                return;
              }

              // nach kurzer Pause suchen
              schemaSearchTimer.current = window.setTimeout(() => {
                fetchSchemas(v);
              }, 300);
            }}

            onKeyUp={(evt) => {
              if (evt.key === 'Enter') fetchForm();
              if (evt.key === 'Escape') setSchemaList([]);
            }}

          />

          {/* Dropdown als Overlay (schiebt nichts nach unten) */}
          {schemaList.length > 0 ? (
            <Paper
              elevation={3}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 2000,
                maxHeight: 360,
                overflowY: 'auto',
                marginTop: 4,
              }}
            >
              <List dense>
                {schemaList.slice(0, 30).map((x) => (
                  <ListItem
                    key={`${x.dri ?? ''}-${x.name}`}
                    button
                    onClick={() => {
                      setSchemaDri(x.name);                 // Anzeige bleibt Name
                      setSchemaKey((x.dri ?? x.name).trim()); // Fetch-Key
                      setSchemaList([]);
                      setLoadError('');
                      setLastLoadErrorKey('');

                      updateUrl({
                        schemaDri: x.name,
                        schemaKey: x.dri && x.dri !== x.name ? x.dri : undefined,
                      });
                    }}
                  >
                    <ListItemText
                      primary={x.name}
                      secondary={x.dri && x.dri !== x.name ? `DRI: ${x.dri}` : undefined}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          ) : null}
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={fetchForm}
          disabled={isLoading || !(schemaKey || schemaDri).trim()}
          style={{ height: 56 }}
        >
          LOAD FORM
        </Button>
      </Box>
    </Box>
  ) : null;

  const Header2 = !isLoading && showDropdowns ? (
    <Box mb={2} display="flex" gridGap={16} flexWrap="wrap">
      {tagOptions?.length ? (
        <FormControl style={{ minWidth: 150 }}>
          <InputLabel>Tag</InputLabel>
          <Select value={tag} onChange={(e) => setTag(e.target.value as string)}>
            <MenuItem value="">Default</MenuItem>
            {tagOptions.map((v) => (
              <MenuItem key={`tag-${v}`} value={v}>
                {v}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : null}

      {languageOptions?.length ? (
        <FormControl style={{ minWidth: 150 }}>
          <InputLabel>Language</InputLabel>
          <Select value={language} onChange={(e) => setLanguage(e.target.value as string)}>
            <MenuItem value="">Default</MenuItem>
            {languageOptions.map((v) => (
              <MenuItem key={`lang-${v}`} value={v}>
                {v}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : null}
    </Box>
  ) : null;

  const currentKey = (schemaKey || schemaDri).trim();
  const showLoadError = !!loadError && !!lastLoadErrorKey && lastLoadErrorKey === currentKey;

  const Content = isLoading ? (
    <Box my={4} display="flex" justifyContent="center">
      <CircularProgress />
    </Box>
  ) : showLoadError ? (
    <Box my={2} color="error.main">
      {loadError}
    </Box>
  ) : form ? (
    <JsonForms
      schema={form.schema}
      uischema={form.ui}
      data={data}
      renderers={allRenderers}
      cells={materialCells}
      onChange={({ data: newData }) => {
        setData(newData);
        postMessageSafe({ type: 'data', data: newData });
      }}
    />
  ) : (
    <Box my={2} color="text.secondary">
      No form loaded.
    </Box>
  );

  const [textOpenSynced, setTextOpenSynced] = useState(false);
  useEffect(() => {
    if (!textOpenSynced) setTextData(JSON.stringify(data, null, 2));
  }, [data, textOpenSynced]);

  const Footer1 = !isLoading && !showMetadata ? (
    <>
      <Box mt={4}>
        <h2>Data</h2>
        <Card>
          <CardContent>
            <textarea
              value={textData}
              style={{ width: '100%', minHeight: 160 }}
              onChange={(e) => {
                setTextOpenSynced(true);
                setTextData(e.target.value);
                try {
                  const parsed = JSON.parse(e.target.value);
                  setData(parsed);
                } catch {}
              }}
              onBlur={() => {
                setTextOpenSynced(false);
                setTextData(JSON.stringify(data, null, 2));
              }}
            />
          </CardContent>
        </Card>
      </Box>

      <Box mt={4}>
        <h2>Permalink</h2>
        <Card>
          <CardContent>{permalink}</CardContent>
        </Card>
      </Box>
    </>
  ) : null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className={showMetadata ? '' : 'App'} p={showMetadata ? 0 : 2}>
        {isInitialized && Header1}
        {isInitialized && Header2}
        {Content}
        {isInitialized && Footer1}
      </Box>
    </ThemeProvider>
  );
}

// Version ins Console-Log
console.log(packageJson.name, packageJson.version);