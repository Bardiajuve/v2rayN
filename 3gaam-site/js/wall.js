import { $, $$, d, RM } from './util.js';
import { DB } from './state.js';
const gsap = window.gsap;

let wall, items = [], mode = 'shelf', filt = { gender: 'all', sole: 'all' }, onOpen = () => {}, built = false;

const GENDERS = [['all', 'همه'], ['men', 'مردانه'], ['women', 'زنانه'], ['unisex', 'یونیسکس']];
const SOLES = [['pu', 'PU'], ['eva', 'EVA'], ['airbolling', 'ایربولینگ'], ['pvc', 'PVC']];

function visible(c) {
  const p = c.product;
  return (filt.gender === 'all' || p.gender === filt.gender) && (filt.sole === 'all' || p.sole === filt.sole);
}

function build() {
  wall = $('#wall');
  items = DB.flat.map(c => {
    const p = c.product;
    const b = document.createElement('a');
    b.className = 'w-item'; b.href = `#/p/${p.slug}/${c.id}`;
    b.setAttribute('aria-label', `${p.fa} — ${c.name}`);
    b.style.setProperty('--t1', c.theme.bg); b.style.setProperty('--t2', c.theme.bg2); b.style.setProperty('--accent', c.theme.accent);
    b.innerHTML = `<span class="w-pod"></span><span class="w-img"><img src="${c.imageSm}" alt="${p.fa} — رنگ ${c.name}" loading="lazy" decoding="async" width="${c.w}" height="${c.h}"></span><span class="w-ledge"></span><span class="w-lab"><b>${p.name}</b><span>${c.name} · ${p.soleLabel}</span></span>`;
    b.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      onOpen(p.slug, c.id, $('.w-img img', b).getBoundingClientRect());
    });
    b.addEventListener('pointermove', e => {                // hover lift + magnetic tilt
      if (RM || e.pointerType !== 'mouse') return;
      const r = b.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5;
      gsap.to($('.w-img', b), { y: -18, scale: 1.1, rotation: nx * 7, duration: .6, ease: 'expo.out', overwrite: 'auto' });
    });
    b.addEventListener('pointerleave', () => gsap.to($('.w-img', b), { y: 0, scale: 1, rotation: 0, duration: .8, ease: 'expo.out', overwrite: 'auto' }));
    wall.append(b);
    return { el: b, c };
  });
  // filters
  const f = $('#wall-filters');
  const mk = (group, [v, l]) => {
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'chip'; btn.textContent = l; btn.dataset.g = group; btn.dataset.v = v;
    btn.setAttribute('aria-pressed', filt[group] === v);
    btn.onclick = () => {
      filt[group] = filt[group] === v && v !== 'all' ? 'all' : v; if (group === 'gender' && v === 'all') filt.sole = 'all';
      $$('.chip', f).forEach(x => x.setAttribute('aria-pressed', filt[x.dataset.g] === x.dataset.v));
      applyFilter();
    };
    f.append(btn);
  };
  GENDERS.forEach(g => mk('gender', g)); SOLES.forEach(s => mk('sole', s));
  // view mode
  $$('.seg button').forEach(b => b.onclick = () => setMode(b.dataset.mode));
  built = true;
}

function applyFilter() {
  const F = window.Flip;
  const state = F?.getState(items.map(i => i.el));
  items.forEach(i => { i.el.hidden = !visible(i.c); });
  $('#wall-count').textContent = String(items.filter(i => !i.el.hidden).length).replace(/\d/g, x => '۰۱۲۳۴۵۶۷۸۹'[x]);
  let empty = $('.wall-empty'); if (empty) empty.remove();
  if (!items.some(i => !i.el.hidden)) { empty = document.createElement('p'); empty.className = 'wall-empty'; empty.textContent = 'مدلی با این فیلتر پیدا نشد.'; wall.append(empty); }
  if (F && !RM) F.from(state, { duration: .8, ease: 'expo.out', stagger: .02, absolute: true, scale: true, onEnter: e => gsap.fromTo(e, { opacity: 0, scale: .7 }, { opacity: 1, scale: 1, duration: .7, ease: 'expo.out' }), onLeave: e => gsap.to(e, { opacity: 0, scale: .7, duration: .3 }) });
}

function setMode(m) {
  if (m === mode) return;
  const F = window.Flip;
  const state = F?.getState(items.map(i => i.el).concat($$('.w-img', wall)));
  mode = m; wall.dataset.mode = m;
  $$('.seg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m));
  if (F && !RM) F.from(state, { duration: .95, ease: 'expo.inOut', stagger: { each: .012, from: 'start' }, scale: true, nested: false });
}

export const wallView = {
  init(open) { onOpen = open; if (!built) build(); applyFilter(); },
  enter() {
    const els = items.filter(i => !i.el.hidden).map(i => $('.w-img', i.el));
    gsap.fromTo(els, { y: 120, scale: .7, opacity: 0, rotation: i => (i % 2 ? 8 : -8) }, { y: 0, scale: 1, opacity: 1, rotation: 0, duration: d(1.3), stagger: { each: .045, from: 'start' }, ease: 'expo.out', delay: .2 });
    gsap.fromTo('.wall-head > *, .w-ledge, .w-lab', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: d(1), stagger: .02, ease: 'expo.out', delay: .1 });
  },
};
