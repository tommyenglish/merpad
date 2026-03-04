// Build script: copies public/ to dist/ and minifies all app JS + CSS
import { cp, rm, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = resolve(root, 'public');
const dist = resolve(root, 'dist');

// Clean and copy
await rm(dist, { recursive: true, force: true });
await cp(pub, dist, { recursive: true });

// Minify all JS files in dist root (our app modules — not mermaid .mjs files)
const entries = await readdir(dist);
const jsFiles = entries.filter(f => f.endsWith('.js')).map(f => resolve(dist, f));

for (const file of jsFiles) {
  await esbuild.build({ entryPoints: [file], minify: true, allowOverwrite: true, outfile: file });
}

// Minify CSS
await esbuild.build({ entryPoints: [resolve(dist, 'viewer.css')], minify: true, allowOverwrite: true, outfile: resolve(dist, 'viewer.css') });

console.log(`✓ Built into dist/ (${jsFiles.length} JS files + viewer.css minified)`);
