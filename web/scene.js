// 3D-Szene für "The Last Signal": Raumstation, Astronauten-Strichmännchen, Overlays.
// Wird headless von render3d.mjs Bild für Bild gesteuert: setup(timeline), renderAt(t).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const W = 1080, H = 1920;
const C = { cyan: 0x3ef0ff, magenta: 0xff3ea5, orange: 0xff8a3d, purple: 0x8a5cff, red: 0xff2d4a, yellow: 0xffd23e, green: 0x45ff9a };

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(0.8);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x1a1830, 0.03);
const camera = new THREE.PerspectiveCamera(42, W / H, 0.05, 1200);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W * 0.4, H * 0.4), 0.55, 0.4, 0.9);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ------------------------------------------------------------------ Hilfen
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function canvasTex(w, h, draw, repeat) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.anisotropy = 4; return t;
}
const neon = (color, i = 3) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(i) });
const metal = (color, r = 0.45, m = 0.7) => new THREE.MeshStandardMaterial({ color, roughness: r, metalness: m });

const panelTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#c9ced8'; g.fillRect(0, 0, w, h);
  const r = rng(4);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 2; x++) {
    const px = x * 256 + 8, py = y * 128 + 8;
    const v = 228 + Math.floor(r() * 18);
    const grd = g.createLinearGradient(px, py, px, py + 112);
    grd.addColorStop(0, `rgb(${v},${v + 2},${v + 6})`); grd.addColorStop(1, `rgb(${v - 22},${v - 20},${v - 14})`);
    g.fillStyle = grd; g.beginPath(); g.roundRect(px, py, 240, 112, 14); g.fill();
    g.strokeStyle = 'rgba(80,90,110,.35)'; g.lineWidth = 3; g.stroke();
    if (r() > .6) { g.fillStyle = 'rgba(40,50,70,.55)'; for (let k = 0; k < 5; k++) g.fillRect(px + 18 + k * 10, py + 16, 5, 22); }
    if (r() > .75) { g.fillStyle = ['#ff8a3d', '#3ec8ff', '#ff3ea5'][Math.floor(r() * 3)]; g.fillRect(px + 200, py + 14, 22, 6); }
  }
}, [3, 2]);
const floorTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#9aa3b4'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    g.fillStyle = (x + y) % 2 ? '#a8b1c2' : '#b3bccc'; g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60);
  }
  g.strokeStyle = 'rgba(60,70,90,.5)'; g.lineWidth = 3;
  for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
}, [6, 6]);
const hazardTex = canvasTex(512, 64, (g, w, h) => {
  g.fillStyle = '#ffc21a'; g.fillRect(0, 0, w, h); g.fillStyle = '#111';
  for (let x = -64; x < w + 64; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 32, 0); g.lineTo(x, h); g.lineTo(x - 32, h); g.fill(); }
}, [4, 1]);
function screenTex(kind, color) {
  return canvasTex(512, 320, (g, w, h) => {
    g.fillStyle = '#02101a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 4; g.globalAlpha = .95;
    if (kind === 'wave') { g.beginPath(); for (let x = 0; x < w; x += 4) g.lineTo(x, h / 2 + Math.sin(x * .05) * 50 * Math.sin(x * .011)); g.stroke(); }
    if (kind === 'radar') { for (let r = 40; r < 160; r += 40) { g.beginPath(); g.arc(w / 2, h / 2, r, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + 150, h / 2 - 60); g.stroke(); g.fillRect(w / 2 + 70, h / 2 - 90, 14, 14); }
    if (kind === 'text') { g.font = 'bold 34px monospace'; ['SIGNAL: UNKNOWN', 'FREQ 1420.40 MHz', 'SOURCE: ???', 'O2  98%  OK'].forEach((s, i) => g.fillText(s, 30, 70 + i * 62)); }
    g.globalAlpha = .12; for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 2);
  });
}

