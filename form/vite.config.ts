import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // server.mjs and the Dockerfile expect the production bundle in ./build
    outDir: 'build',
    // the mui vendor chunk (@mui/material + x-date-pickers) is ~620 kB and can
    // not reasonably be split further - raising the limit is deliberate,
    // all other chunks stay well below the default 500 kB
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        // split rarely-changing vendor libraries into own chunks:
        // app updates then only invalidate the (small) app chunk,
        // vendor chunks stay browser-cached
        // (rolldown-native mechanism, replaces rollup's manualChunks in vite 8)
        advancedChunks: {
          groups: [
            { name: 'react', test: /node_modules\/(react|react-dom|scheduler)\// },
            { name: 'mui', test: /node_modules\/(@mui|@emotion)\// },
            { name: 'jsonforms', test: /node_modules\/@jsonforms\// },
            { name: 'vendor', test: /node_modules/ },
          ],
        },
      },
    },
  },
  server: {
    port: 3000,
    // forward API calls to a locally running server.mjs
    // (serves /api/runtime-config and the /api/repo/* proxy),
    // start it with: PORT=8080 node server.mjs
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
});
