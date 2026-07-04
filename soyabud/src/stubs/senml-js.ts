/**
 * Browser stub for `@gebsl/senml-js`.
 *
 * @gebsl/senml-js is an optional peer dependency of soya-js used for
 * SenML transformations. databud never executes those client-side,
 * so this stub only satisfies the import and throws if ever called.
 */

export const Normalize = (): never => {
  throw new Error('@gebsl/senml-js is not available in the browser');
};

export default { Normalize };
