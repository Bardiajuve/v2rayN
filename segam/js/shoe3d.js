/* Procedural 3D sneaker — built entirely from code (no model files).
   Drop a real model at models/shoe.glb to override it (see home3d.js). */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const L = 3.2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

function spline(pts) {
  const n = pts.length;
  const m = pts.map((p, i) => i === 0 ? (pts[1][1] - pts[0][1]) / (pts[1][0] - pts[0][0]) : i === n - 1 ? (pts[n - 1][1] - pts[n - 2][1]) / (pts[n - 1][0] - pts[n - 2][0]) : (pts[i + 1][1] - pts[i - 1][1]) / (pts[i + 1][0] - pts[i - 1][0]));
  return x => {
    if (x <= pts[0][0]) return pts[0][1]; if (x >= pts[n - 1][0]) return pts[n - 1][1];
    let i = 1; while (x > pts[i][0]) i++;
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], h = x1 - x0, t = (x - x0) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * m[i - 1] + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * m[i];
  };
}

/* ---------- shape functions (t: 0 heel → 1 toe) ---------- */
const wBase = spline([[0, .30], [.08, .40], [.25, .42], [.42, .37], [.6, .50], [.78, .56], [.92, .51], [1, .40]]);
const cap = t => { const a = clamp(t / .09), b = clamp((1 - t) / .17); return Math.sqrt(1 - (1 - a) * (1 - a)) * Math.sqrt(1 - (1 - b) * (1 - b)); };
const W = t => wBase(t) * cap(t);
const xOf = t => -L / 2 + t * L;
const bend = t => .24 * Math.pow(sstep(.58, 1, t), 1.5) + .05 * (1 - sstep(0, .2, t));
const gapF = t => Math.max(0, spline([[0, .50], [.15, .56], [.3, .52], [.45, .38], [.58, .22], [.67, 0], [1, 0]])(t));
const hHigh = spline([[0, 1.28], [.12, 1.34], [.28, 1.22], [.42, .98], [.55, .78], [.7, .60], [.85, .50], [.95, .36], [1, .12]]);
const hLow = spline([[0, .95], [.12, .98], [.28, .90], [.42, .78], [.55, .70], [.7, .58], [.85, .48], [.95, .35], [1, .12]]);
const yb = t => .36 + bend(t);

/* ---------- geometry helpers ---------- */
function grid(nu, nv, fn) {
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3), uv = new Float32Array((nu + 1) * (nv + 1) * 2), idx = [], o = new THREE.Vector3();
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    fn(i / nu, j / nv, o); const k = i * (nv + 1) + j;
    pos[k * 3] = o.x; pos[k * 3 + 1] = o.y; pos[k * 3 + 2] = o.z; uv[k * 2] = i / nu; uv[k * 2 + 1] = j / nv;
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + 1, c = a + nv + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function loft({ y0, y1, k = 1, n = 6, nt = 100, na = 44 }) {
  const e = 2 / n;
  return grid(nt, na, (u, v, out) => {
    const t = .5 - .5 * Math.cos(Math.PI * u), a = v * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    out.set(xOf(t), (y0 + y1) / 2 + (y1 - y0) / 2 * Math.sign(s) * Math.pow(Math.abs(s), e) + bend(t), W(t) * k * Math.sign(c) * Math.pow(Math.abs(c), e));
  });
}
function sidePoint(t, phi, off, high, sign, out) {
  const wb = W(t) * .97, f = gapF(t), zr = f * wb, yr = lerp(hLow(t), hHigh(t), high);
  const A = wb - zr, B = yr, c = Math.cos(phi), s = Math.sin(phi);
  let z = zr + A * c, y = B * s;
  if (off) { let nz = c / Math.max(A, 1e-3), ny = s / Math.max(B, 1e-3); const l = Math.hypot(nz, ny) || 1; z += off * nz / l; y += off * ny / l; }
  out.set(xOf(t), y + yb(t), sign * z);
}
function sideSurface(t0, t1, p0, p1, off, high, nt = 70, np = 16) {
  const mk = sign => grid(nt, np, (u, v, o) => sidePoint(lerp(t0, t1, .5 - .5 * Math.cos(Math.PI * u)), lerp(p0, p1, v), off, high, sign, o));
  return mergeGeometries([mk(1), mk(-1)]);
}
function rimCurve(high, sign, t0 = .03, t1 = .67, N = 36) {
  const pts = []; for (let i = 0; i <= N; i++) { const t = lerp(t0, t1, i / N), wb = W(t) * .97; pts.push(new THREE.Vector3(xOf(t), lerp(hLow(t), hHigh(t), high) + yb(t), sign * gapF(t) * wb)); }
  return new THREE.CatmullRomCurve3(pts);
}
function stripes(high) {
  const geos = [];
  for (const sign of [1, -1]) for (let k = 0; k < 3; k++) {
    const tb = .50 + k * .082;
    geos.push(grid(40, 3, (u, v, o) => {
      const s = u, q = v * 2 - 1, tc = tb - s * .115 + q * .017, phi = .1 + s * 1.05;
      sidePoint(clamp(tc, .02, .98), phi, .016, high, sign, o);
    }));
  }
  return mergeGeometries(geos);
}

