import { $, $$, RM, FINE, d, clamp, lerp } from './util.js';
import { DB } from './state.js';
const gsap = window.gsap;

/* ORBIT ENTRY — shoes circle the brand name on a tilted ring. Half of them pass behind the
   title, half in front. Drag to spin, move to steer, tap a shoe (or the orb) to dive into its scene. */
const PICKS = ['air-jordan-1-high:chicago', 'air-force-1-low:white-grey', 'runner-9060:blue', 'air-force-1-low-pastel:ice', 'propulsion-runner:black', 'air-jordan-1-high:powder',
  'air-force-1-suede:denim', 'go-walk-knit:navy', 'air-force-1-low:black', 'knit-lite:olive', 'air-jordan-1-high:navy', 'air-force-1-mid:grey-suede', 'air-force-1-low-pastel:sage', 'ultra-go-lace:black'];

let items = [], built = false, active = false, tick = null;
const S = { angle: 0, vel: 0, target: .1, reveal: 0, exit: 0, boost: 0 };
const P = { x: .5, y: .5, tx: .5, ty: .5, mx: 0, my: 0 };
let W = 0, H = 0, drag = null, onPick = () => {}, picked = null;

function build() {
  const ring = $('#ent-ring');
  const list = PICKS.map(k => { const [s, c] = k.split(':'); return DB.bySlug[s]?.colors.find(x => x.id === c); }).filter(Boolean);
  items = list.map((c, i) => {
    const el = document.createElement('div'); el.className = 'ring-it'; el.dataset.slug = c.product.slug; el.dataset.color = c.id;
    el.setAttribute('role', 'link'); el.setAttribute('aria-label', `${c.product.fa} — ${c.name}`);
    const img = document.createElement('img'); img.src = c.imageSm; img.alt = ''; img.decoding = 'async'; img.draggable = false;
    el.append(img); ring.append(el);
    return { el, c, i, ar: c.h / c.w, z: 0, x: 0, y: 0 };
  });
  $('#v-entry').addEventListener('pointerdown', e => {
    if (!active || e.target.closest('a,button')) return;
    drag = { x: e.clientX, y: e.clientY, last: e.clientX, moved: 0, t: e.target.closest('.ring-it') };
  });
  addEventListener('pointermove', e => {
    P.tx = e.clientX / innerWidth; P.ty = e.clientY / innerHeight;
    if (!drag) return;
    const dx = e.clientX - drag.last; drag.last = e.clientX; drag.moved += Math.abs(dx);
    if (drag.moved > 6) { S.angle += dx * .0052; S.vel = dx * .0052 * 60; }
  });
  addEventListener('pointerup', e => {
    if (!drag) return;
    const dr = drag; drag = null;
    if (dr.moved < 8 && dr.t) pick(items.find(i => i.el === dr.t));
  });
  built = true;
}

function layout() {
  W = innerWidth; H = innerHeight;
  const mob = W < 900;
  const rx = mob ? W * .42 : Math.min(W * .43, 640);
  const ry = mob ? H * .12 : Math.min(H * .2, 200);
  const sw = mob ? W * .34 : Math.min(W * .17, 250);
  const cy = mob ? H * .5 : H * .5;
  Object.assign(S, { rx, ry, sw, cy });
  items.forEach(it => {
    it.el.style.width = sw + 'px'; it.el.style.marginLeft = -sw / 2 + 'px'; it.el.style.marginTop = -(sw * it.ar) / 2 + 'px'; it.el.style.top = cy + 'px';
  });
}

