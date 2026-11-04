import { $, $$, fa, d, RM, FINE, clamp, isMobile, loadImg } from './util.js';
import { DB, inquiry } from './state.js';
import { setTheme } from './bg.js';
import { toast } from './chrome.js';
import { openDrawer } from './drawer.js';
import { openGallery } from './gallery.js';
const gsap = window.gsap;

const view = $('#v-scene'), stage = $('#sc-stage'), wrap = $('#sc-wrap'), tilt = $('#sc-tilt'), floatEl = $('#sc-float'), box = $('#sc-box');
const shadow = $('#sc-shadow'), calls = $('#sc-callouts'), nameWrap = $('.sc-name'), nameT = $('#sc-name-t'), panel = $('#sc-panel');
let imgs = [$('#sc-img-a'), $('#sc-img-b')];
let P = [], idx = 0, ci = 0, qty = 2, busy = false, live = false, token = 0, idle = null, lastWheel = 0, boxAR = 1.4;
let tiltQ = null, onSlug = () => {};

/* ---------- helpers ---------- */
const prod = () => P[idx];
const color = () => P[idx].colors[ci];
const pad2 = n => fa(String(n).padStart(2, '0'));

function fitName(p) {
  nameT.textContent = p.display;
  nameT.style.fontSize = '100px';
  const w = nameT.getBoundingClientRect().width || 1;
  const mob = isMobile();
  const cs = getComputedStyle(nameWrap);
  const avail = nameWrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const target = mob ? innerWidth * .98 : Math.min(avail * 1.0, 1900);
  const cap = innerHeight * (mob ? .2 : .4);
  nameT.style.fontSize = Math.min(100 * target / w, cap) + 'px';
}

function fit(p) {
  boxAR = clamp(p.colors.reduce((a, c) => a + c.w / c.h, 0) / p.colors.length, .9, 1.9);
  const cs = getComputedStyle(stage);
  const sw = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const sh = stage.clientHeight;
  const mob = isMobile();
  const bw = Math.min(sw * (mob ? .97 : .9), sh * (mob ? .62 : .8) * boxAR, 1000);
  wrap.style.setProperty('--bw', bw + 'px');
  wrap.style.setProperty('--ar', boxAR);
}

function imgRect(c) {                       // where the colour image sits inside the box (object-fit: contain)
  const bw = wrap.offsetWidth, bh = wrap.offsetHeight, s = Math.min(bw / c.w, bh / c.h);
  return { ox: (bw - c.w * s) / 2, oy: (bh - c.h * s) / 2, iw: c.w * s, ih: c.h * s };
}

/* ---------- callouts ---------- */
function clearCallouts(fast) {
  const old = [...calls.children];
  if (!old.length) return;
  gsap.to(old, { opacity: 0, duration: fast ? .15 : .3, onComplete: () => old.forEach(n => n.remove()) });
}
function renderCallouts() {
  const p = prod(), c = color();
  const feats = (c.features ?? p.features ?? []).slice(0, isMobile() ? 2 : 4);
  const mine = ++token;
  [...calls.children].forEach(n => n.remove());
  if (!feats.length) return;
  const r = imgRect(c), W = wrap.offsetWidth, H = wrap.offsetHeight;
  const wr = wrap.getBoundingClientRect();
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('aria-hidden', 'true');
  calls.append(svg);
  const items = feats.map(f => {
    const tx = r.ox + f.x * r.iw, ty = r.oy + f.y * r.ih;
    let lx = r.ox + f.lx * r.iw, ly = r.oy + f.ly * r.ih;
    const lab = document.createElement('div'); lab.className = 'co';
    lab.innerHTML = `<b>${f.t}</b><small>${f.d}</small>`;
    calls.append(lab);
    // keep the label inside the viewport
    const lw = lab.offsetWidth, lh = lab.offsetHeight, m = isMobile() ? 8 : 20;
    const absX = wr.left + lx, absY = wr.top + ly;
    lx += clamp(absX, m + lw / 2, innerWidth - m - lw / 2) - absX;
    ly += clamp(absY, 76 + lh / 2, innerHeight - 20 - lh / 2) - absY;
    gsap.set(lab, { left: lx, top: ly, xPercent: -50, yPercent: -50 });
    const line = document.createElementNS(ns, 'path');
    line.setAttribute('d', `M${lx},${ly} L${tx},${ty}`); line.setAttribute('class', 'co-line');
    const dot = document.createElementNS(ns, 'circle'); dot.setAttribute('cx', tx); dot.setAttribute('cy', ty); dot.setAttribute('r', 4.5); dot.setAttribute('class', 'co-dot');
    const pulse = document.createElementNS(ns, 'circle'); pulse.setAttribute('cx', tx); pulse.setAttribute('cy', ty); pulse.setAttribute('r', 5); pulse.setAttribute('class', 'co-pulse');
    svg.append(line, pulse, dot);
    return { lab, line, dot, pulse };
  });
  const tl = gsap.timeline({ delay: .05 });
  items.forEach((it, i) => {
    const len = it.line.getTotalLength();
    it.line.style.strokeDasharray = len;
    tl.fromTo(it.line, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: d(.9), ease: 'expo.out' }, i * .14)
      .fromTo(it.dot, { scale: 0, transformOrigin: '50% 50%', transformBox: 'fill-box' }, { scale: 1, duration: d(.5), ease: 'back.out(3)' }, i * .14)
      .fromTo(it.lab, { opacity: 0, scale: .75 }, { opacity: 1, scale: 1, duration: d(.7), ease: 'expo.out' }, i * .14 + .2);
    it.pulse.style.opacity = 0; tl.set(it.pulse, { opacity: 1 }, i * .14 + .6);
  });
  tl.eventCallback('onInterrupt', () => {});
  tl._mine = mine;
}

