import React, { useCallback, useEffect, useState } from 'react';
import { JsonForms } from '@jsonforms/react';
import {
  materialRenderers,
  materialCells,
} from '@jsonforms/material-renderers';
import { Soya, SoyaFormResponse, SoyaFormOptions } from 'soya-js'
import './App.css';
import { Vaultifier, VaultifierWeb } from 'vaultifier/dist/main';
import { customRenderers } from './components';

import { makeStyles } from '@material-ui/core/styles';
import {
  InputLabel,
  MenuItem,
  Select,
  FormControl,
  CircularProgress,
  Button,
  TextField,
  Card,
  CardContent,
  TextareaAutosize as TextArea,
} from '@material-ui/core';

const allRenderers = [
  ...customRenderers,
  ...materialRenderers,
];

const postMessage = (data: any | (() => any), timeout: number = 0) => {
  setTimeout(() => {
    if (window.parent) {
      // if necessary, execute function
      if (typeof data === 'function')
        data = data();

      window.parent.postMessage(data, '*');
      // setTimeout with 0 to inform the parent window
      // always after the last window repaint
    }
  }, timeout);
}

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 150,
  },
}));

function App() {
  const classes = useStyles();

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [vaultifier, setVaultifier] = useState<Vaultifier>();

  const [schemaDri, setSchemaDri] = useState<string>('');
  const [tag, setTag] = useState<string>('');
  const [language, setLanguage] = useState<string>('');
  const [viewMode, setViewMode] = useState<string>('');

  const isEmbedded = viewMode === 'embedded';

  const [form, setForm] = useState<SoyaFormResponse | undefined>(undefined);
  const [data, setData] = useState<any>({});
  const [textData, setTextData] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchForm = useCallback(async () => {
    if (vaultifier && schemaDri) {
      setIsLoading(true);

      try {
        const soya = new Soya();
        const formOptions: SoyaFormOptions | undefined = language || tag ? {
          language,
          tag,
        } : undefined;

        const soyaForm = await soya.getForm(await soya.pull(schemaDri), formOptions);

        setForm(soyaForm);
      } catch { }

      setIsLoading(false);
    }
  }, [vaultifier, schemaDri, language, tag]);

  const sendUpdate = useCallback((timeout: number = 0) => {
    postMessage(() => ({
      type: 'update',
      isInitialized,
      documentHeight: document.documentElement.scrollHeight,
    }), timeout);
  }, [isInitialized]);

  useEffect(() => {
    if (isInitialized)
      return;

    fetchForm();
  }, [fetchForm, isInitialized]);

  useEffect(() => {
    fetchForm();
    // this dependency array is correct!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tag, language]);

  useEffect(() => {
    const { searchParams } = new URL(window.location.href);

    const data = searchParams.get('data');
    if (data)
      try {
        setData(JSON.parse(decodeURIComponent(data)));
      } catch { }

    setSchemaDri(searchParams.get('schemaDri') ?? '');
    setTag(searchParams.get('tag') ?? '');
    setLanguage(searchParams.get('language') ?? '');
    setViewMode(searchParams.get('viewMode') ?? '');
  }, []);

  useEffect(() => {
    (async () => {
      const vaultifierWeb = await VaultifierWeb.create();
      await vaultifierWeb.initialize();

      if (!vaultifierWeb.vaultifier)
        throw new Error('Vaultifier could not be initialized');

      setVaultifier(vaultifierWeb.vaultifier);
      setIsInitialized(true);
    })();
  }, []);

  useEffect(() => {
    const handleClick = () => {
      sendUpdate(400);
    }

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [sendUpdate]);

  useEffect(() => {
    const handleMessage = (evt: MessageEvent) => {
      switch (evt.data?.type) {
        case 'data':
          const { data: newData } = evt.data;
          // only set data, if it differs to our internal data
          // this is important to avoid nasty infinite loops
          if (JSON.stringify(newData) !== JSON.stringify(data))
            setData(newData);
          break;
      }
    }

    // parent apps can also update data via message
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [data]);

  const permalink = new URL(window.location.href);
  const { searchParams } = permalink;
  if (schemaDri)
    searchParams.set('schemaDri', schemaDri);
  if (tag)
    searchParams.set('tag', tag);
  if (language)
    searchParams.set('language', language);
  if (data)
    searchParams.set('data', JSON.stringify(data));

  let header1: JSX.Element | undefined = undefined;
  if (!isEmbedded)
    header1 = <div>
      <TextField
        label="SOyA Schema DRI"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setSchemaDri(event.target.value);
        }}
        value={schemaDri}
      />
      <Button className="Button" variant="contained" color="primary" onClick={() => fetchForm()}>Load Form</Button>
    </div>;

  const withEmpty = (values: (string | undefined)[] | undefined) => {
    if (!values)
      return undefined;

    const distinct = (values.filter((x, idx) => !!x && values.indexOf(x) === idx) as string[])

    return [
      { value: '', text: 'Default' },
      ...distinct.map((x: string) => ({
        value: x,
        text: x,
      })),
    ];
  }

  const tagOptions = withEmpty(form?.options.map(x => x.tag));
  const languageOptions = withEmpty(form?.options.map(x => x.language));

  let header2: JSX.Element | undefined = undefined;
  if (!isLoading)
    header2 = <div>
      {tagOptions ? <FormControl className={classes.formControl}>
        <InputLabel>Tag</InputLabel>
        <Select
          value={tag}
          label="Tag"
          onChange={(event) => {
            setTag(event.target.value as string);
          }}
        >
          {tagOptions.map(({ value, text }) => <MenuItem key={`tag-${value}`} value={value}>{text}</MenuItem>)}
        </Select></FormControl> : undefined}
      {languageOptions ? <FormControl className={classes.formControl}>
        <InputLabel>Language</InputLabel>
        <Select
          value={language}
          label="Language"
          onChange={(event) => {
            setLanguage(event.target.value as string);
          }}
        >
          {languageOptions.map(({ value, text }) => <MenuItem key={`tag-${value}`} value={value}>{text}</MenuItem>)}
        </Select></FormControl> : undefined}
    </div>;

  let content: JSX.Element | undefined = undefined;
  if (isLoading || !isInitialized)
    content = <div><CircularProgress /></div>;
  else if (form)
    content = <JsonForms
      schema={form.schema}
      uischema={form.ui}
      data={data}
      renderers={allRenderers}
      cells={materialCells}
      onChange={(evt) => {
        const { data } = evt;
        setData(data);
        setTextData(JSON.stringify(data, null, 2));
        postMessage({ type: 'data', evt });
      }}
    />;

  let footer: JSX.Element | undefined = undefined;
  if (!isLoading && !isEmbedded)
    footer = <>
      <h2>Data</h2>
      <Card>
        <CardContent>
          <TextArea
            value={textData}
            style={{ 'width': '100%' }}
            onChange={(e) => {
              const text = e.target.value;
              setTextData(text);

              try {
                const data = JSON.parse(text);
                setData(data);
              } catch { }
            }} />
        </CardContent>
      </Card>
      <h2>Permalink</h2>
      <Card>
        <CardContent>
          {permalink.toString()}
        </CardContent>
      </Card>
    </>;

  // we use a function here as we want to the function
  // right before posting the message
  // this way we also catch layout/height changes
  // as every postMessage is executed with a setTimeout(0)
  sendUpdate();

  return (
    <div className={isEmbedded ? '' : 'App'}>
      {isInitialized ? (isEmbedded ? undefined : <h1>OwnYourData SOyA-Forms</h1>) : undefined}
      {isInitialized ? header1 : undefined}
      {isInitialized ? header2 : undefined}
      {content}
      {isInitialized ? footer : undefined}
    </div>
  );
}

export default App;
