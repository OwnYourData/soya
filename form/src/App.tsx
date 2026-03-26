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

import { customRenderers } from './components';
import { evaluteDynamicEnum } from './utils';
import { loadRuntimeConfig, RuntimeConfig } from './config';
import {
  fetchFormFromRepo,
  querySoya,
  SoyaFormResponse,
  SoyaQueryResult,
} from './services/soyaRepo';

import packageJson from '../package.json';
import './App.css';

function getInitialTheme(): 'light' | 'dark' {
  const t = new URLSearchParams(window.location.search).get('theme');
  return t === 'dark' ? 'dark' : 'light';
}

const postMessageSafe = (data: any | (() => any)) => {
  try {
    if (typeof data === 'function') data = data();
    window.parent?.postMessage(data, '*');
  } catch {}
};

const distinctNonEmpty = (values?: (string | undefined)[]) =>
  values
    ?.filter((x): x is string => !!x)
    .filter((x, i, arr) => arr.indexOf(x) === i);

function updateUrl(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams(window.location.search);

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || String(v).trim() === '') {
      sp.delete(k);
    } else {
      sp.set(k, String(v));
    }
  });

  // repo darf nicht mehr von außen gesteuert werden
  sp.delete('repo');

  const next = `${window.location.pathname}?${sp.toString()}`;
  window.history.replaceState({}, '', next);
}

export default function App() {
  const [type, setType] = useState<'light' | 'dark'>(getInitialTheme());

  useEffect(() => {
    (window as any).setMuiMode = (t: string) => setType(t === 'dark' ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    const onMsg = (evt: MessageEvent) => {
      const { type: msgType, theme } = (evt.data || {}) as {
        type?: string;
        theme?: string;
      };
      if (msgType === 'jsonforms-theme') {
        (window as any).setMuiMode?.(theme);
      }
    };

    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const theme = useMemo(
    () =>
      createMuiTheme({
        palette: { type },
      }),
    [type]
  );

  const allRenderers = useMemo(() => [...customRenderers, ...materialRenderers], []);

  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig | undefined>(undefined);
  const [runtimeConfigError, setRuntimeConfigError] = useState<string>('');

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoLoadDone, setAutoLoadDone] = useState(false);

  const [schemaDri, setSchemaDri] = useState('');
  const [schemaKey, setSchemaKey] = useState<string>('');
  const [schemaList, setSchemaList] = useState<SoyaQueryResult[]>([]);
  const [tag, setTag] = useState('');
  const [language, setLanguage] = useState('');
  const [viewMode, setViewMode] = useState<'embedded' | 'form-only' | string>('');

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
      const soyaForm = await fetchFormFromRepo({
        soyaName: key,
        tag: tag || undefined,
        language: language || undefined,
      });

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
      });
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : String(e);
      setLastLoadErrorKey(key);
      setLoadError(msg);
      setForm(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [schemaDri, schemaKey, language, tag, viewMode]);

  const fetchSchemas = useCallback(async (qRaw: string) => {
    const q = qRaw.trim();
    if (q.length < 2) {
      setSchemaList([]);
      return;
    }

    const list = await querySoya(q);
    setSchemaList(list);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const cfg = await loadRuntimeConfig();
        setRuntimeConfig(cfg);

        const { searchParams } = new URL(window.location.href);

        const dataParam = searchParams.get('data');
        if (dataParam) {
          const tryParse = (s: string) => {
            try {
              return JSON.parse(s);
            } catch {
              return undefined;
            }
          };

          let parsed = tryParse(dataParam);
          if (parsed === undefined) parsed = tryParse(decodeURIComponent(dataParam));

          if (parsed === undefined) {
            try {
              parsed = tryParse(decodeURIComponent(decodeURIComponent(dataParam)));
            } catch {
              // ignore
            }
          }

          if (parsed !== undefined) setData(parsed);
        }

        const urlParam = searchParams.get('url');
        if (!dataParam && urlParam) {
          setDataUrl(urlParam);
        }

        const tokenParam = searchParams.get('token');
        if (tokenParam) setAuthToken(tokenParam);

        const nameParam = (searchParams.get('schemaDri') ?? '').trim();
        const keyParam = (searchParams.get('schemaKey') ?? '').trim();

        setSchemaDri(nameParam);
        setSchemaKey(keyParam);
        setTag(searchParams.get('tag') ?? '');
        setLanguage(searchParams.get('language') ?? '');
        setViewMode(searchParams.get('viewMode') ?? '');

        // repo aus alter URL entfernen, falls vorhanden
        updateUrl({});

        setIsInitialized(true);
      } catch (e: any) {
        setRuntimeConfigError(String(e?.message ?? e));
      }
    })();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (autoLoadDone) return;

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

    sp.delete('repo');

    if (data !== undefined) sp.set('data', JSON.stringify(data));
    else sp.delete('data');

    return u.toString();
  }, [schemaDri, schemaKey, tag, language, viewMode, data]);

  const tagOptions = distinctNonEmpty(form?.options.map((x) => x.tag));
  const languageOptions = distinctNonEmpty(form?.options.map((x) => x.language));

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

          {runtimeConfig ? (
            <Typography variant="body2" color="textSecondary">
              Repo: {runtimeConfig.repoBaseUrl}
            </Typography>
          ) : null}

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

      <Box mt={2} display="flex" alignItems="flex-start" style={{ gap: 12 }}>
        <Box style={{ flexGrow: 1, position: 'relative' }}>
          <TextField
            label="SOyA Schema"
            fullWidth
            value={schemaDri}
            onChange={(e) => {
              const v = e.target.value;

              setSchemaDri(v);
              setSchemaKey('');
              setLoadError('');
              setLastLoadErrorKey('');

              if (schemaSearchTimer.current) {
                window.clearTimeout(schemaSearchTimer.current);
                schemaSearchTimer.current = null;
              }

              if (v.trim().length < 2) {
                setSchemaList([]);
                return;
              }

              schemaSearchTimer.current = window.setTimeout(() => {
                fetchSchemas(v);
              }, 300);
            }}
            onKeyUp={(evt) => {
              if (evt.key === 'Enter') fetchForm();
              if (evt.key === 'Escape') setSchemaList([]);
            }}
          />

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
                      setSchemaDri(x.name);
                      setSchemaKey((x.dri ?? x.name).trim());
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

  const Content = runtimeConfigError ? (
    <Box my={2} color="error.main">
      {runtimeConfigError}
    </Box>
  ) : !isInitialized ? (
    <Box my={4} display="flex" justifyContent="center">
      <CircularProgress />
    </Box>
  ) : isLoading ? (
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

console.log(packageJson.name, packageJson.version);