// ------------------------------------------------------------------ Weltraum draußen
const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 48, 24), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: {},
  vertexShader: 'varying vec3 v; void main(){ v = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `varying vec3 v;
    float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
    float n(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
    void main(){ vec3 p=v*3.; float a=n(p)*.5+n(p*2.)*.25+n(p*4.)*.125;
      vec3 col = mix(vec3(.02,.01,.06), vec3(.45,.08,.55), smoothstep(.35,.85,a));
      col = mix(col, vec3(.05,.45,.6), smoothstep(.55,.95,n(p*1.5+4.))*.7);
      col += vec3(1.,.4,.2)*pow(smoothstep(.6,1.,n(p*.8+9.)),3.)*.6;
      gl_FragColor = vec4(col*1.3, 1.); }`
}));
scene.add(sky);
{
  const r = rng(11), pos = [];
  for (let i = 0; i < 2500; i++) { const u = r() * 2 - 1, th = r() * 6.283, s = Math.sqrt(1 - u * u); pos.push(s * Math.cos(th) * 500, u * 500, s * Math.sin(th) * 500); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false })));
}
function hash3(x, y, z) { const v = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return v - Math.floor(v); }
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const L = (a, b, t) => a + (b - a) * t;
  return L(L(L(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u), L(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u), v),
           L(L(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u), L(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u), v), w);
}
function fbm(x, y, z, o = 5) { let a = 0, f = 1, s = .5; for (let i = 0; i < o; i++) { a += vnoise(x * f, y * f, z * f) * s; f *= 2.03; s *= .5; } return a; }
function sphereTex(w, h, fn) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) { const lat = (y / h - .5) * Math.PI; const cl = Math.cos(lat), sl = Math.sin(lat);
    for (let x = 0; x < w; x++) { const lon = x / w * Math.PI * 2; const c = fn(Math.cos(lon) * cl, sl, Math.sin(lon) * cl, lat);
      const i = (y * w + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c[3] ?? 255; } }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const earthTex = sphereTex(1024, 512, (x, y, z, lat) => {
  const n = fbm(x * 1.8 + 3, y * 1.8, z * 1.8 - 2);
  const ice = Math.abs(lat) > 1.25 + fbm(x * 6, y * 6, z * 6, 3) * .2;
  if (ice) return [235, 242, 250];
  if (n < .52) { const dpt = Math.min(1, (.52 - n) * 6); return [10 + 20 * (1 - dpt), 70 + 70 * (1 - dpt), 150 + 60 * (1 - dpt)]; }
  const m = fbm(x * 5, y * 5, z * 5, 4), dry = Math.max(0, 1 - Math.abs(lat) * 2.2) * (m > .52 ? 1 : 0);
  if (n < .54) return [196, 186, 140];
  const g0 = [46 + m * 50, 120 + m * 50, 52 + m * 20];
  return dry ? [170, 140, 90] : (n > .68 ? [110, 100, 90] : g0);
});
const cloudTex = sphereTex(1024, 512, (x, y, z) => {
  const c = fbm(x * 3 + 9, y * 4.5, z * 3 + 1, 5); const a = Math.max(0, Math.min(1, (c - .5) * 4));
  return [255, 255, 255, Math.round(a * 230)];
});
const earth = new THREE.Mesh(new THREE.SphereGeometry(10, 96, 48), new THREE.MeshStandardMaterial({ map: earthTex, roughness: .75, metalness: 0, emissive: 0x061a3a, emissiveIntensity: .25 }));
earth.material.fog = false;
const clouds = new THREE.Mesh(new THREE.SphereGeometry(10.12, 96, 48), new THREE.MeshStandardMaterial({ map: cloudTex, transparent: true, depthWrite: false, roughness: 1 }));
clouds.material.fog = false; earth.add(clouds);
const earthGlow = new THREE.Mesh(new THREE.SphereGeometry(10.9, 64, 32), new THREE.ShaderMaterial({
  transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 n; varying vec3 v; void main(){ n = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); v = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
  fragmentShader: 'varying vec3 n; varying vec3 v; void main(){ float f = pow(1. - abs(dot(n, v)), 2.2); gl_FragColor = vec4(vec3(.35,.7,1.)*f*2.2, f); }'
}));
// Sternschnuppen
const meteorTex = canvasTex(256, 16, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.85, 'rgba(200,230,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,1)'); g.fillStyle = gr; g.fillRect(0, 4, w, 8); });
const meteors = [];
for (let i = 0; i < 6; i++) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(14, .35), new THREE.MeshBasicMaterial({ map: meteorTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, color: new THREE.Color(1.6, 1.6, 1.8) }));
  scene.add(m); meteors.push(m);
}
function updateMeteors(t, ox) {
  meteors.forEach((m, i) => {
    const period = 2.6 + i * .7, ph = (t + i * 1.37) % period, dur = .9;
    m.visible = ph < dur;
    if (!m.visible) return;
    const r = rng(i * 97 + Math.floor((t + i * 1.37) / period) * 13); r();
    const u = ph / dur, sx = ox - 20 + r() * 30, sy = 6 + r() * 18, z = -70 - r() * 50;
    m.position.set(sx + u * 40, sy - u * 14, z); m.rotation.z = -Math.atan2(14, 40);
    m.material.opacity = Math.sin(u * Math.PI);
  });
}
const sun = new THREE.DirectionalLight(0xfff0dd, 2.4); sun.position.set(40, 25, 5);
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xbfd0ff, 0x6a4a80, 1.0));

// ------------------------------------------------------------------ Räume
const areas = {};
function room(ox, w, d, h, accentA, accentB) {
  const g = new THREE.Group(); g.position.set(ox, 0, 0); scene.add(g);
  const wallM = new THREE.MeshStandardMaterial({ map: panelTex, roughness: .5, metalness: .15, color: 0xffffff });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: floorTex, roughness: .3, metalness: .35 }));
  floor.rotation.x = -Math.PI / 2; g.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), wallM); ceil.rotation.x = Math.PI / 2; ceil.position.y = h; g.add(ceil);
  for (const s of [-1, 1]) { const side = new THREE.Mesh(new THREE.PlaneGeometry(d, h), wallM); side.rotation.y = -s * Math.PI / 2; side.position.set(s * w / 2, h / 2, 0); g.add(side); }
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallM); front.rotation.y = Math.PI; front.position.set(0, h / 2, d / 2); g.add(front);
  // Neonleisten an Boden und Decke
  for (const s of [-1, 1]) {
    const a = new THREE.Mesh(new THREE.BoxGeometry(.06, .06, d), neon(accentA, 2.5)); a.position.set(s * (w / 2 - .05), .05, 0); g.add(a);
    const b = new THREE.Mesh(new THREE.BoxGeometry(.08, .04, d), neon(accentB, 2.5)); b.position.set(s * (w / 2 - .3), h - .03, 0); g.add(b);
  }
  for (let z = -d / 2 + 1; z < d / 2; z += 2) { const l = new THREE.Mesh(new THREE.BoxGeometry(w * .5, .03, .25), neon(0xcfe8ff, 1.0)); l.position.set(0, h - .02, z); g.add(l); }
  const hemi = new THREE.PointLight(accentA, 2.2, 16, 1.4); hemi.position.set(-w / 3, h - .4, 0); g.add(hemi);
  const hemi2 = new THREE.PointLight(accentB, 2.2, 16, 1.4); hemi2.position.set(w / 3, h - .4, -1); g.add(hemi2);
  const top = new THREE.PointLight(0xf2f6ff, 5, 12, 1.4); top.position.set(0, h - .3, .5); g.add(top);
  return g;
}
function backWall(g, w, h, d, holeR, holeY) {
  const shape = new THREE.Shape(); shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0); shape.lineTo(w / 2, h); shape.lineTo(-w / 2, h);
  if (holeR) { const hole = new THREE.Path(); hole.absarc(0, holeY ?? h * .55, holeR, 0, Math.PI * 2, true); shape.holes.push(hole); }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: .3, bevelEnabled: false });
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2, uv.getY(i) / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: panelTex, roughness: .5, metalness: .15, color: 0xffffff }));
  m.position.z = -d / 2 - .3; g.add(m); return m;
}

// Fenster mit Erde
{
  const ox = 0, w = 7, d = 8, h = 4.2;
  const g = room(ox, w, d, h, C.cyan, C.magenta);
  backWall(g, w, h, d, 1.55);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, .14, 16, 64), metal(0xe6eaf2, .25, .4)); ring.position.set(0, h * .55, -d / 2 + .02); g.add(ring);
  const ringN = new THREE.Mesh(new THREE.TorusGeometry(1.78, .03, 8, 96), neon(C.cyan, 3)); ringN.position.copy(ring.position); g.add(ringN);
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; const b = new THREE.Mesh(new THREE.SphereGeometry(.06, 12, 8), metal(0xc0c8e0, .2, 1)); b.position.set(Math.cos(a) * 1.6, h * .55 + Math.sin(a) * 1.6, -d / 2 + .15); g.add(b); }
  earth.position.set(ox + 2.2, 0.2, -34); earthGlow.position.copy(earth.position); scene.add(earth, earthGlow);
  const crate = new THREE.Mesh(new THREE.BoxGeometry(.8, .6, .6), metal(0xd8dde8, .5, .2)); crate.position.set(2.4, .3, -2.5); g.add(crate);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(.82, .08, .62), new THREE.MeshStandardMaterial({ map: hazardTex })); stripe.position.set(2.4, .5, -2.5); g.add(stripe);
  const hand = new THREE.Group(); hand.position.set(0.25, h * .55 - .1, -d / 2 - .45); hand.visible = false; g.add(hand);
  const hm = new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: .4, metalness: .3, emissive: 0x300008 });
  const palm = new THREE.Mesh(new THREE.BoxGeometry(.42, .5, .08), hm); hand.add(palm);
  [[-.15, .38, .32, .1], [-.05, .45, .42, 0], [.05, .44, .4, 0], [.15, .38, .32, -.08], [-.27, .05, .26, .7]].forEach(([x, y, l, r]) => {
    const f = new THREE.Mesh(new THREE.CapsuleGeometry(.04, l, 4, 8), hm); f.position.set(x, y, 0); f.rotation.z = r; hand.add(f); });
  const handGlow = new THREE.PointLight(C.red, 0, 3, 1.5); handGlow.position.set(0.25, h * .55, -d / 2 - .1); g.add(handGlow);
  areas.windowHand = { hand, handGlow };
  areas.window = { ox, fig: [-0.7, 0, -1.4], rot: .45,
    cams: [{ p: [0.9, 1.5, 3.6], l: [-0.2, 1.7, -3], p2: [0.7, 1.5, 3.0] },
           { p: [-2.6, 1.2, 2.2], l: [-0.8, 1.2, -1.8], p2: [-2.3, 1.2, 1.6] },
           { p: [1.6, 2.6, 2.4], l: [0.3, 2.2, -4], p2: [1.0, 2.4, 1.6] }] };
}
// Funkkonsole
const screens = [];
{
  const ox = 30, w = 7, d = 7, h = 4;
  const g = room(ox, w, d, h, C.green, C.cyan);
  backWall(g, w, h, d, 0);
  const desk = new THREE.Mesh(new THREE.BoxGeometry(4.6, .9, 1.2), metal(0xe4e8f0, .4, .2)); desk.position.set(0, .45, -d / 2 + .9); g.add(desk);
  const top = new THREE.Mesh(new THREE.BoxGeometry(4.7, .06, 1.3), metal(0x5a6a90, .25, .9)); top.position.set(0, .93, -d / 2 + .9); g.add(top);
  const kinds = [['wave', '#45ff9a'], ['text', '#3ef0ff'], ['radar', '#ff8a3d']];
  kinds.forEach((k, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.35, .85), new THREE.MeshBasicMaterial({ map: screenTex(k[0], k[1]), toneMapped: false }));
    m.position.set((i - 1) * 1.5, 1.85, -d / 2 + .25); m.rotation.y = (1 - i) * .12; g.add(m); screens.push(m);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(1.45, .95, .06), metal(0x111827, .4, .8)); fr.position.copy(m.position); fr.position.z -= .04; fr.rotation.y = m.rotation.y; g.add(fr);
  });
  const btns = [];
  for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.14, .04, .14), neon([C.cyan, C.magenta, C.orange, C.green][i % 4], 2)); b.position.set(-1.9 + i * .29, .97, -d / 2 + 1.25); g.add(b); btns.push(b); }
  areas.console = { ox, btns, fig: [0.2, 0, -1.6], rot: -.35,
    cams: [{ p: [2.4, 1.6, 2.6], l: [0, 1.4, -2.6], p2: [1.6, 1.5, 1.9] },
           { p: [-1.9, 1.3, 1.3], l: [0.2, 1.3, -2.0], p2: [-1.6, 1.3, 0.8] },
           { p: [0, 2.8, 2.2], l: [0, 1.2, -2.6], p2: [0, 2.4, 1.2] }] };
}
// Neon-Gang
{
  const ox = 60, g = new THREE.Group(); g.position.x = ox; scene.add(g);
  for (let i = 0; i < 14; i++) {
    const z = 4 - i * 2.2;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3, .16, 6, 8), metal(0xdfe4ee, .35, .3)); ring.position.set(0, 2, z); ring.rotation.z = Math.PI / 8; g.add(ring);
    const nr = new THREE.Mesh(new THREE.TorusGeometry(2.08, .025, 6, 8), neon(i % 2 ? C.magenta : C.cyan, 3)); nr.position.set(0, 2, z); nr.rotation.z = Math.PI / 8; g.add(nr);
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.25, 2.0, 8, 1, true), new THREE.MeshStandardMaterial({ map: panelTex, side: THREE.BackSide, roughness: .5, metalness: .2, color: 0xe8ecf4 }));
    pl.rotation.x = Math.PI / 2; pl.rotation.y = Math.PI / 8; pl.position.set(0, 2, z - 1.1); g.add(pl);
  }
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 34), new THREE.MeshStandardMaterial({ map: floorTex, roughness: .3, metalness: .35 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, .12, -12); g.add(fl);
  const l1 = new THREE.PointLight(C.magenta, 7, 12, 1.5); l1.position.set(0, 3, -3); g.add(l1);
  const l2 = new THREE.PointLight(C.cyan, 7, 12, 1.5); l2.position.set(0, 3, -10); g.add(l2);
  const end = new THREE.Mesh(new THREE.CircleGeometry(1.6, 8), neon(C.red, 1.4)); end.position.set(0, 2, -26); g.add(end);
  areas.corridor = { ox, fig: [0, .12, -4.5], rot: Math.PI,
    cams: [{ p: [0.3, 1.5, 3.5], l: [0, 1.4, -8], p2: [0.2, 1.5, 1.0] },
           { p: [-1.1, 0.6, -1.5], l: [0, 1.6, -6], p2: [-0.9, 0.7, -2.4] },
           { p: [0.6, 2.6, -8.5], l: [0, 1.2, -4], p2: [0.4, 2.4, -7.5] }] };
}
// Luftschleuse
let doorGroup, beacon, beaconLight;
{
  const ox = 90, w = 7, d = 7, h = 4.4;
  const g = room(ox, w, d, h, C.orange, C.red);
  backWall(g, w, h, d, 1.6, 2.1);
  const voidLight = new THREE.PointLight(C.red, 3, 6, 1.5); voidLight.position.set(0, 2.1, -d / 2 - 1.2); g.add(voidLight);
  doorGroup = new THREE.Group(); doorGroup.position.set(0, 2.1, -d / 2 + .1); g.add(doorGroup);
  doorGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, .3, 48), metal(0x58627a, .35, .9)).rotateX(Math.PI / 2));
  const hz = new THREE.Mesh(new THREE.TorusGeometry(1.75, .12, 12, 64), new THREE.MeshStandardMaterial({ map: hazardTex, roughness: .5 })); doorGroup.add(hz);
  const win = new THREE.Mesh(new THREE.CircleGeometry(.45, 32), new THREE.MeshStandardMaterial({ color: 0x050812, roughness: .05, metalness: .2, emissive: 0x220010 })); win.position.z = .16; doorGroup.add(win);
  const wr = new THREE.Mesh(new THREE.TorusGeometry(.48, .06, 12, 48), metal(0xb0b8d0, .2, 1)); wr.position.z = .16; doorGroup.add(wr);
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const bolt = new THREE.Mesh(new THREE.BoxGeometry(.5, .12, .12), metal(0x9aa4c0, .3, 1)); bolt.position.set(Math.cos(a) * 1.3, Math.sin(a) * 1.3, .17); bolt.rotation.z = a; doorGroup.add(bolt); }
  beacon = new THREE.Mesh(new THREE.SphereGeometry(.16, 16, 12), neon(C.red, 4)); beacon.position.set(2.3, 3.6, -d / 2 + .3); g.add(beacon);
  beaconLight = new THREE.PointLight(C.red, 0, 10, 1.4); beaconLight.position.copy(beacon.position); g.add(beaconLight);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(.5, .7, .1), metal(0x222a3c)); panel.position.set(2.4, 1.5, -d / 2 + .1); g.add(panel);
  const pb = new THREE.Mesh(new THREE.BoxGeometry(.2, .2, .05), neon(C.green, 2.5)); pb.position.set(2.4, 1.5, -d / 2 + .17); g.add(pb);
  areas.airlock = { ox, fig: [-0.7, 0, -1.2], rot: -.5,
    cams: [{ p: [1.8, 1.4, 3.0], l: [-0.4, 1.8, -3], p2: [1.2, 1.5, 2.2] },
           { p: [-2.6, 1.3, 2.0], l: [-0.2, 1.6, -2.6], p2: [-2.3, 1.3, 1.4] },
           { p: [1.0, 1.5, 1.8], l: [-0.6, 1.5, -2.4], p2: [0.8, 1.6, 1.2] }] };
}
// Kabine
{
  const ox = 120, w = 6, d = 6, h = 3.6;
  const g = room(ox, w, d, h, C.purple, C.magenta);
  backWall(g, w, h, d, .7);
  const bed = new THREE.Mesh(new THREE.BoxGeometry(2.6, .5, 1.1), metal(0xe4e8f0, .5, .2)); bed.position.set(1, .25, -d / 2 + .7); g.add(bed);
  const mat = new THREE.Mesh(new THREE.BoxGeometry(2.5, .16, 1.0), new THREE.MeshStandardMaterial({ color: 0x6a5cff, roughness: .8 })); mat.position.set(1, .58, -d / 2 + .7); g.add(mat);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.12, 16, 12), neon(C.yellow, 3)); lamp.position.set(-1.8, 2.2, -d / 2 + .3); g.add(lamp);
  const ll = new THREE.PointLight(C.yellow, 3, 6, 1.5); ll.position.copy(lamp.position); g.add(ll);
  areas.bunk = { ox, fig: [0.8, 0.45, -1.9], rot: .3, sitHeight: .55,
    cams: [{ p: [-1.2, 1.3, 2.4], l: [0.6, 1.1, -2.2], p2: [-0.8, 1.3, 1.6] },
           { p: [2.4, 1.0, 0.6], l: [0.6, 1.2, -2.0], p2: [2.0, 1.1, 0.1] }] };
}
// Protokoll-Raum (dunkel, rot)
let protoLight;
{
  const ox = 150, w = 6, d = 6, h = 4;
  const g = room(ox, w, d, h, C.red, C.red);
  backWall(g, w, h, d, 0);
  protoLight = new THREE.SpotLight(C.red, 10, 12, .4, .6, 1.2); protoLight.position.set(0, 3.9, 0); protoLight.target.position.set(0, 0, -1.4); g.add(protoLight, protoLight.target);
  areas.protocol = { ox, fig: [0, 0, -1.4], rot: 0,
    cams: [{ p: [0, 1.6, 2.6], l: [0, 1.2, -1.4], p2: [0, 1.5, 1.9] }] };
}

// ------------------------------------------------------------------ Figur (3D-Strichmännchen-Astronaut)
const POSES = {
  stand: { head: [0, 330], neck: [0, 270], hip: [0, 120], le: [-55, 200], lh: [-70, 120], re: [55, 200], rh: [70, 120], lk: [-35, 60], lf: [-45, 0], rk: [35, 60], rf: [45, 0] },
  sit: { head: [0, 260], neck: [0, 200], hip: [0, 70], le: [-50, 130], lh: [-10, 110], re: [50, 130], rh: [40, 100], lk: [-40, 70], lf: [-45, -30], rk: [40, 70], rf: [45, -30] },
  crouch: { head: [-20, 200], neck: [-10, 150], hip: [10, 60], le: [-60, 110], lh: [-40, 190], re: [40, 110], rh: [-10, 195], lk: [-60, 70], lf: [-50, 0], rk: [70, 40], rf: [60, 0] },
  float: { head: [10, 330], neck: [5, 270], hip: [0, 120], le: [-80, 260], lh: [-140, 300], re: [80, 250], rh: [140, 290], lk: [-50, 50], lf: [-30, -20], rk: [45, 70], rf: [90, 20] },
  reach: { head: [20, 330], neck: [10, 270], hip: [0, 120], le: [70, 260], lh: [150, 280], re: [-40, 200], rh: [-50, 120], lk: [-30, 60], lf: [-45, 0], rk: [40, 60], rf: [50, 0] },
  lookback: { head: [-15, 330], neck: [-5, 270], hip: [0, 120], le: [-50, 190], lh: [-40, 110], re: [55, 190], rh: [30, 110], lk: [-30, 60], lf: [-50, 0], rk: [30, 60], rf: [40, 0] },
  fear: { head: [0, 300], neck: [0, 245], hip: [0, 110], le: [-70, 260], lh: [-20, 300], re: [70, 260], rh: [20, 300], lk: [-55, 55], lf: [-60, 0], rk: [55, 55], rf: [60, 0] },
  walk: { head: [10, 330], neck: [6, 270], hip: [0, 120], le: [-40, 200], lh: [-30, 125], re: [40, 200], rh: [40, 125], lk: [-25, 60], lf: [-35, 0], rk: [25, 60], rf: [35, 0] },
  knock: { head: [0, 330], neck: [0, 270], hip: [0, 120], le: [-55, 200], lh: [-70, 120], re: [70, 260], rh: [80, 330], lk: [-35, 60], lf: [-45, 0], rk: [35, 60], rf: [45, 0] },
  listen: { head: [25, 320], neck: [12, 265], hip: [0, 120], le: [60, 240], lh: [45, 320], re: [-50, 190], rh: [-45, 115], lk: [-30, 60], lf: [-45, 0], rk: [35, 60], rf: [45, 0] },
};
const S = 0.0049;
const cyl = new THREE.CylinderGeometry(1, 1, 1, 24);
const sph = new THREE.SphereGeometry(1, 28, 20);
const torsoGeo = new THREE.CapsuleGeometry(1, 2, 8, 24);   // Gesamthöhe 4
const shirtLogo = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(128, 128, 92, 0, 7); g.lineWidth = 16; g.strokeStyle = '#ffffff'; g.stroke();
  g.font = 'bold 64px sans-serif'; g.textAlign = 'center'; g.fillText('H-7', 128, 150);
});
function makeFigure(o) {
  const grp = new THREE.Group(); scene.add(grp);
  const skin = new THREE.MeshPhysicalMaterial({ color: o.skin, roughness: .45, clearcoat: .3, emissive: o.emissive || 0x000000 });
  const shirt = new THREE.MeshStandardMaterial({ color: o.shirt, roughness: .8, emissive: o.emissive || 0x000000 });
  const pants = new THREE.MeshStandardMaterial({ color: o.pants, roughness: .75, emissive: o.emissive || 0x000000 });
  const shoe = new THREE.MeshPhysicalMaterial({ color: o.shoe, roughness: .4, clearcoat: .6 });
  const sole = new THREE.MeshStandardMaterial({ color: o.sole, roughness: .6 });
  const eyeM = new THREE.MeshBasicMaterial({ color: o.eye });
  const add = (geo, mat) => { const m = new THREE.Mesh(geo, mat); grp.add(m); return m; };
  const f = { grp,
    torso: add(torsoGeo, shirt),
    logo: o.logo ? add(new THREE.PlaneGeometry(.11, .11), new THREE.MeshBasicMaterial({ map: shirtLogo, transparent: true, color: o.logoColor })) : null,
    neck: add(cyl, skin), head: add(sph, skin), eyes: [add(sph, eyeM), add(sph, eyeM)],
    arms: ['l', 'r'].map(() => ({ shoulder: add(sph, shirt), sleeve: add(cyl, shirt), upper: add(cyl, skin), elbow: add(sph, skin), lower: add(cyl, skin), hand: add(sph, skin) })),
    legs: ['l', 'r'].map(() => ({ hip: add(sph, pants), upper: add(cyl, pants), knee: add(sph, pants), lower: add(cyl, pants), shoe: add(new THREE.CapsuleGeometry(1, 1, 6, 12), shoe), sole: add(new THREE.BoxGeometry(1, 1, 1), sole) })),
    pelvis: add(new THREE.CapsuleGeometry(1, 1, 6, 16), pants),
  };
  return f;
}
const tmpV = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
function placeBone(m, a, b, r, rz) {
  tmpV.subVectors(b, a); const len = tmpV.length();
  m.position.copy(a).addScaledVector(tmpV, .5); m.scale.set(r, len, rz ?? r);
  m.quaternion.setFromUnitVectors(up, tmpV.normalize());
}
function poseFigure(f, P, t, scared) {
  // Rumpf: breite, flache Kapsel von Schultern bis Hüfte
  const chestTop = P.neck.clone().add(new THREE.Vector3(0, -.06, 0));
  const waist = P.hip.clone().add(new THREE.Vector3(0, .05, 0));
  tmpV.subVectors(chestTop, waist); const tl = tmpV.length();
  f.torso.position.copy(waist).addScaledVector(tmpV, .5);
  f.torso.scale.set(.175, Math.max(.05, tl) / 4, .105);
  f.torso.quaternion.setFromUnitVectors(up, tmpV.clone().normalize());
  if (f.logo) { f.logo.position.copy(f.torso.position).add(new THREE.Vector3(.04, .06, .102)); f.logo.quaternion.copy(f.torso.quaternion); }
  f.pelvis.position.copy(P.hip).add(new THREE.Vector3(0, .02, 0)); f.pelvis.scale.set(.085, .045, .09); f.pelvis.rotation.set(0, 0, Math.PI / 2);
  // Hals und Kopf
  const headC = P.head.clone().lerp(P.neck, .18);
  placeBone(f.neck, P.neck, headC.clone().lerp(P.neck, .5), .045);
  f.head.position.copy(headC); f.head.scale.set(.145, .155, .14);
  const es = scared ? .028 : .021;
  f.eyes.forEach((e, i) => { e.position.copy(headC).add(new THREE.Vector3((i ? 1 : -1) * .05, .02, .128)); e.scale.set(es, es * (1.25 + .15 * Math.sin(t * 4 + i)), es * .6);
    if (Math.sin(t * 2.3) > .985) e.scale.y = es * .15; });   // Blinzeln
  // Arme
  ['l', 'r'].forEach((side, i) => {
    const A = f.arms[i], sh = P[side + 's'], el = P[side + 'e'], ha = P[side + 'h'];
    A.shoulder.position.copy(sh); A.shoulder.scale.setScalar(.062);
    placeBone(A.upper, sh, el, .042);
    const sleeveEnd = sh.clone().lerp(el, .55); placeBone(A.sleeve, sh, sleeveEnd, .06);
    A.elbow.position.copy(el); A.elbow.scale.setScalar(.042);
    placeBone(A.lower, el, ha, .038);
    A.hand.position.copy(ha); A.hand.scale.set(.052, .058, .045);
  });
  // Beine
  ['l', 'r'].forEach((side, i) => {
    const L = f.legs[i], hp = P[side + 'p'], kn = P[side + 'k'], ft = P[side + 'f'];
    L.hip.position.copy(hp); L.hip.scale.setScalar(.066);
    placeBone(L.upper, hp, kn, .062); L.knee.position.copy(kn); L.knee.scale.setScalar(.056);
    const ankle = ft.clone().add(new THREE.Vector3(0, .05, 0));
    placeBone(L.lower, kn, ankle, .054);
    L.shoe.position.copy(ft).add(new THREE.Vector3(0, .045, .045)); L.shoe.scale.set(.055, .055, .05); L.shoe.rotation.set(Math.PI / 2, 0, 0);
    L.sole.position.copy(ft).add(new THREE.Vector3(0, .008, .045)); L.sole.scale.set(.11, .022, .2);
  });
}
const fig = makeFigure({ skin: 0xf3e3d3, shirt: 0x1aa6a0, pants: 0x27324d, shoe: 0xffffff, sole: 0xff7a2e, eye: 0x111111, logo: true, logoColor: 0xffffff });
const twin = makeFigure({ skin: 0x15161c, shirt: 0x0c1012, pants: 0x0a0c10, shoe: 0x111111, sole: 0x220000, eye: 0xff2030, emissive: 0x050000 });
twin.eyes.forEach(e => e.material.color.setRGB(4, .3, .4));
const shadow = new THREE.Mesh(new THREE.CircleGeometry(.5, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .35, depthWrite: false }));
shadow.rotation.x = -Math.PI / 2; scene.add(shadow);
const figLight = new THREE.SpotLight(0xfff2e0, 6, 9, .45, .7, 1.3); scene.add(figLight, figLight.target);

function poseJoints(name, t, prevName, blend) {
  const A = POSES[prevName] || POSES.stand, B = POSES[name] || POSES.stand, out = {};
  for (const k in B) out[k] = [A[k][0] + (B[k][0] - A[k][0]) * blend, A[k][1] + (B[k][1] - A[k][1]) * blend];
  const breathe = Math.sin(t * 2.4) * 3;
  for (const k of ['head', 'neck', 'le', 're', 'lh', 'rh']) out[k][1] += breathe;
  if (name === 'walk') { const s = Math.sin(t * 6); out.lf[0] += s * 40; out.rf[0] -= s * 40; out.lk[0] += s * 20; out.rk[0] -= s * 20; out.lh[0] -= s * 25; out.rh[0] += s * 25; }
  if (name === 'knock') { const k = Math.max(0, Math.sin(t * 9)); out.rh[0] += k * 30; }
  if (name === 'fear') { const j = Math.sin(t * 31) * 4; out.head[0] += j; out.lh[0] += j; out.rh[0] -= j; }
  out.lh[1] += Math.sin(t * 1.7) * 4; out.rh[1] += Math.sin(t * 1.9 + 1) * 4;
  // Schultern und Hüftgelenke (breiterer Körper)
  out.ls = [out.neck[0] - 50, out.neck[1] - 16]; out.rs = [out.neck[0] + 50, out.neck[1] - 16];
  out.lp = [out.hip[0] - 24, out.hip[1] - 4]; out.rp = [out.hip[0] + 24, out.hip[1] - 4];
  // Ellbogen/Hände etwas nach außen, passend zu den breiteren Schultern
  for (const k of ['le', 'lh']) out[k][0] -= 10; for (const k of ['re', 'rh']) out[k][0] += 10;
  return out;
}
function jointsToVec(J) {
  const P = {}; const zoff = { le: -.06, lh: -.04, lk: -.03, lf: -.02, re: .06, rh: .04, rk: .03, rf: .02 };
  for (const k in J) P[k] = new THREE.Vector3(J[k][0] * S, J[k][1] * S, zoff[k] || 0);
  return P;
}
function updateFigure(area, beat, t, tIn, prevPose) {
  const a = areas[area];
  const pose = beat.pose || 'stand';
  const blend = Math.min(1, tIn / .35); const e = blend * blend * (3 - 2 * blend);
  const J = poseJoints(pose, t, prevPose, e);
  let floatY = 0; if (pose === 'float') floatY = .25 + Math.sin(t * 1.3) * .12;
  const base = new THREE.Vector3(a.ox + a.fig[0], a.fig[1] + floatY + (pose === 'sit' && !a.sitHeight ? .3 : 0), a.fig[2]);
  if (pose === 'walk') base.z -= tIn * .35;
  fig.grp.position.copy(base); fig.grp.rotation.set(0, (a.rot || 0) * (beat.facing || 1), pose === 'float' ? Math.sin(t * .9) * .15 : 0);
  poseFigure(fig, jointsToVec(J), t, pose === 'fear');
  // Doppelgänger: steht hinter der Figur, gleiche Pose, leicht verzögert
  twin.grp.visible = !!beat.twin;
  if (beat.twin) {
    const Jt = poseJoints(beat.twin_pose || 'stand', t - .4, beat.twin_pose || 'stand', 1);
    const off = a.twin || [-.9, 0, -1.1];
    twin.grp.position.set(base.x + off[0], (a.fig[1] || 0) + off[1], base.z + off[2]);
    twin.grp.rotation.set(0, (a.rot || 0) + .3, 0);
    poseFigure(twin, jointsToVec(Jt), t, false);
    const appear = Math.min(1, tIn / .6);
    twin.grp.scale.setScalar(.98 + .02 * appear);
  }
  const wp = new THREE.Vector3(); fig.grp.getWorldPosition(wp);
  shadow.position.set(wp.x, (a.fig[1] || 0) + .015, wp.z); shadow.scale.setScalar(1 - floatY * .8);
  figLight.position.set(wp.x + .8, 4, wp.z + 2.2); figLight.target.position.set(wp.x, 1, wp.z);
}

// ------------------------------------------------------------------ Partikel (Staub im Licht)
const dust = (() => {
  const r = rng(5), pos = [];
  for (let i = 0; i < 600; i++) pos.push((r() - .5) * 8, r() * 4, (r() - .5) * 8);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(0xffe0b0), size: .02, transparent: true, opacity: .7, depthWrite: false }));
  scene.add(p); return p;
})();

// ------------------------------------------------------------------ Overlays
const $ = id => document.getElementById(id);
let TL = null;
function setHud(b) {
  $('hDay').textContent = 'DAY ' + b.day; $('hTime').innerHTML = b.time + '<small>UTC</small>';
  $('hO2').textContent = b.oxygen + '%'; $('hCrew').textContent = b.crew;
  $('hO2').style.color = b.oxygen < 60 ? '#ff3b5c' : '#3ef0ff';
}
function setCaption(t) {
  const c = TL.captions.find(c => t >= c.start && t < c.end);
  const el = $('caption');
  if (!c) { el.innerHTML = ''; return; }
  const hl = new Set((c.highlight || []).map(s => s.toLowerCase()));
  el.innerHTML = c.words.map(w => { const k = w.replace(/[^\w']/g, '').toLowerCase(); return hl.has(k) ? `<span class="${c.alt ? 'hl2' : 'hl'}">${w}</span>` : w; }).join(' ');
  const age = t - c.start, s = age < .09 ? .82 + age / .09 * .23 : (age < .16 ? 1.05 - (age - .09) / .07 * .05 : 1);
  el.style.transform = `scale(${s})`;
  el.style.fontSize = (c.words.join(' ').length > 14 ? 92 : 118) + 'px';
}
function setChat(beat, tIn) {
  const el = $('chat');
  if (!beat.chat) { el.style.opacity = 0; return; }
  el.style.opacity = Math.min(1, tIn / .2);
  el.style.transform = `translateY(${(1 - Math.min(1, tIn / .25)) * 40}px)`;
  if (beat.chat_sub) $('chatSub').textContent = beat.chat_sub;
  $('msgs').innerHTML = beat.chat.filter(m => tIn >= (m.at || 0)).map(m => {
    const a = Math.min(1, (tIn - (m.at || 0)) / .2);
    return `<div class="msg ${m.from === 'me' ? 'me' : 'them'}" style="opacity:${a};transform:scale(${.9 + .1 * a})">${m.text}</div>`;
  }).join('');
}
function setTag(beat, tIn) {
  const el = $('tag');
  if (!beat.tag) { el.style.opacity = 0; return; }
  $('tagText').textContent = beat.tag;
  const s = Math.min(1, tIn / .14);
  el.style.opacity = s; el.style.transform = `scale(${1.6 - .6 * s})`;
}

// ------------------------------------------------------------------ Steuerung
window.setup = (timeline) => {
  TL = timeline;
  $('sPart').textContent = 'PART ' + TL.part;
  TL.beats.forEach((b, i) => { b._cam = b.cam != null ? b.cam : i % areas[b.scene || 'window'].cams.length; });
  return true;
};

window.renderAt = (t) => {
  const bi = Math.max(0, TL.beats.findIndex(b => t < b.end));
  const k = bi === -1 ? TL.beats.length - 1 : bi;
  const beat = TL.beats[k], prev = TL.beats[k - 1];
  const tIn = t - beat.start, dur = beat.end - beat.start;
  const area = beat.scene || 'window', A = areas[area];

  // Kamera: langsame Fahrt innerhalb des Beats, leichtes Wackeln
  const cp = A.cams[beat._cam % A.cams.length];
  const u = Math.min(1, tIn / Math.max(.5, dur)); const ue = 1 - Math.pow(1 - u, 2);
  const p = new THREE.Vector3(...cp.p).lerp(new THREE.Vector3(...(cp.p2 || cp.p)), ue); p.x += A.ox;
  const shake = beat.alarm ? .035 : .008;
  p.x += Math.sin(t * 7.1) * shake + Math.sin(t * 1.3) * .02; p.y += Math.sin(t * 6.3 + 1) * shake + Math.sin(t * 1.1) * .015;
  camera.position.copy(p);
  camera.lookAt(new THREE.Vector3(cp.l[0] + A.ox, cp.l[1], cp.l[2]));
  camera.fov = 56 - ue * 4; camera.updateProjectionMatrix();

  updateFigure(area, beat, t, tIn, prev && prev.scene === beat.scene ? prev.pose : beat.pose);

  // Animierte Elemente
  earth.rotation.y = 2.2 + t * .02; clouds.rotation.y = t * .012;
  updateMeteors(t, A.ox);
  screens.forEach((s, i) => s.material.color.setScalar(.55 + .12 * Math.sin(t * 5 + i * 2)));
  areas.console.btns.forEach((b, i) => b.visible = Math.sin(t * 4 + i * 1.7) > -.2);
  const knock = beat.knock ? Math.max(0, Math.sin(tIn * Math.PI * 2 / .55)) ** 8 : 0;
  doorGroup.position.z = -3.4 + knock * .05;
  const open = beat.door_open ? Math.min(1, Math.max(0, (tIn - .3) / Math.max(.8, dur - .6))) : 0;
  doorGroup.position.x = -open * 3.4; doorGroup.rotation.z = -open * 1.2;
  const alarmOn = beat.alarm && Math.sin(t * 9) > 0;
  beacon.material.color.setScalar(alarmOn ? 4 : .4).multiply(new THREE.Color(C.red));
  beaconLight.intensity = alarmOn ? 9 : 0;
  protoLight.intensity = 8 + 4 * Math.sin(t * 3);
  dust.position.set(A.ox, 0, -1); dust.rotation.y = t * .02; dust.position.y = Math.sin(t * .3) * .1;
  scene.fog.color.set(beat.alarm ? 0x2a0a14 : 0x1a1830);

  const wh = areas.windowHand; wh.hand.visible = !!beat.hand; wh.handGlow.intensity = beat.hand ? 4 + 2 * Math.sin(t * 6) : 0;
  if (beat.hand) wh.hand.position.z = -4.45 + Math.min(1, tIn / .3) * .3;
  renderer.toneMappingExposure = beat.dark ? .6 : .9;
  // Overlays
  setHud(beat); setCaption(t); setChat(beat, tIn); setTag(beat, tIn);
  $('alarm').style.opacity = beat.alarm ? (.35 + .45 * Math.max(0, Math.sin(t * 9))) : 0;
  const sinceCut = tIn; const cut = prev && (prev.scene !== beat.scene);
  $('flash').style.opacity = cut ? Math.max(0, .55 - sinceCut * 3.5) : (k === 0 ? Math.max(0, 1 - t * 2.5) : 0);
  if (k === 0 && t < .4) { $('flash').style.background = '#000'; } else { $('flash').style.background = '#fff'; }
  const teaserOn = t > TL.duration - 1.6;
  $('teaser').style.opacity = teaserOn ? Math.min(1, (t - (TL.duration - 1.6)) / .25) : 0;
  $('teaser').textContent = `PART ${TL.part + 1} →`;
  document.body.style.opacity = Math.min(1, (TL.duration - t) / .45);

  composer.render();
  return true;
};
window.ready = true;