/* ---------- panel ---------- */
function fillPanel(p, c) {
  $('#p-tag').textContent = p.tag || '';
  $('#p-count').textContent = `${pad2(p.index + 1)} / ${pad2(P.length)}`;
  $('#p-fa').textContent = p.fa;
  $('#p-en').textContent = p.name;
  $('#p-desc').textContent = p.description;
  $('#p-specs').innerHTML = `<div><dt>زیره</dt><dd>${p.soleLabel}</dd></div><div><dt>مناسب</dt><dd>${p.genderLabel}</dd></div><div><dt>سایز</dt><dd>${p.sizesLabel}</dd></div>`;
  const sw = $('#p-swatches'); sw.innerHTML = '';
  p.colors.forEach((cc, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'sw'; b.setAttribute('role', 'radio');
    b.setAttribute('aria-label', cc.name); b.title = cc.name; b.style.setProperty('--c', cc.hex);
    b.setAttribute('aria-checked', i === ci); b.dataset.i = i;
    sw.append(b);
  });
  sw.style.display = p.colors.length > 1 ? '' : 'none';
  $('#p-color-name').textContent = c.name;
  $('#p-add').disabled = false;
  const g = p.gallery || []; $('#p-gal').hidden = !g.length; $('#p-gal-n').textContent = fa(g.length);
}
function setQty(n) {
  qty = clamp(n, DB.carton.min, 99);
  $('#st-val').textContent = fa(qty);
  $('#st-pairs').textContent = `${fa(qty * DB.carton.pairs)} جفت`;
}
function syncSheet() {
  if (isMobile()) view.style.setProperty('--sheet', panel.offsetHeight + 8 + 'px'); else view.style.removeProperty('--sheet');
}

/* ---------- idle / tilt ---------- */
function startIdle() {
  stopIdle(); if (RM) return;
  idle = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut', duration: 3.6 } });
  idle.fromTo(floatEl, { y: 6, rotation: -.8 }, { y: -14, rotation: 1.1 }, 0)
    .fromTo(shadow, { scaleX: 1, opacity: 1 }, { scaleX: .86, opacity: .7 }, 0);
}
function stopIdle() { idle?.kill(); idle = null; gsap.set(floatEl, { y: 0, rotation: 0 }); gsap.set(shadow, { scaleX: 1, opacity: 1 }); }

/* ---------- colour swap ---------- */
async function showColor(i, { instant = false } = {}) {
  const p = prod(), c = p.colors[i];
  const bg = imgs[1];
  await loadImg(c.image);
  ci = i;
  bg.src = c.image; bg.alt = `${p.fa} — رنگ ${c.name}`;
  const fg = imgs[0];
  if (instant) { gsap.set(bg, { opacity: 1, scale: 1, rotation: 0 }); gsap.set(fg, { opacity: 0 }); }
  else {
    gsap.fromTo(bg, { opacity: 0, scale: 1.05, rotation: -1.5 }, { opacity: 1, scale: 1, rotation: 0, duration: d(.7), ease: 'power3.out' });
    gsap.to(fg, { opacity: 0, scale: .96, duration: d(.55), ease: 'power2.inOut' });
  }
  imgs = [bg, fg];
  $$('.sw', panel).forEach((s, k) => s.setAttribute('aria-checked', k === i));
  $('#p-color-name').textContent = c.name;
  setTheme(c.theme, instant ? .001 : .9);
  setUrl();
  if (!instant) { clearCallouts(true); gsap.delayedCall(.45, () => live && renderCallouts()); }
}
function setUrl() { try { history.replaceState(null, '', `#/p/${prod().slug}/${color().id}`); } catch { /* file:// */ } onSlug(prod().slug); }

