// Pages serves the same Vite UI; its signed API gateway keeps the existing D1 data.
import { build } from 'vite';
import { mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const target = resolve('dist-pages');
await build({ build: { outDir: target, emptyOutDir: true } });
const worker = resolve(target, '_worker.js');
mkdirSync(worker, { recursive: true });
copyFileSync('cloud/pages/worker.mjs', resolve(worker, 'index.js'));
copyFileSync('cloud/pages/proxy-auth.mjs', resolve(worker, 'proxy-auth.mjs'));
copyFileSync('cloud/favicon.svg', resolve(target, 'favicon.svg'));
writeFileSync(resolve(target, '_routes.json'), JSON.stringify({ version: 1, include: ['/*'], exclude: ['/assets/*', '/favicon.svg'] }) + '\n');
writeFileSync(resolve(target, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: same-origin\n  X-Frame-Options: DENY\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n');
console.log('Pages output: dist-pages. Configure the shared proxy secret before deployment.');
