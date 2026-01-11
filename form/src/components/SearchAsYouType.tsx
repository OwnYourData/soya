import React, { useEffect, useMemo, useRef, useState } from 'react';

import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import TextField from '@material-ui/core/TextField';
import CircularProgress from '@material-ui/core/CircularProgress';
import Autocomplete from '@material-ui/lab/Autocomplete';

type Option = { const: string; title?: string };

const optionCache = new Map<string, Option[]>();
const labelCache = new Map<string, string>();

function normalizeOptions(raw: any): Option[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x: any) => {
      if (typeof x === 'string') return { const: x, title: x };
      if (x && typeof x === 'object') {
        const c = String(x.const ?? x.value ?? '');
        if (!c) return null;
        const t = x.title ?? x.text ?? x.label ?? c;
        return { const: c, title: String(t) };
      }
      return null;
    })
    .filter(Boolean) as Option[];
}

function primeLabelCache(options: Option[]) {
  for (const o of options) {
    const c = String(o.const ?? '');
    if (!c) continue;
    const t = o.title ? String(o.title) : c;
    labelCache.set(c, t);
  }
}

function buildAuthHeaderFromSchema(schema: any): Record<string, string> {
  const tokenParamName = schema?.auth_token;
  if (!tokenParamName || typeof tokenParamName !== 'string') return {};
  const url = new URL(window.location.href);
  const token = url.searchParams.get(tokenParamName);
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function buildCacheKey(endpoint: string, schema: any): string {
  // Cache key must differ per token-param *value* (not only name), otherwise
  // two users could see each other's cached results in a shared runtime.
  const tokenParamName = schema?.auth_token;
  const url = new URL(window.location.href);
  const tokenValue = tokenParamName ? url.searchParams.get(tokenParamName) : '';
  return `${endpoint}::${tokenParamName ?? ''}::${tokenValue ?? ''}`;
}

/**
 * Build SAYT query URL with explicit q_field handling:
 * - q_field=title for "search-as-you-type" suggestions (default on backend, but we set explicitly)
 * - q_field=const for resolving an existing stored const value to its title label
 */
function buildQueryUrl(baseUrl: string, q: string, qField: 'title' | 'const'): string {
  // Robust URL handling (keeps existing params like id=...&f=plain)
  try {
    const u = new URL(baseUrl);
    u.searchParams.set('q', q);
    u.searchParams.set('q_field', qField);
    return u.toString();
  } catch {
    // Fallback for non-absolute URLs
    const sep = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${sep}q=${encodeURIComponent(q)}&q_field=${encodeURIComponent(qField)}`;
  }
}

const MIN_QUERY_LEN = 2;

const SearchAsYouType = (props: ControlProps & { readonly?: boolean }) => {
  const {
    id,
    schema,
    uischema,
    label,
    description,
    handleChange,
    path,
    data,
    enabled = true,
    visible = true,
    errors,
    required,
    readonly: roProp,
  } = props as any;

  // Prefer subschema's saytApi; fall back to uischema.options.saytApi for compatibility.
  const endpoint = ((schema as any)?.saytApi ?? (uischema as any)?.options?.saytApi) as string | undefined;

  // readOnly & enabled zusammenführen
  const isReadOnly =
    roProp === true ||
    (uischema?.options && uischema.options.readonly === true) ||
    (schema && (schema as any).readOnly === true);

  const disabled = !enabled || isReadOnly;

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const qTrimmed = useMemo(() => (query ?? '').trim(), [query]);
  const canQuery = qTrimmed.length >= MIN_QUERY_LEN;
  const openEffective = open && canQuery;

  const resolvedEndpoint = useMemo(() => {
    if (!endpoint) return undefined;
    if (!canQuery) return undefined;
    // Suggestions must search by title (backend default is title, but we set explicitly)
    return buildQueryUrl(endpoint, qTrimmed, 'title');
  }, [endpoint, canQuery, qTrimmed]);

  const fetchOptions = async (url: string) => {
    const cacheKey = buildCacheKey(url, schema);
    const cached = optionCache.get(cacheKey);
    if (cached) {
      primeLabelCache(cached);
      setOptions(cached);
      return;
    }

    setLoading(true);
    setLoadError(undefined);

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        ...buildAuthHeaderFromSchema(schema),
      };

      const res = await fetch(url, { headers, signal: ac.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const normalized = normalizeOptions(json);
      primeLabelCache(normalized);

      optionCache.set(cacheKey, normalized);
      if (mountedRef.current) setOptions(normalized);
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      console.warn('SAYT fetch failed:', url, e);
      if (mountedRef.current) {
        setLoadError(String(e?.message ?? e));
        setOptions([]);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // Server-side search strategy:
  // - show results only when input length >= MIN_QUERY_LEN
  // - query parameter is 'q'
  // - query field for suggestions is 'title'
  // - do not locally filter (server returns filtered results)
  useEffect(() => {
    if (disabled) return;

    // If the input is cleared (< MIN_QUERY_LEN), we show nothing (empty list).
    if (!canQuery) {
      abortRef.current?.abort();
      setOptions([]);
      setLoadError(undefined);
      setLoading(false);
      setOpen(false);
      return;
    }

    if (!openEffective) return;
    if (!open) setOpen(true);
    if (!resolvedEndpoint) return;

    const t = window.setTimeout(() => {
      fetchOptions(resolvedEndpoint);
    }, 250);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openEffective, canQuery, resolvedEndpoint, disabled]);

  // If there is an existing value (const) and we don't yet know its title,
  // resolve it once by querying the server with q=<const>&q_field=const.
  useEffect(() => {
    if (!endpoint) return;
    if (data === undefined || data === null) return;

    const c = String(data).trim();
    if (!c) return;

    // If we already know a label, reflect it in the input.
    const cachedLabel = labelCache.get(c);
    if (cachedLabel && inputValue !== cachedLabel) {
      setInputValue(cachedLabel);
      return;
    }

    // If options already contain it, use that.
    const found = options.find((o) => o.const === c);
    if (found) {
      const lbl = found.title ? String(found.title) : c;
      labelCache.set(c, lbl);
      if (inputValue !== lbl) setInputValue(lbl);
      return;
    }

    // Otherwise: do a lightweight lookup (server-side search by const)
    // Backend: default search is title; for const lookup we MUST add q_field=const.
    const url = buildQueryUrl(endpoint, c, 'const');
    const ac = new AbortController();

    (async () => {
      try {
        const headers: Record<string, string> = {
          Accept: 'application/json',
          ...buildAuthHeaderFromSchema(schema),
        };
        const res = await fetch(url, { headers, signal: ac.signal });
        if (!res.ok) return;

        const json = await res.json();
        const normalized = normalizeOptions(json);
        primeLabelCache(normalized);

        const match = normalized.find((o) => o.const === c);
        if (match && mountedRef.current) {
          const lbl = match.title ? String(match.title) : c;
          labelCache.set(c, lbl);
          // Only set if still empty/const to avoid overwriting user's ongoing typing
          if (inputValue === '' || inputValue === c) setInputValue(lbl);
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, data]);

  const selectedOption = useMemo(() => {
    if (data === undefined || data === null) return null;
    const c = String(data);
    const found = options.find((o) => o.const === c);
    if (found) return found;
    const cached = labelCache.get(c);
    return { const: c, title: cached ?? c };
  }, [data, options]);

  const helperText = useMemo(() => {
    const err = typeof errors === 'string' ? errors.trim() : '';
    if (err) return err;
    if (loadError) return loadError;
    return description ?? '';
  }, [errors, description, loadError]);

  if (!visible) return null;
  if (!endpoint) return null;

  return (
    <FormControl id={id} fullWidth margin="normal" disabled={disabled}>
      <Autocomplete
        open={openEffective}
        onOpen={() => {
          const q = (inputValue ?? '').trim();
          if (q.length >= MIN_QUERY_LEN) setOpen(true);
        }}
        onClose={() => setOpen(false)}
        value={selectedOption}
        options={options}
        loading={loading}
        // IMPORTANT: do not locally filter; the server already returns filtered results
        filterOptions={(x) => x}
        getOptionLabel={(o) => (o?.title ? String(o.title) : String(o?.const ?? ''))}
        getOptionSelected={(a, b) => a.const === b.const}
        onChange={(_, value) => {
          if (disabled) return;
          handleChange(path, value ? value.const : undefined);
          // Ensure the visible input shows the title (not the const)
          if (value) {
            const lbl = value.title ? String(value.title) : String(value.const);
            labelCache.set(String(value.const), lbl);
            setInputValue(lbl);
          }
          setQuery('');
          setOpen(false);
        }}
        inputValue={inputValue}
        onInputChange={(_, v, reason) => {
          // Always update what is shown in the input
          setInputValue(v);

          // MUI v4 reasons:
          // - "input": user typed
          // - "reset": value selected / internal reset -> do NOT treat as new query
          // - "clear": clear button
          if (reason === 'input') {
            // If there is a selected value in the form data, clear it when user starts typing,
            // otherwise MUI will keep resetting the input to the selected option label.
            if (data !== undefined && data !== null && String(data).length > 0) {
              handleChange(path, undefined);
            }

            setQuery(v);
            const q = (v ?? '').trim();
            if (q.length < MIN_QUERY_LEN) {
              abortRef.current?.abort();
              setOptions([]);
              setLoadError(undefined);
              setLoading(false);
              setOpen(false);
            } else {
              setOpen(true);
            }
            return;
          }

          if (reason === 'clear') {
            setQuery('');
            handleChange(path, undefined);
            abortRef.current?.abort();
            setOptions([]);
            setLoadError(undefined);
            setLoading(false);
            setOpen(false);
            return;
          }

          // reason === 'reset' (or other): keep query cleared (no fetch)
          setQuery('');
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            variant="outlined"
            required={!!required}
            error={!!(typeof errors === 'string' && errors.trim()) || !!loadError}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(o) => (
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>{o.title ?? o.const}</span>
            <span style={{ opacity: 0.7, marginLeft: 12 }}>{o.const}</span>
          </div>
        )}
      />

      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  );
};

export default withJsonFormsControlProps(SearchAsYouType);