/* ---------- product change ---------- */
function ghostOf(node) {
  const g = node.cloneNode(true); g.removeAttribute('id'); $$('[id]', g).forEach(e => e.removeAttribute('id'));
  g.style.pointerEvents = 'none'; return g;
}

const ready = new Set();
function ensure(src) { return ready.has(src) ? Promise.resolve() : loadImg(src).then(() => ready.add(src)); }
let queued = null;
const PANEL_SEL = '.p-top,.p-fa,.p-en,.p-desc,.p-specs,.p-colors,.p-order,#p-add,.p-gal,.p-note';

async function go(n, dir = 1, opts = {}) {
  const N = P.length; n = ((n % N) + N) % N;
  if (n === idx && !opts.force) return;
  if (busy) { queued = { n, dir }; return; }          // rapid presses are queued, never dropped
  busy = true; const my = ++token;
  const first = opts.first, vw = innerWidth;
  const p = P[n], startColor = opts.color != null ? Math.max(0, p.colors.findIndex(c => c.id === opts.color)) : 0;
  const c0 = p.colors[startColor];
  if (!ready.has(c0.image)) await ensure(c0.image);

  // ghosts of the outgoing state (cloned from wherever the shoe currently is, even mid-flight)
  let ghost = null, ghostName = null;
  if (!first && !opts.fromRect) {
    ghost = ghostOf(wrap); wrap.after(ghost);
    ghostName = ghostOf(nameT); ghostName.style.position = 'absolute'; nameWrap.append(ghostName);
  }
  gsap.killTweensOf([wrap, nameT, shadow, tilt]);
  stopIdle(); clearCallouts(true);
  gsap.to($$(PANEL_SEL, panel), { opacity: 0, y: -10, duration: d(.16), stagger: .008, ease: 'power2.in', overwrite: true });

  // swap content right away: the old shoe is already a ghost
  idx = n; ci = startColor; fit(p); fitName(p);
  imgs[0].src = c0.image; imgs[0].alt = `${p.fa} — رنگ ${c0.name}`; gsap.set(imgs[0], { opacity: 1, scale: 1, rotation: 0 }); gsap.set(imgs[1], { opacity: 0 });
  gsap.set(wrap, { clearProps: 'transform,opacity' }); gsap.set(nameT, { clearProps: 'transform,opacity' });
  setTheme(c0.theme, first ? 1.6 : 1.0);
  setUrl();
  gsap.delayedCall(d(.14), () => {
    if (my !== token) return;
    fillPanel(p, c0); syncSheet();
    gsap.fromTo($$(PANEL_SEL, panel), { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: d(.9), stagger: .045, ease: 'expo.out', overwrite: true });
  });
  $$('#sc-rail button').forEach((b, k) => b.setAttribute('aria-selected', k === n));
  $('#sc-rail button[aria-selected=true]')?.scrollIntoView?.({ block: 'nearest', inline: 'center', behavior: RM ? 'auto' : 'smooth' });

  const tl = gsap.timeline({ onComplete: () => { if (my === token) { startIdle(); renderCallouts(); } } });
  const rm = () => { /* ghosts are removed by their own tweens */ };
  if (ghost) {
    const x0 = gsap.getProperty(ghost, 'x') || 0;
    tl.to(ghost, { x: x0 + dir * vw * .85, rotation: dir * 14, scale: .88, opacity: 0, duration: d(.62), ease: 'power3.in', force3D: true, onComplete: () => ghost.remove() }, 0);
    tl.to(ghostName, { x: dir * vw * .38, opacity: 0, duration: d(.6), ease: 'power3.in', onComplete: () => ghostName.remove() }, 0);
  }
  if (opts.fromRect) {                                       // shared-element zoom (wall / entry orbit)
    const r = wrap.getBoundingClientRect(), f = opts.fromRect;
    const s = f.width / r.width;
    tl.fromTo(wrap, { x: f.left + f.width / 2 - (r.left + r.width / 2), y: f.top + f.height / 2 - (r.top + r.height / 2), scale: s, opacity: 1, rotation: 0 }, { x: 0, y: 0, scale: 1, rotation: 0, duration: d(1.25), ease: 'expo.inOut', force3D: true }, 0);
    tl.fromTo(nameT, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: d(1.2), ease: 'expo.out' }, .35);
  } else if (first) {
    tl.fromTo(wrap, { scale: .35, y: 140, rotation: -14, opacity: 0 }, { scale: 1, y: 0, rotation: 0, opacity: 1, duration: d(1.6), ease: 'expo.out', force3D: true }, .1);
    tl.fromTo(nameT, { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: d(1.6), ease: 'expo.out' }, 0);
  } else {
    tl.fromTo(wrap, { x: -dir * vw * .75, rotation: -dir * 16, scale: .9, opacity: 0, y: 0 }, { x: 0, rotation: 0, scale: 1, opacity: 1, duration: d(1.1), ease: 'expo.out', force3D: true }, .1);
    tl.fromTo(nameT, { x: -dir * vw * .3, opacity: 0 }, { x: 0, opacity: 1, duration: d(1.05), ease: 'expo.out' }, .08);
  }
  tl.fromTo(shadow, { opacity: 0 }, { opacity: 1, duration: d(.7) }, .45);
  gsap.delayedCall(d(opts.fromRect ? .9 : .38), () => {
    busy = false;
    if (queued) { const q = queued; queued = null; go(q.n, q.dir); }
  });
}

