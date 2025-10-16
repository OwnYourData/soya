import { isEnumControl, isOneOfControl, isOneOfEnumControl, and, or, rankWith, schemaTypeIs } from '@jsonforms/core';
import MultiSelect from './MultiSelect';

export const customRenderers = [
  {
    tester: rankWith(
      20,
      and(schemaTypeIs('array'), or(isOneOfControl, isEnumControl, isOneOfEnumControl)),
    ), renderer: MultiSelect
  },
];