import { JsonSchema, Layout } from '@jsonforms/core';

export interface SoyaFormOptions {
  language?: string;
  tag?: string;
}
export interface SoyaForm {
  schema: JsonSchema,
  ui: Layout,
}
export interface SoyaFormResponse extends SoyaForm {
  options: SoyaFormOptions[],
};

export type StaticForm = Partial<SoyaForm> & SoyaFormOptions;

export { JsonSchema, Layout } from '@jsonforms/core';