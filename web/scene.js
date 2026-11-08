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
scene.fog = new THREE.FogExp2(0x0a0820, 0.035);
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
  g.fillStyle = '#1a2236'; g.fillRect(0, 0, w, h);
  const r = rng(4);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 2; x++) {
    const px = x * 256 + 10, py = y * 128 + 10;
    const v = 30 + Math.floor(r() * 18);
    g.fillStyle = `rgb(${v},${v + 8},${v + 26})`; g.fillRect(px, py, 236, 108);
    g.strokeStyle = 'rgba(120,170,255,.18)'; g.lineWidth = 3; g.strokeRect(px, py, 236, 108);
    g.fillStyle = 'rgba(160,200,255,.25)'; for (let k = 0; k < 4; k++) g.fillRect(px + 12 + k * 8, py + 12, 4, 4);
  }
}, [3, 2]);
const floorTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#141826'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(90,140,220,.35)'; g.lineWidth = 4;
  for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
  g.fillStyle = 'rgba(62,240,255,.12)'; for (let i = 0; i < 8; i++) g.fillRect(i * 64 + 26, 26, 12, 12);
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
const earthTex = canvasTex(1024, 512, (g, w, h) => {
  g.fillStyle = '#0b3a8a'; g.fillRect(0, 0, w, h);
  const r = rng(7);
  for (let i = 0; i < 70; i++) { const x = r() * w, y = h * .15 + r() * h * .7, s = 20 + r() * 90;
    g.fillStyle = r() > .5 ? '#2f8f4e' : '#a0864a'; g.beginPath(); g.ellipse(x, y, s, s * .6, r() * 3, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 120; i++) { g.beginPath(); g.ellipse(r() * w, r() * h, 30 + r() * 80, 6 + r() * 10, r(), 0, 7); g.fill(); }
});
const earth = new THREE.Mesh(new THREE.SphereGeometry(9, 64, 32), new THREE.MeshStandardMaterial({ map: earthTex, roughness: .9, emissive: 0x0a2050, emissiveIntensity: .4 }));
earth.material.fog = false;
const earthGlow = new THREE.Mesh(new THREE.SphereGeometry(9.8, 48, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x4aa8ff).multiplyScalar(1.6), transparent: true, opacity: .25, side: THREE.BackSide, fog: false }));
const sun = new THREE.DirectionalLight(0xfff0dd, 1.6); sun.position.set(30, 20, 10);
scene.add(sun);
scene.add(new THREE.HemisphereLight(0x5a6cff, 0x3a1050, 1.1));

// ------------------------------------------------------------------ Räume
const areas = {};
function room(ox, w, d, h, accentA, accentB) {
  const g = new THREE.Group(); g.position.set(ox, 0, 0); scene.add(g);
  const wallM = new THREE.MeshStandardMaterial({ map: panelTex, roughness: .6, metalness: .55, color: 0x9fb4d8 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: floorTex, roughness: .35, metalness: .8 }));
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
  const hemi = new THREE.PointLight(accentA, 9, 16, 1.4); hemi.position.set(-w / 3, h - .4, 0); g.add(hemi);
  const hemi2 = new THREE.PointLight(accentB, 9, 16, 1.4); hemi2.position.set(w / 3, h - .4, -1); g.add(hemi2);
  return g;
}
function backWall(g, w, h, d, holeR) {
  const shape = new THREE.Shape(); shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0); shape.lineTo(w / 2, h); shape.lineTo(-w / 2, h);
  if (holeR) { const hole = new THREE.Path(); hole.absarc(0, h * .55, holeR, 0, Math.PI * 2, true); shape.holes.push(hole); }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: .3, bevelEnabled: false });
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2, uv.getY(i) / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: panelTex, roughness: .6, metalness: .55, color: 0x9fb4d8 }));
  m.position.z = -d / 2 - .3; g.add(m); return m;
}

