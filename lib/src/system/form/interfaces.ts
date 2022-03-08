import { JsonSchema, Layout } from '@jsonforms/core';

export interface SoyaForm {
  schema: JsonSchema,
  ui: Layout,
  languages?: string[],
};

export { JsonSchema, Layout } from '@jsonforms/core';