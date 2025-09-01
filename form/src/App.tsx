// App.tsx — MUI v4 kompatibel

import React, { useCallback, useEffect, useMemo, useState } from 'react';

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

import { Soya, SoyaFormResponse, SoyaFormOptions, SoyaQueryResult } from 'soya-js';
import { customRenderers } from './components';
import { evaluteDynamicEnum } from './utils';
import packageJson from '../package.json';
import './App.css';

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

  const [schemaDri, setSchemaDri] = useState('');
  const [schemaList, setSchemaList] = useState<SoyaQueryResult[]>([]);
  const [tag, setTag] = useState('');
  const [language, setLanguage] = useState('');
  const [viewMode, setViewMode] = useState<'embedded' | 'form-only' | string>('');

  const showMetadata = viewMode === 'embedded' || viewMode === 'form-only';
  const showDropdowns = viewMode !== 'form-only';

  const [form, setForm] = useState<SoyaFormResponse | undefined>(undefined);
  const [data, setData] = useState<any>({});
  const [textData, setTextData] = useState('');

  const fetchForm = useCallback(async () => {
    if (!schemaDri) return;
    setIsLoading(true);
    try {
      const soya = new Soya();
      const formOptions: SoyaFormOptions = {
        language: language || undefined,
        tag: tag || undefined,
      };
      const soyaForm = await soya.getForm(await soya.pull(schemaDri), formOptions);
      setForm(await evaluteDynamicEnum(soyaForm));
    } catch (e) {
      // optional: console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [schemaDri, language, tag]);

  const fetchSchemas = useCallback(() => {
    (async () => {
      const list = await new Soya().query({ name: schemaDri });
      setSchemaList(list);
    })();
  }, [schemaDri]);

  // initiale URL-Parameter laden
  useEffect(() => {
    const { searchParams } = new URL(window.location.href);
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try { setData(JSON.parse(decodeURIComponent(dataParam))); } catch {}
    }
    setSchemaDri(searchParams.get('schemaDri') ?? '');
    setTag(searchParams.get('tag') ?? '');
    setLanguage(searchParams.get('language') ?? '');
    setViewMode(searchParams.get('viewMode') ?? '');
  }, []);

  // initial: Form ziehen
  useEffect(() => {
    if (isInitialized) return;
    (async () => {
      await fetchForm();
      setIsInitialized(true);
    })();
  }, [isInitialized, fetchForm]);

  // bei Tag/Language neu laden
  useEffect(() => {
    if (!isInitialized) return;
    fetchForm();
  }, [tag, language, isInitialized, fetchForm]);

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

  // Permalink (optional)
  const permalink = new URL(window.location.href);
  const sp = permalink.searchParams;
  if (schemaDri) sp.set('schemaDri', schemaDri);
  if (tag) sp.set('tag', tag);
  if (language) sp.set('language', language);
  if (data) sp.set('data', JSON.stringify(data));

  const tagOptions = distinctNonEmpty(form?.options.map((x) => x.tag));
  const languageOptions = distinctNonEmpty(form?.options.map((x) => x.language));

  // UI-Bausteine
  const Header1 = !showMetadata ? (
    <Box mb={2}>
      <Box display="flex" alignItems="center" gridGap={16}>
        <TextField
          label="SOyA Schema DRI"
          value={schemaDri}
          onChange={(e) => setSchemaDri(e.target.value)}
          onKeyUp={(evt) => {
            if (evt.key === 'Enter') fetchForm();
            else if (schemaDri.length >= 3) fetchSchemas();
            else setSchemaList([]);
          }}
        />
        <Button variant="contained" color="primary" onClick={fetchForm}>
          Load Form
        </Button>
      </Box>

      <List>
        {schemaList.map((x) => (
          <ListItem
            key={`${x.dri}-${x.name}`}
            button
            onClick={() => {
              setSchemaDri(x.name);
              setSchemaList([]);
            }}
          >
            <ListItemText primary={x.name} />
          </ListItem>
        ))}
      </List>
    </Box>
  ) : null;

  const Header2 = !isLoading && showDropdowns ? (
    <Box mb={2} display="flex" gridGap={16} flexWrap="wrap">
      {tagOptions && (
        <FormControl style={{ minWidth: 150 }}>
          <InputLabel>Tag</InputLabel>
          <Select
            value={tag}
            onChange={(e) => setTag(e.target.value as string)}
          >
            <MenuItem value="">Default</MenuItem>
            {tagOptions.map((v) => (
              <MenuItem key={`tag-${v}`} value={v}>
                {v}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      {languageOptions && (
        <FormControl style={{ minWidth: 150 }}>
          <InputLabel>Language</InputLabel>
          <Select
            value={language}
            onChange={(e) => setLanguage(e.target.value as string)}
          >
            <MenuItem value="">Default</MenuItem>
            {languageOptions.map((v) => (
              <MenuItem key={`lang-${v}`} value={v}>
                {v}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>
  ) : null;

  const Content = isLoading || !isInitialized ? (
    <Box my={4} display="flex" justifyContent="center">
      <CircularProgress />
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
        // optional: postMessageSafe({ type: 'data', data: newData });
      }}
    />
  ) : null;

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
          <CardContent>{permalink.toString()}</CardContent>
        </Card>
      </Box>
    </>
  ) : null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className={showMetadata ? '' : 'App'} p={showMetadata ? 0 : 2}>
        {isInitialized && !showMetadata && <h1>OwnYourData SOyA-Forms</h1>}
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