/* ---------- textures ---------- */
function noiseTex(rep = [14, 5], contrast = 1) {
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"), d = g.createImageData(128, 128);
  for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (Math.random() - .5) * 120 * contrast; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); g.filter = "blur(.8px)"; g.drawImage(c, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); return t;
}

/* ---------- the shoe ---------- */
export function createShoe({ color = "#2f86d0", high = 1 } = {}) {
  const root = new THREE.Group(), inner = new THREE.Group(); root.add(inner);
  inner.position.y = -lerp(.45, .65, high);
  const bump = noiseTex([16, 5]), bump2 = noiseTex([30, 10], .7);

  const mats = {
    upper: new THREE.MeshPhysicalMaterial({ color, roughness: .5, metalness: 0, clearcoat: .35, clearcoatRoughness: .45, bumpMap: bump, bumpScale: .6, side: THREE.DoubleSide, envMapIntensity: .55 }),
    tongue: new THREE.MeshPhysicalMaterial({ color, roughness: .75, bumpMap: bump, bumpScale: .5, side: THREE.DoubleSide }),
    over: new THREE.MeshPhysicalMaterial({ color: "#f2f2ee", roughness: .42, clearcoat: .4, side: THREE.DoubleSide, bumpMap: bump2, bumpScale: .4 }),
    lace: new THREE.MeshStandardMaterial({ color: "#f4f4f0", roughness: .85 }),
    mid: new THREE.MeshPhysicalMaterial({ color: "#efece4", roughness: .55, clearcoat: .15 }),
    line: new THREE.MeshStandardMaterial({ color: "#b9e02c", roughness: .5, emissive: "#d4ff3a", emissiveIntensity: .08 }),
    out: new THREE.MeshStandardMaterial({ color: "#16181c", roughness: .85, bumpMap: bump2, bumpScale: 1.4 }),
    insole: new THREE.MeshStandardMaterial({ color: "#e9e6de", roughness: .9 }),
    air: new THREE.MeshPhysicalMaterial({ color: "#7fc8ff", roughness: .08, transmission: 0, transparent: true, opacity: .62, emissive: "#2f86d0", emissiveIntensity: .35, clearcoat: 1 })
  };
  const mesh = (g, m) => { const x = new THREE.Mesh(g, m); return x; };

  /* layers */
  const outsole = mesh(loft({ y0: 0, y1: .11, k: .985, n: 9 }), mats.out);
  const midBody = mesh(loft({ y0: .09, y1: .39, k: 1.05, n: 5 }), mats.mid);
  const midLine = mesh(loft({ y0: .19, y1: .22, k: 1.07, n: 5 }), mats.line);
  const midsole = new THREE.Group(); midsole.add(midBody, midLine);
  const insole = mesh(loft({ y0: .385, y1: .415, k: .9, n: 8 }), mats.insole);

  const air = new THREE.Group();
  const bladder = mesh(new THREE.SphereGeometry(1, 28, 20), mats.air); bladder.scale.set(.55, .09, .3); bladder.position.set(xOf(.17), .31 + bend(.17), 0); air.add(bladder);
  for (const sg of [1, -1]) { const w = mesh(new THREE.CapsuleGeometry(.085, .5, 8, 16), mats.air); w.rotation.z = Math.PI / 2; w.position.set(xOf(.17), .24 + bend(.17), sg * W(.17) * 1.03); w.scale.set(1, 1, .6); air.add(w); }

  const upper = new THREE.Group();
  const upperMesh = mesh(sideSurface(.0005, .9995, 0, Math.PI / 2, 0, high, 110, 22), mats.upper); upper.add(upperMesh);
  upper.add(mesh(sideSurface(.03, .24, 0, .62, .012, high, 30, 10), mats.over));                 // heel counter
  upper.add(mesh(sideSurface(.87, .9975, 0, Math.PI / 2, .012, high, 24, 14), mats.over));         // toe cap
  upper.add(mesh(stripes(high), mats.over));                                                       // 3 stripes = 3 gaam
  for (const sg of [1, -1]) upper.add(mesh(new THREE.TubeGeometry(rimCurve(high, sg), 80, .052, 10, false), mats.over));
  const hs = lerp(.62, 1, high);
  const tc = new THREE.CatmullRomCurve3([[.65, .56], [.54, .88], [.43, 1.24], [.36, 1.65]].map(([t, y]) => new THREE.Vector3(xOf(t), yb(t) + y * hs, 0)));
  const tongue = mesh(grid(30, 10, (u, v, o) => { const p = tc.getPoint(u), hw = lerp(.26, .34, u), zz = (v * 2 - 1) * hw; o.set(p.x, p.y - .9 * zz * zz, zz); }), mats.tongue); upper.add(tongue);
  const pull = mesh(new THREE.BoxGeometry(.06, .26, .13), mats.over); pull.position.set(xOf(.0) - .02, lerp(hLow(0), hHigh(0), high) + yb(0) - .02, 0); upper.add(pull);

  const laces = new THREE.Group();
  for (let k = 0; k < 6; k++) {
    const t = .655 - k * .033, wb = W(t) * .97, zr = gapF(t) * wb, yr = lerp(hLow(t), hHigh(t), high) + yb(t);
    const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(xOf(t - .012), yr + .02, -zr), new THREE.Vector3(xOf(t - .004), yr + .085, -zr * .45), new THREE.Vector3(xOf(t), yr + .105, 0), new THREE.Vector3(xOf(t + .004), yr + .085, zr * .45), new THREE.Vector3(xOf(t + .012), yr + .02, zr)]);
    laces.add(mesh(new THREE.TubeGeometry(cv, 18, .03, 8, false), mats.lace));
  }
  inner.add(outsole, midsole, air, insole, upper, laces);

  /* ---------- controls ---------- */
  const lum = c => { const k = new THREE.Color(c); return .2126 * k.r + .7152 * k.g + .0722 * k.b; };
  function setColor(c) {
    mats.upper.color.set(c); mats.tongue.color.set(c).lerp(new THREE.Color("#fff"), .12);
    const light = lum(c) > .5; mats.over.color.set(light ? "#15171b" : "#f2f2ee"); mats.lace.color.set(light ? "#1b1d22" : "#f4f4f0");
  }
  setColor(color);
  const gp = { outsole: -.95, mid: -.4, air: -.18, insole: .22, upper: .85, laces: 1.35 };
  function setExplode(k) {
    outsole.position.y = gp.outsole * k; midsole.position.y = gp.mid * k; air.position.y = gp.air * k;
    insole.position.y = gp.insole * k; upper.position.y = gp.upper * k; laces.position.y = gp.laces * k;
  }
  const groups = [[mats.upper, mats.tongue, mats.over], [mats.mid, mats.insole], [mats.air], [mats.out]];
  function setHighlight(h) {
    groups.forEach((g, i) => { const v = h < -.5 ? 0 : Math.max(0, 1 - Math.abs(h - i) * 1.4); g.forEach(m => {
      if (m === mats.air) { m.emissiveIntensity = .35 + v * 1.6; return; }
      m.emissive = m.emissive || new THREE.Color(); m.emissive.set(i === 3 ? "#2f86d0" : "#2f86d0"); m.emissiveIntensity = v * (i === 0 ? .35 : .55); }); });
  }
  return { group: root, inner, parts: { outsole, midsole, air, insole, upper, laces }, mats, setColor, setExplode, setHighlight };
}

/* shared studio lighting + environment */
export async function studio(renderer, scene) {
  const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js");
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(3, 5, 4); scene.add(key);
  const blue = new THREE.PointLight(0x2f86d0, 36, 16); blue.position.set(-4, 2, -3); scene.add(blue);
  const lime = new THREE.PointLight(0xd4ff3a, 16, 14); lime.position.set(4, -1, -3); scene.add(lime);
  const mouse = new THREE.PointLight(0xffffff, 12, 11); mouse.position.set(0, 0, 3); scene.add(mouse);
  return { key, blue, lime, mouse };
}
export { THREE };
