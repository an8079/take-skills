#!/usr/bin/env node
import esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

await esbuild.build({
  entryPoints: [resolve(root, 'src/cli.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: resolve(root, 'dist/cli.js'),
  format: 'esm',
  sourcemap: true,
  minify: false,
  external: ['@anthropic-ai/sdk', '@modelcontextprotocol/sdk'],
});

console.log('CLI built successfully');
