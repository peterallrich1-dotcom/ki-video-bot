// Rendert die Logo-Varianten aus logo.html als 1080x1080 PNG.
// Aufruf: node render_logo.mjs <ausgabeordner>
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const out = process.argv[2];
const root = path.dirname(new URL(import.meta.url).pathname);
const types = { '.html': 'text/html', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
await page.goto(`http://127.0.0.1:${server.address().port}/logo.html`);
await page.evaluate(() => document.fonts.ready);
fs.mkdirSync(out, { recursive: true });
for (const id of ['v1', 'v2', 'v3']) {
  await page.evaluate(i => window.show(i), id);
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(out, `${id}.png`) });
}
await browser.close(); server.close();