// Fenster mit Erde
{
  const ox = 0, w = 7, d = 8, h = 4.2;
  const g = room(ox, w, d, h, C.cyan, C.magenta);
  backWall(g, w, h, d, 1.55);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, .14, 16, 64), metal(0x8090b0, .3, .9)); ring.position.set(0, h * .55, -d / 2 + .02); g.add(ring);
  const ringN = new THREE.Mesh(new THREE.TorusGeometry(1.78, .03, 8, 96), neon(C.cyan, 3)); ringN.position.copy(ring.position); g.add(ringN);
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; const b = new THREE.Mesh(new THREE.SphereGeometry(.06, 12, 8), metal(0xc0c8e0, .2, 1)); b.position.set(Math.cos(a) * 1.6, h * .55 + Math.sin(a) * 1.6, -d / 2 + .15); g.add(b); }
  earth.position.set(ox + 5, 0.5, -42); earthGlow.position.copy(earth.position); scene.add(earth, earthGlow);
  const crate = new THREE.Mesh(new THREE.BoxGeometry(.8, .6, .6), metal(0x3a4660, .5, .6)); crate.position.set(2.4, .3, -2.5); g.add(crate);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(.82, .08, .62), new THREE.MeshStandardMaterial({ map: hazardTex })); stripe.position.set(2.4, .5, -2.5); g.add(stripe);
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
  const desk = new THREE.Mesh(new THREE.BoxGeometry(4.6, .9, 1.2), metal(0x2c3650, .4, .7)); desk.position.set(0, .45, -d / 2 + .9); g.add(desk);
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
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3, .16, 6, 8), metal(0x3a4766, .4, .8)); ring.position.set(0, 2, z); ring.rotation.z = Math.PI / 8; g.add(ring);
    const nr = new THREE.Mesh(new THREE.TorusGeometry(2.08, .025, 6, 8), neon(i % 2 ? C.magenta : C.cyan, 3)); nr.position.set(0, 2, z); nr.rotation.z = Math.PI / 8; g.add(nr);
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.25, 2.0, 8, 1, true), new THREE.MeshStandardMaterial({ map: panelTex, side: THREE.BackSide, roughness: .6, metalness: .6, color: 0x7f92b8 }));
    pl.rotation.x = Math.PI / 2; pl.rotation.y = Math.PI / 8; pl.position.set(0, 2, z - 1.1); g.add(pl);
  }
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 34), new THREE.MeshStandardMaterial({ map: floorTex, roughness: .3, metalness: .85 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, .12, -12); g.add(fl);
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
  backWall(g, w, h, d, 0);
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
  areas.airlock = { ox, fig: [-1.4, 0, -1.4], rot: -.6,
    cams: [{ p: [1.8, 1.4, 3.0], l: [-0.4, 1.8, -3], p2: [1.2, 1.5, 2.2] },
           { p: [-2.6, 1.1, 0.4], l: [0, 2, -3.2], p2: [-2.2, 1.2, -0.2] },
           { p: [0.6, 1.6, 0.6], l: [-0.5, 1.7, -3.2], p2: [0.4, 1.7, 0.0] }] };
}
// Kabine
{
  const ox = 120, w = 6, d = 6, h = 3.6;
  const g = room(ox, w, d, h, C.purple, C.magenta);
  backWall(g, w, h, d, .7);
  const bed = new THREE.Mesh(new THREE.BoxGeometry(2.6, .5, 1.1), metal(0x2e3550, .5, .5)); bed.position.set(1, .25, -d / 2 + .7); g.add(bed);
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
  protoLight = new THREE.SpotLight(C.red, 18, 12, .5, .6, 1.2); protoLight.position.set(0, 3.9, 0); protoLight.target.position.set(0, 0, -1.4); g.add(protoLight, protoLight.target);
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
const S = 0.0055;
const fig = new THREE.Group(); scene.add(fig);
const white = new THREE.MeshPhysicalMaterial({ color: 0xc9d0e0, roughness: .35, metalness: .05, clearcoat: .8, clearcoatRoughness: .2 });
const suit = new THREE.MeshPhysicalMaterial({ color: 0xe8601c, roughness: .4, metalness: .1, clearcoat: .5 });
const visorM = new THREE.MeshPhysicalMaterial({ color: 0x0a1630, roughness: .05, metalness: .6, emissive: new THREE.Color(C.cyan), emissiveIntensity: .9, clearcoat: 1 });
const cyl = new THREE.CylinderGeometry(1, 1, 1, 20);
const sph = new THREE.SphereGeometry(1, 24, 16);
const bones = [['neck', 'hip', .075, suit], ['neck', 'le', .042, white], ['le', 'lh', .038, white], ['neck', 're', .042, white], ['re', 'rh', .038, white],
               ['hip', 'lk', .048, white], ['lk', 'lf', .044, white], ['hip', 'rk', .048, white], ['rk', 'rf', .044, white]];
const boneMeshes = bones.map(b => { const m = new THREE.Mesh(cyl, b[3]); fig.add(m); return m; });
const jointNames = ['neck', 'hip', 'le', 'lh', 're', 'rh', 'lk', 'lf', 'rk', 'rf'];
const jointMeshes = Object.fromEntries(jointNames.map(n => { const m = new THREE.Mesh(sph, n === 'hip' || n === 'neck' ? suit : white); fig.add(m); return [n, m]; }));
const head = new THREE.Mesh(sph, white); fig.add(head);
const visor = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, Math.PI * .08, Math.PI * .84, Math.PI * .28, Math.PI * .42), visorM); fig.add(visor);
const pack = new THREE.Mesh(new THREE.BoxGeometry(.24, .32, .14), metal(0xd8dcea, .35, .4)); fig.add(pack);
const packLed = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, .02), neon(C.green, 3)); fig.add(packLed);
const shadow = new THREE.Mesh(new THREE.CircleGeometry(.55, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .45, depthWrite: false }));
shadow.rotation.x = -Math.PI / 2; scene.add(shadow);
const figLight = new THREE.SpotLight(0xfff2e0, 7, 9, .45, .7, 1.3); scene.add(figLight, figLight.target);

