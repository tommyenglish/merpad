// Copy the ESM entry files + their chunk folders into public/
import { cp, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));       // scripts/
const repo = resolve(root, '..');
const publicDir = resolve(repo, 'public');
await mkdir(publicDir, { recursive: true });

const assets = [
  {
    src: 'node_modules/mermaid/dist/mermaid.esm.min.mjs',
    dst: 'mermaid.esm.min.mjs',
    chunkDir: 'node_modules/mermaid/dist/chunks/mermaid.esm.min'
  },
  {
    src: 'node_modules/@mermaid-js/layout-elk/dist/mermaid-layout-elk.esm.min.mjs',
    dst: 'mermaid-layout-elk.esm.min.mjs',
    chunkDir: 'node_modules/@mermaid-js/layout-elk/dist/chunks/mermaid-layout-elk.esm.min'
  }
];

for (const a of assets) {
  await cp(resolve(repo, a.src), resolve(publicDir, a.dst));
  await cp(resolve(repo, a.chunkDir),
           resolve(publicDir, 'chunks', a.dst.replace('.mjs', '')),
           { recursive: true });
}

console.log('✓ Mermaid & ELK assets copied into public/');
