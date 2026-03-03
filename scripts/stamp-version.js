// Inject the version from package.json into index.html cache-busting params
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const htmlPath = resolve(root, 'public', 'index.html');

let html = await readFile(htmlPath, 'utf8');
html = html.replace(/(\?v=)[^"']*/g, `$1${pkg.version}`);
await writeFile(htmlPath, html, 'utf8');

console.log(`✓ Stamped version ${pkg.version} into index.html`);