/* load every product image once, in the background, so a swap never waits on the network */
function warm() {
  const all = DB.flat.map(c => c.image);
  let i = 0;
  const step = () => { if (i >= all.length) return; ensure(all[i++]).then(() => (window.requestIdleCallback ? requestIdleCallback(step, { timeout: 400 }) : setTimeout(step, 60))); };
  step();
}

/* ---------- public ---------- */
export const scene = {
  init(products, { onChange } = {}) {
    P = products; onSlug = onChange || onSlug;
    qty = DB.carton.min; setQty(qty);
    // rail
    const rail = $('#sc-rail');
    P.forEach((p, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', p.fa); b.title = p.fa;
      b.innerHTML = `<img src="${p.colors[0].imageSm}" alt="" loading="lazy" decoding="async">`;
      b.onclick = () => this.goTo(i); rail.append(b);
    });
    $('#sc-prev').onclick = () => this.next(-1); $('#sc-next').onclick = () => this.next(1);
    $('#st-minus').onclick = () => setQty(qty - 1); $('#st-plus').onclick = () => setQty(qty + 1);
    $('#p-swatches').addEventListener('click', e => { const b = e.target.closest('.sw'); if (b && +b.dataset.i !== ci) showColor(+b.dataset.i); });
    $('#p-add').onclick = addToList;
    $('#p-gal').onclick = () => openGallery(prod());
    warm();
    gsap.set(tilt, { transformPerspective: 1000 });

    // wheel
    view.addEventListener('wheel', e => {
      if (!live || e.target.closest('.sc-panel')) return;
      e.preventDefault();
      const now = performance.now(), dl = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : -e.deltaX;
      const quiet = now - lastWheel > 140; lastWheel = now;
      if (busy || !quiet || Math.abs(dl) < 8) return;
      this.next(dl > 0 ? 1 : -1);
    }, { passive: false });

    // keys
    addEventListener('keydown', e => {
      if (!live || !$('#drawer').hidden || !$('#gal').hidden || e.target.closest('input,textarea')) return;
      if (e.key === 'ArrowLeft' || e.key === 'PageDown') { e.preventDefault(); this.next(1); }
      else if (e.key === 'ArrowRight' || e.key === 'PageUp') { e.preventDefault(); this.next(-1); }
    });

    // drag / swipe (pointer events cover mouse, touch, pen)
    let sx = 0, sy = 0, dx = 0, dragging = false, locked = false, pid = null;
    const setX = gsap.quickSetter(wrap, 'x', 'px'), setR = gsap.quickSetter(wrap, 'rotation', 'deg'), setNX = gsap.quickSetter(nameT, 'x', 'px');
    stage.addEventListener('pointerdown', e => {
      if (!live || busy || e.button > 0) return;
      sx = e.clientX; sy = e.clientY; dx = 0; dragging = true; locked = false; pid = e.pointerId;
      stage.setPointerCapture?.(pid); stage.classList.add('is-drag');
    });
    stage.addEventListener('pointermove', e => {
      if (FINE && e.pointerType === 'mouse' && !dragging) { pointerTilt(e); }
      if (!dragging) return;
      dx = e.clientX - sx;
      if (!locked && Math.abs(e.clientY - sy) > Math.abs(dx) && Math.abs(e.clientY - sy) > 12) { dragging = false; endDrag(0); return; }
      locked = true; clearCallouts(true);
      setX(dx * .75); setR(dx * .018); setNX(dx * .22);
    });
    const endDrag = (v) => {
      stage.classList.remove('is-drag'); try { stage.releasePointerCapture?.(pid); } catch { /* noop */ }
      if (Math.abs(v) > 70) { this.next(v > 0 ? 1 : -1, { fromDrag: true }); }
      else { gsap.to(wrap, { x: 0, rotation: 0, duration: d(.9), ease: 'elastic.out(1,.6)' }); gsap.to(nameT, { x: 0, duration: d(.8), ease: 'expo.out' }); if (locked) gsap.delayedCall(.3, () => live && renderCallouts()); }
    };
    const up = () => { if (!dragging) return; dragging = false; endDrag(dx); };
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    // tilt from pointer anywhere on the view
    tiltQ = {
      ry: gsap.quickTo(tilt, 'rotationY', { duration: .9, ease: 'power3' }), rx: gsap.quickTo(tilt, 'rotationX', { duration: .9, ease: 'power3' }),
      nx: gsap.quickTo(nameWrap, 'x', { duration: 1.2, ease: 'power3' }), ny: gsap.quickTo(nameWrap, 'y', { duration: 1.2, ease: 'power3' })
    };
    view.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') pointerTilt(e); });
    function pointerTilt(e) {
      if (RM || !live) return;
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      tiltQ.ry(nx * 14); tiltQ.rx(-ny * 9); tiltQ.nx(-nx * 34); tiltQ.ny(-ny * 16);
    }
    addEventListener('resize', () => { if (!live) return; clearTimeout(this._rt); this._rt = setTimeout(() => this.relayout(), 120); });
    new ResizeObserver(syncSheet).observe(panel);
  },

  next(dir, o) { go((queued ? queued.n : idx) + dir, dir, o); },
  goTo(i) { if (i === idx) return; go(i, i > idx ? 1 : -1); },
  relayout() { fit(prod()); fitName(prod()); syncSheet(); renderCallouts(); },
  get slug() { return P[idx]?.slug; },
  get current() { return { p: P[idx], c: P[idx]?.colors[ci] }; },

  /* open the scene on a product. opts.fromRect → zoom from the wall, opts.first → intro fly-in */
  async show(slug, colorId, opts = {}) {
    const n = Math.max(0, P.findIndex(p => p.slug === slug));
    live = true; busy = false;
    if (view.dataset.ready && n === idx && !opts.first && !opts.fromRect) {
      const k = colorId ? P[idx].colors.findIndex(c => c.id === colorId) : ci;
      if (k >= 0 && k !== ci) showColor(k);
      else { fit(prod()); fitName(prod()); startIdle(); renderCallouts(); }
      return;
    }
    if (view.dataset.ready && !opts.first && !opts.fromRect) { go(n, n > idx ? 1 : -1, { color: colorId }); return; }
    view.dataset.ready = 1;
    idx = -1;
    await go(n, 1, { first: !opts.fromRect, fromRect: opts.fromRect, color: colorId, force: true });
  },
  hide() { live = false; stopIdle(); clearCallouts(true); token++; },
};

