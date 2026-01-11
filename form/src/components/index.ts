// src/components/index.ts
import {
  and,
  isControl,
  isEnumControl,
  isOneOfControl,
  isOneOfEnumControl,
  or,
  rankWith,
  schemaTypeIs,
} from '@jsonforms/core';

import MultiSelect from './MultiSelect';
import SearchAsYouType from './SearchAsYouType';

/**
 * Resolve a JSON Forms scope like "#/properties/country" against the root schema.
 * Handles JSON Pointer escaping (~1 for '/', ~0 for '~').
 */
function resolveScopeSchema(rootSchema: any, scope?: string): any | undefined {
  if (!rootSchema || typeof rootSchema !== 'object') return undefined;
  if (!scope || typeof scope !== 'string') return undefined;
  if (!scope.startsWith('#/')) return undefined;

  const decodePointerToken = (t: string) => t.replace(/~1/g, '/').replace(/~0/g, '~');

  const parts = scope
    .replace(/^#\//, '')
    .split('/')
    .map(decodePointerToken);

  let cur: any = rootSchema;
  for (const p of parts) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

/**
 * SAYT is defined as a custom property on the *field subschema*:
 * schema.properties.<field>.saytApi
 * JSON Forms tester receives the *root schema*, so we must resolve via uischema.scope.
 */
function hasSaytApiAtScope(uischema: any, rootSchema: any): boolean {
  const sub = resolveScopeSchema(rootSchema, uischema?.scope);
  return typeof sub?.saytApi === 'string' && sub.saytApi.trim().length > 0;
}

export const customRenderers = [
  /**
   * Search-as-you-type renderer
   * High rank so it reliably overrides default string control renderer.
   */
  {
    tester: rankWith(100, and(isControl, (uischema, schema) => hasSaytApiAtScope(uischema, schema))),
    renderer: SearchAsYouType,
  },

  /**
   * MultiSelect must ONLY apply to ARRAY controls.
   * Otherwise it will "steal" object oneOf controls (e.g., "Source" with OAUTH/API KEY tabs)
   * and the tabbed renderer will never be used.
   */
  {
    tester: rankWith(
      20,
      and(
        isControl,
        schemaTypeIs('array'),
        // keep the previous semantics: only if JSON Forms recognizes it as enum/oneOf(-enum) control
        or(isEnumControl, isOneOfControl, isOneOfEnumControl)
      )
    ),
    renderer: MultiSelect,
  },
];