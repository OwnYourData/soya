export class JsonParseError extends Error { }
export class FormRenderError extends Error {
  constructor(
    message: string
  ) {
    super(`${message} Can not render form.`);
  }
}