/**
 * Node globals for the browser.
 *
 * Some of soya-js' (CJS) transitive dependencies expect the node
 * globals `Buffer`, `process` and `global` to exist. We provide them
 * globally here instead of using vite-plugin-node-polyfills' shim
 * injection, because injected bare imports cannot be resolved from
 * within the linked (file:) soya-js package.
 *
 * This module must be imported before anything else in main.ts.
 */

import { Buffer } from 'buffer';
import process from 'process';

const g = globalThis as any;

if (!g.global)
  g.global = globalThis;
if (!g.Buffer)
  g.Buffer = Buffer;
if (!g.process)
  g.process = process;
