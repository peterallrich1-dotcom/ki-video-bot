// Rendert die 3D-Szene headless Bild für Bild und muxt Stimme + Sound per ffmpeg.
// Aufruf: node render3d.mjs timeline.json voice.(mp3|wav) sound.wav out.mp4 [--frames 0,30,60 --png dir]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [timelinePath, voice, sound, out, ...rest] = process.argv.slice(2);
const FPS = 30;
const root = path.dirname(new URL(import.meta.url).pathname);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const tl = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', e => { console.error('PAGEERROR', e.message); });
await page.goto(`http://127.0.0.1:${port}/scene.html`);
await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
await page.evaluate(async t => { await document.fonts.ready; return window.setup(t); }, tl);

const fi = rest.indexOf('--frames');
if (fi >= 0) {                       // Vorschau: nur einzelne Bilder als PNG
  const dir = rest[rest.indexOf('--png') + 1];
  fs.mkdirSync(dir, { recursive: true });
  for (const f of rest[fi + 1].split(',').map(Number)) {
    await page.evaluate(t => window.renderAt(t), f / FPS);
    await page.screenshot({ path: path.join(dir, `f${String(f).padStart(5, '0')}.png`) });
  }
  await browser.close(); server.close(); process.exit(0);
}

const n = Math.ceil(tl.duration * FPS);
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-r', String(FPS), '-i', '-',
  '-i', voice, '-i', sound,
  '-filter_complex', `[1:a]adelay=${Math.round(tl.lead_in * 1000)}|${Math.round(tl.lead_in * 1000)},volume=1.0[v];[2:a]volume=0.55[m];[v][m]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95[a]`,
  '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k', '-t', tl.duration.toFixed(2), '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let f = 0; f < n; f++) {
  await page.evaluate(t => window.renderAt(t), f / FPS);
  const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % 150 === 0) console.error(`frame ${f}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close(); server.close();
console.error(`fertig in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