function frame(_, dt) {
  const k = Math.min(.05, dt / 1000);
  // spin: free drift + pointer steering + inertia
  if (!drag) {
    const steer = FINE ? (P.x - .5) * .5 : 0;
    S.vel *= Math.pow(.04, k);                           // inertia decay
    S.angle += (S.target + steer + S.boost) * k + S.vel * k;
  }
  P.x = lerp(P.x, P.tx, 1 - Math.pow(.001, k)); P.y = lerp(P.y, P.ty, 1 - Math.pow(.001, k));
  const n = items.length, rv = S.reveal, ex = S.exit;
  const px = (P.x - .5) * 2, py = (P.y - .5) * 2;
  for (const it of items) {
    const a = S.angle + (it.i / n) * Math.PI * 2 + (1 - rv) * 5.5;
    const c = Math.cos(a), s = Math.sin(a);                // s > 0 → near the viewer
    const t = (s + 1) / 2;
    let x = c * S.rx * rv, y = s * S.ry * rv - py * 14 * (.3 + t);
    x += -px * 22 * (.3 + t);
    let sc = lerp(.48, 1.08, t) * (.2 + .8 * rv);
    let op = lerp(.32, 1, Math.pow(t, .65)) * clamp(rv * 1.6, 0, 1);
    if (ex > 0) {
      if (it === picked) { sc *= 1 + ex * .05; }
      else { x *= 1 + ex * .9; y += ex * 80 * (s > 0 ? 1 : -1); sc *= 1 + ex * .35; op *= 1 - ex; }
    }
    it.z = s;
    const rot = c * 9 - (1 - rv) * 90;
    it.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${sc.toFixed(3)}) rotate(${rot.toFixed(1)}deg)`;
    it.el.style.opacity = op.toFixed(3);
    it.el.style.zIndex = s > .05 ? 10 + Math.round(t * 10) : 2 + Math.round(t * 5);
  }
  // spotlight on the title follows the pointer (or sweeps by itself on touch)
  const ti = $('#ent-title'), sp = $('.t-spot');
  if (sp) {
    const r = sp.getBoundingClientRect();
    let mx, my;
    if (FINE) { mx = P.x * W - r.left; my = P.y * H - r.top; }
    else { const tt = performance.now() / 1000; mx = r.width * (.5 + .42 * Math.sin(tt * .8)); my = r.height * (.5 + .3 * Math.sin(tt * 1.3)); }
    ti.style.setProperty('--mx', mx.toFixed(0) + 'px'); ti.style.setProperty('--my', my.toFixed(0) + 'px');
  }
}

function frontMost() { return items.reduce((a, b) => (b.z > a.z ? b : a), items[0]); }

function pick(it) {
  if (!it || !active) return;
  picked = it;
  const rect = $('img', it.el).getBoundingClientRect();
  onPick({ slug: it.c.product.slug, color: it.c.id, rect });
}

let gyro = false;
function onGyro(e) {
  if (!active || e.gamma == null) return;
  P.tx = clamp(.5 + e.gamma / 60, 0, 1); P.ty = clamp(.5 + ((e.beta || 45) - 45) / 60, 0, 1);
}
export async function requestMotion() {
  if (gyro || FINE) return;
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted') return;
    }
    addEventListener('deviceorientation', onGyro, { passive: true }); gyro = true;
  } catch { /* ignore */ }
}

export const entry = {
  init(cb) { onPick = cb; },
  /* called by the orb */
  pickFront() { pick(frontMost()); },
  enter(first) {
    if (!built) build();
    layout(); active = true; picked = null; S.exit = 0; S.boost = 0; S.reveal = first === false ? .6 : 0;
    addEventListener('resize', layout);
    gsap.ticker.add(frame); tick = frame;
    gsap.to(S, { reveal: 1, duration: d(first === false ? 1.4 : 2.8), ease: 'expo.out', delay: .1 });
    gsap.fromTo(S, { boost: 3.2 }, { boost: 0, duration: d(3.4), ease: 'power3.out' });
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.fromTo('.t-base>span,.t-spot>span', { yPercent: 110, rotate: 6, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, duration: d(1.5), stagger: .1 }, .2)
      .fromTo('.ent-en', { opacity: 0, letterSpacing: '1.1em' }, { opacity: 1, letterSpacing: '.4em', duration: d(1.8) }, .5)
      .fromTo('.ent-kicker,.ent-sub', { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: d(1), stagger: .1 }, .7)
      .fromTo('.ent-dock > *', { y: 60, opacity: 0, scale: .8 }, { y: 0, opacity: 1, scale: 1, duration: d(1.2), stagger: .09, ease: 'back.out(1.5)' }, 1)
      .fromTo('.band', { xPercent: 12, opacity: 0 }, { xPercent: 0, opacity: 1, duration: d(2), stagger: .2 }, .1)
      .fromTo('.ent-hint', { opacity: 0 }, { opacity: 1, duration: 1 }, 2);
    // magnetic orb
    const orb = $('.orb');
    if (FINE && orb) {
      const qx = gsap.quickTo(orb, 'x', { duration: .6, ease: 'power3' }), qy = gsap.quickTo(orb, 'y', { duration: .6, ease: 'power3' });
      orb._mv = e => { const r = orb.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); const dist = Math.hypot(dx, dy); if (dist < 190) { qx(dx * .28); qy(dy * .28); } else { qx(0); qy(0); } };
      addEventListener('pointermove', orb._mv);
    }
    return tl;
  },
  leave() {
    active = false; removeEventListener('resize', layout);
    gsap.ticker.remove(frame);
    const orb = $('.orb'); if (orb?._mv) { removeEventListener('pointermove', orb._mv); gsap.set(orb, { x: 0, y: 0 }); }
  },
  /* dive: everything else flies away, the picked shoe is handed to the scene */
  exit() {
    const tl = gsap.timeline();
    tl.to(S, { exit: 1, duration: d(.75), ease: 'power3.inOut' }, 0)
      .to('.ent-core,.ent-dock,.ent-bands,.ent-beams,.ent-hint', { opacity: 0, duration: d(.5), ease: 'power2.in' }, 0);
    return tl;
  },
  reset() { gsap.set('.ent-core,.ent-dock,.ent-bands,.ent-beams,.ent-hint', { clearProps: 'opacity' }); S.exit = 0; },
  get picked() { return picked; },
  hideShoe() { if (picked) picked.el.style.visibility = 'hidden'; },
  showShoe() { items.forEach(i => { i.el.style.visibility = ''; }); },
};
