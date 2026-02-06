#!/usr/bin/env node
/**
 * Bundle script for Rynko MCP Server
 * Creates a single-file bundle with all dependencies included
 */

import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectDir = dirname(__dirname);

async function bundle() {
  console.log('Bundling MCP server...');

  await esbuild.build({
    entryPoints: [join(projectDir, 'dist/index.js')],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    outfile: join(projectDir, 'dist-bundle/index.js'),
    // No banner needed - the source file already has shebang
    // Mark nothing as external - bundle everything
    external: [],
    minify: false,
    sourcemap: false,
  });

  console.log('Bundle created at dist-bundle/index.js');
}

bundle().catch((err) => {
  console.error('Bundle failed:', err);
  process.exit(1);
});
