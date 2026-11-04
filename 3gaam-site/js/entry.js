import { $, $$, RM, FINE, d, clamp } from './util.js';
import { DB } from './state.js';
const gsap = window.gsap;

/* x,y = centre in % of viewport, w = width in vw (desktop), z = depth −1 (far) … 1 (near), r = base rotation */
const SLOTS = [
  { x: 11, y: 24, w: 18, z: .15, r: -12 }, { x: 89, y: 22, w: 16, z: -.35, r: 10 },
  { x: 22, y: 80, w: 22, z: .85, r: 9 },   { x: 79, y: 77, w: 20, z: .45, r: -9 },
  { x: 50, y: 9, w: 11, z: -.95, r: 5 },   { x: 51, y: 93, w: 12, z: -.75, r: -7 },
  { x: 3, y: 54, w: 13, z: -.55, r: 18 },  { x: 97, y: 52, w: 13, z: -.6, r: -16 },
  { x: 34, y: 31, w: 9.5, z: -.95, r: 14 }, { x: 67, y: 29, w: 9.5, z: -.9, r: -12 },
  { x: 33, y: 67, w: 10.5, z: -.7, r: 8 }, { x: 68, y: 68, w: 11, z: -.6, r: -6 },
  { x: 8, y: 95, w: 15, z: 1, r: 14 },     { x: 93, y: 94, w: 15, z: 1, r: -15 },
];
const ORDER = ['air-jordan-1-high:chicago', 'air-force-1-low:white-grey', 'runner-9060:blue', 'air-force-1-low-pastel:ice', 'propulsion-runner:black', 'air-jordan-1-high:powder',
  'air-force-1-suede:denim', 'go-walk-knit:navy', 'air-force-1-low:black', 'knit-lite:olive', 'air-jordan-1-high:navy', 'air-force-1-mid:grey-suede', 'air-force-1-low-pastel:sage', 'ultra-go-lace:black'];

let nodes = [], built = false, active = false, tx = 0, ty = 0, setters = [], drift = [];
let gyro = false;

function build() {
  const field = $('#ent-field');
  const pick = ORDER.map(k => { const [s, c] = k.split(':'); return DB.bySlug[s]?.colors.find(x => x.id === c); }).filter(Boolean);
  const mob = innerWidth < 900;
  nodes = SLOTS.slice(0, pick.length).map((s, i) => {
    const c = pick[i], sc = 1 + s.z * .3;
    const w = s.w * (mob ? 1.9 : 1) * sc;
    if (mob && Math.abs(s.x - 50) < 40 && s.z < -.5 && i > 7) return null;       // thin the field on phones
    const el = document.createElement('div'); el.className = 'fs';
    el.style.cssText = `left:${s.x}%;top:${s.y}%;width:${w}vw;margin-left:${-w / 2}vw;margin-top:${-(w * c.h / c.w) / 2 * (innerWidth / innerHeight)}vh;z-index:${Math.round(10 + s.z * 8)}`;
    const inner = document.createElement('div'); inner.className = 'fs-in';
    const img = document.createElement('img'); img.src = c.imageSm; img.alt = ''; img.decoding = 'async'; img.draggable = false;
    const blur = Math.abs(s.z - .15) * (s.z < 0 ? 3.2 : 4.6);
    img.style.filter = `blur(${blur.toFixed(1)}px) drop-shadow(0 ${24 + s.z * 14}px ${20 + s.z * 12}px rgba(0,0,0,${.45 + s.z * .1}))`;
    inner.append(img); el.append(inner); field.append(el);
    return { el, inner, img, ...s, o: .5 + .5 * (s.z + 1) / 2 };
  }).filter(Boolean);
  setters = nodes.map(n => ({ x: gsap.quickTo(n.el, 'x', { duration: 1.1, ease: 'power3.out' }), y: gsap.quickTo(n.el, 'y', { duration: 1.1, ease: 'power3.out' }) }));
  built = true;
}

function onMove(e) {
  if (!active) return;
  tx = (e.clientX / innerWidth - .5) * 2; ty = (e.clientY / innerHeight - .5) * 2;
  apply();
}
function onGyro(e) {
  if (!active || e.gamma == null) return;
  tx = clamp(e.gamma / 30, -1, 1); ty = clamp(((e.beta || 45) - 45) / 30, -1, 1); apply();
}
function apply() {
  nodes.forEach((n, i) => { const k = (n.z + 1.25) * 30; setters[i].x(-tx * k); setters[i].y(-ty * k * .7); });
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
  enter(first) {
    if (!built) build();
    active = true; tx = ty = 0;
    const el = $('#v-entry');
    addEventListener('pointermove', onMove, { passive: true });
    if (!FINE) addEventListener('deviceorientation', onGyro, { passive: true });
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    gsap.killTweensOf([...$$('.fs-in'), ...$$('.fs')]);
    tl.fromTo(nodes.map(n => n.inner), { scale: .25, y: 160, opacity: 0, rotation: i => (i % 2 ? 30 : -30) }, { scale: 1, y: 0, opacity: 1, rotation: i => nodes[i].r, duration: d(first ? 2.2 : 1.5), stagger: { each: .07, from: 'random' } }, 0);
    nodes.forEach((n, i) => gsap.set(n.img, { opacity: n.o }));
    tl.fromTo('#ent-fa span', { yPercent: 115, rotate: 5, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, duration: d(1.5), stagger: .1 }, .15)
      .fromTo('.ent-en', { opacity: 0, letterSpacing: '1em' }, { opacity: 1, letterSpacing: '.38em', duration: d(1.6) }, .45)
      .fromTo('.ent-kicker,.ent-sub,.ent-cta', { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: d(1), stagger: .1 }, .6)
      .fromTo('.ent-hint', { opacity: 0 }, { opacity: 1, duration: 1 }, 1.4);
    if (!RM) {
      drift = nodes.map((n, i) => gsap.to(n.inner, {
        y: `+=${gsap.utils.random(8, 20)}`, rotation: n.r + gsap.utils.random(-3, 3), duration: gsap.utils.random(3.6, 6.4), ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.6 + i * .15
      }));
    }
    return tl;
  },
  leave() {
    active = false;
    removeEventListener('pointermove', onMove);
    removeEventListener('deviceorientation', onGyro);
    drift.forEach(t => t.kill()); drift = [];
  },
  /* fly the shoes outward as the view hands over to the scene */
  exit() {
    const tl = gsap.timeline({ defaults: { ease: 'expo.in' } });
    tl.to(nodes.map(n => n.inner), { scale: 1.6, opacity: 0, duration: d(.75), stagger: { each: .02, from: 'center' } }, 0)
      .to('.ent-core', { opacity: 0, y: -30, duration: d(.5) }, 0);
    return tl;
  },
  reset() { gsap.set(['.ent-core'], { clearProps: 'all' }); }
};
