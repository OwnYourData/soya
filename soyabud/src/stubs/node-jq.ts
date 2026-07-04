/**
 * Browser stub for `node-jq`.
 *
 * node-jq spawns a native jq binary and can therefore not run in the
 * browser. databud never executes jq transformations client-side
 * (they are executed by the SOyA repository/CLI), so this stub only
 * exists to satisfy soya-js' import and throws if it is ever called.
 */

export const run = (): never => {
  throw new Error('node-jq is not available in the browser');
};

export default { run };