function addToList() {
  const p = prod(), c = color(), btn = $('#p-add');
  inquiry.add(p.slug, c.id, qty);
  // fly a thumbnail to the list button
  const from = wrap.getBoundingClientRect(), to = $('#inq-btn').getBoundingClientRect();
  if (!RM) {
    const f = document.createElement('img'); f.src = c.imageSm; f.className = 'fly';
    f.style.cssText = `left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px;object-fit:contain`;
    document.body.append(f);
    gsap.timeline({ onComplete: () => f.remove() })
      .to(f, { x: to.left + to.width / 2 - (from.left + from.width / 2), y: to.top + to.height / 2 - (from.top + from.height / 2), scale: .06, rotation: -20, duration: .9, ease: 'expo.inOut' })
      .to(f, { opacity: 0, duration: .15 }, '-=.15');
    gsap.fromTo('#inq-count', { scale: 1 }, { scale: 1.5, duration: .25, delay: .75, yoyo: true, repeat: 1, ease: 'power2.out' });
  }
  const span = $('span', btn), old = span.textContent;
  span.textContent = 'به لیست اضافه شد ✓'; btn.disabled = false;
  gsap.fromTo(btn, { scale: .96 }, { scale: 1, duration: .6, ease: 'elastic.out(1,.5)' });
  setTimeout(() => { span.textContent = old; }, 1600);
  toast(`${p.fa} — ${fa(qty)} کارتن اضافه شد`, 'مشاهده لیست', openDrawer);
}
