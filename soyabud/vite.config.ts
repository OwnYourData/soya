import { createRequire } from 'node:module';
import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue2';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const require = createRequire(import.meta.url);

// soya-js (CJS) transitively imports some node-only modules.
// We replace them with small browser stubs, as the code paths
// using them are either optional (logging) or not used by databud
// (jq/senml transformations are executed server-side).
const stub = (name: string) =>
  fileURLToPath(new URL(`./src/stubs/${name}.ts`, import.meta.url));

export default defineConfig({
  // same as webpack's publicPath: './'
  base: './',
  define: {
    // sparqljs' jison-generated parser ends with a CLI guard
    // "require.main === module && main(...)" that the commonjs
    // transform cannot rewrite — in the browser the raw `require`
    // would throw "require is not defined" at startup.
    // Replacing require.main with undefined disarms the guard.
    'require.main': 'undefined',
  },
  plugins: [
    vue(),
    // needed for soya-js' dependency chain (jsonld-streaming-parser,
    // rdf-ext, sparql-engine, ... rely on stream/buffer/process/events).
    // Global shim injection is disabled as the injected bare imports
    // cannot be resolved from within the linked soya-js package —
    // node globals are provided by src/polyfills.ts instead.
    nodePolyfills({
      globals: {
        Buffer: false,
        global: false,
        process: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      winston: stub('winston'),
      'node-jq': stub('node-jq'),
      '@gebsl/senml-js': stub('senml-js'),
      // readable-stream (via soya-js) imports the npm packages
      // 'process' and 'string_decoder' with a trailing slash, which
      // vite-plugin-node-polyfills' resolver cannot handle
      'process/': require.resolve('process/browser.js'),
      'string_decoder/': require.resolve('string_decoder/'),
    },
  },
  optimizeDeps: {
    // soya-js is a linked (file:) CJS package and would otherwise
    // not be pre-bundled by Vite's dev server
    include: ['soya-js'],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      // soya-js is a linked (file:) CJS package whose real path lives
      // outside of node_modules, so it must be included explicitly
      include: [/node_modules/, /soya[\\/]lib2/],
    },
  },
});