const tmpV = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
function placeBone(m, a, b, r) {
  tmpV.subVectors(b, a); const len = tmpV.length();
  m.position.copy(a).addScaledVector(tmpV, .5); m.scale.set(r, len, r);
  m.quaternion.setFromUnitVectors(up, tmpV.normalize());
}
function poseJoints(name, t, prevName, blend) {
  const A = POSES[prevName] || POSES.stand, B = POSES[name] || POSES.stand, out = {};
  for (const k in B) out[k] = [A[k][0] + (B[k][0] - A[k][0]) * blend, A[k][1] + (B[k][1] - A[k][1]) * blend];
  const breathe = Math.sin(t * 2.4) * 3;
  for (const k of ['head', 'neck', 'le', 're', 'lh', 'rh']) out[k][1] += breathe;
  if (name === 'walk') { const s = Math.sin(t * 6); out.lf[0] += s * 40; out.rf[0] -= s * 40; out.lk[0] += s * 20; out.rk[0] -= s * 20; out.lh[0] -= s * 25; out.rh[0] += s * 25; }
  if (name === 'knock') { const k = Math.max(0, Math.sin(t * 9)); out.rh[0] += k * 30; }
  if (name === 'fear') { const j = Math.sin(t * 31) * 4; out.head[0] += j; out.lh[0] += j; out.rh[0] -= j; }
  out.lh[1] += Math.sin(t * 1.7) * 4; out.rh[1] += Math.sin(t * 1.9 + 1) * 4;
  return out;
}
function updateFigure(area, beat, t, tIn, prevPose) {
  const a = areas[area];
  const pose = beat.pose || 'stand';
  const blend = Math.min(1, tIn / .35); const e = blend * blend * (3 - 2 * blend);
  const J = poseJoints(pose, t, prevPose, e);
  let floatY = 0; if (pose === 'float') floatY = .25 + Math.sin(t * 1.3) * .12;
  const base = new THREE.Vector3(a.ox + a.fig[0], a.fig[1] + floatY + (pose === 'sit' && !a.sitHeight ? .35 : 0), a.fig[2]);
  if (pose === 'walk') base.z -= tIn * .35;
  fig.position.copy(base); fig.rotation.set(0, (a.rot || 0) * (beat.facing || 1), pose === 'float' ? Math.sin(t * .9) * .15 : 0);
  const P = {}; const zoff = { le: -.08, lh: -.06, lk: -.05, lf: -.04, re: .08, rh: .06, rk: .05, rf: .04 };
  for (const k in J) P[k] = new THREE.Vector3(J[k][0] * S, J[k][1] * S, zoff[k] || 0);
  bones.forEach((b, i) => placeBone(boneMeshes[i], P[b[0]], P[b[1]], b[2]));
  for (const n of jointNames) { jointMeshes[n].position.copy(P[n]); const r = n === 'hip' ? .08 : n === 'neck' ? .08 : (n === 'lf' || n === 'rf') ? .06 : (n === 'lh' || n === 'rh') ? .055 : .048; jointMeshes[n].scale.setScalar(r); }
  head.position.copy(P.head); head.scale.setScalar(.17);
  visor.position.copy(P.head).add(new THREE.Vector3(0, .01, .015)); visor.scale.setScalar(.175);
  pack.position.copy(P.neck).lerp(P.hip, .35).add(new THREE.Vector3(0, 0, -.14));
  packLed.position.copy(pack.position).add(new THREE.Vector3(.06, .08, -.075));
  visorM.emissiveIntensity = .7 + .3 * Math.sin(t * 3);
  const wp = new THREE.Vector3(); fig.getWorldPosition(wp);
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
  earth.rotation.y = t * .03;
  screens.forEach((s, i) => s.material.color.setScalar(.55 + .12 * Math.sin(t * 5 + i * 2)));
  areas.console.btns.forEach((b, i) => b.visible = Math.sin(t * 4 + i * 1.7) > -.2);
  const knock = beat.knock ? Math.max(0, Math.sin(tIn * Math.PI * 2 / .55)) ** 8 : 0;
  doorGroup.position.z = -3.4 + knock * .05;
  const alarmOn = beat.alarm && Math.sin(t * 9) > 0;
  beacon.material.color.setScalar(alarmOn ? 4 : .4).multiply(new THREE.Color(C.red));
  beaconLight.intensity = alarmOn ? 9 : 0;
  protoLight.intensity = 14 + 6 * Math.sin(t * 3);
  dust.position.set(A.ox, 0, -1); dust.rotation.y = t * .02; dust.position.y = Math.sin(t * .3) * .1;
  scene.fog.color.set(beat.alarm ? 0x200810 : 0x0a0820);

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
