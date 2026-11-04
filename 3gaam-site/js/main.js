import { $, $$, d, RM, storage, wait } from './util.js';
import { DB, loadData, inquiry } from './state.js';
import { setTheme, THEMES } from './bg.js';
import { initGrain, initCursor, initMenu, setActiveNav } from './chrome.js';
import { initDrawer, closeDrawer, renderInquiry } from './drawer.js';
import { entry, requestMotion } from './entry.js';
import { scene } from './scene.js';
import { initGallery } from './gallery.js';
import { wallView } from './wall.js';
import { pages, initMaps } from './pages.js';

const gsap = window.gsap;
if (window.Flip) gsap.registerPlugin(window.Flip);
if (RM) document.documentElement.classList.add('reduce');

const VIEWS = { entry: $('#v-entry'), scene: $('#v-scene'), wall: $('#v-wall'), about: $('#v-about'), contact: $('#v-contact'), shipping: $('#v-shipping'), inquiry: $('#v-inquiry') };
const TITLES = { entry: 'سه‌گام | شو‌روم فروش عمده کفش — گروه تولیدی کفش سه‌گام', wall: 'همه مدل‌ها | سه‌گام', about: 'درباره ما | سه‌گام', contact: 'تماس با سه‌گام', shipping: 'ارسال و نحوه خرید | سه‌گام', inquiry: 'لیست استعلام | سه‌گام' };
let current = null, switching = false, pending = null, lastSlug = null, menu;

/* ---------- curtain: lime + ink wipe between sections ---------- */
const curtain = {
  el: $('#curtain'), c1: $('#curtain .c1'), c2: $('#curtain .c2'), logo: $('#curtain .c2 img'),
  cover() {
    if (RM) return Promise.resolve();
    this.el.style.visibility = 'visible';
    return new Promise(res => {
      gsap.timeline({ onComplete: res })
        .fromTo(this.c1, { xPercent: 102 }, { xPercent: 0, duration: .5, ease: 'power3.inOut' }, 0)
        .fromTo(this.c2, { xPercent: 102 }, { xPercent: 0, duration: .5, ease: 'power3.inOut' }, .08)
        .fromTo(this.logo, { opacity: 0, scale: .7 }, { opacity: 1, scale: 1, duration: .4, ease: 'expo.out' }, .35);
    });
  },
  reveal() {
    if (RM) return;
    gsap.timeline({ onComplete: () => { this.el.style.visibility = 'hidden'; } })
      .to(this.logo, { opacity: 0, duration: .2 }, 0)
      .to(this.c2, { xPercent: -102, duration: .6, ease: 'power3.inOut' }, .05)
      .to(this.c1, { xPercent: -102, duration: .6, ease: 'power3.inOut' }, .17);
  },
};

function parse() {
  const [a = '', b, c] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  if (a === 'p') return { name: 'scene', slug: b || lastSlug || DB.products[0].slug, color: c };
  return { name: VIEWS[a] ? a : 'entry' };
}

async function show(r, extra = {}) {
  if (switching) { pending = [r, extra]; return; }
  const from = current?.name, to = r.name;
  if (from === to && to === 'scene') { scene.show(r.slug, r.color); return; }
  if (from === to) return;
  switching = true;
  closeDrawer(); menu?.close();
  const vOut = from && VIEWS[from], vIn = VIEWS[to];
  const dive = from === 'entry' && to === 'scene' && extra.fromRect;     // orbit shoe → scene
  const zoom = (from === 'wall' && to === 'scene' && extra.fromRect) || dive;
  const wipe = !!from && !zoom && !(from === 'scene' && to === 'scene');
  document.body.dataset.view = to;
  setActiveNav(to);
  document.title = TITLES[to] || document.title;

  /* ---- leave ---- */
  if (from === 'entry') { entry.leave(); if (dive) { entry.hideShoe && null; await new Promise(res => entry.exit().eventCallback('onComplete', res)); } }
  if (from === 'scene') scene.hide();
  if (from && from !== 'entry' && from !== 'scene') pages.leave(vOut);
  if (wipe) {
    await curtain.cover();
    vOut.classList.remove('is-active'); gsap.set(vOut, { opacity: 0 });
  } else if (vOut) {
    await new Promise(res => gsap.to(vOut, { opacity: 0, duration: d(zoom ? .35 : .4), ease: 'power2.inOut', onComplete: res, ...(zoom ? { onStart: () => res() } : {}) }));
    if (!zoom) vOut.classList.remove('is-active');
  }

  /* ---- enter ---- */
  current = { ...r };
  vIn.classList.add('is-active');
  gsap.set(vIn, { opacity: 1 });
  if (wipe) curtain.reveal();
  if (to === 'entry') {
    setTheme(THEMES.base, 1.4); entry.reset(); entry.showShoe();
    entry.enter(!show.seen); show.seen = true;
  } else if (to === 'scene') {
    await scene.show(r.slug, r.color, { first: !zoom, fromRect: zoom ? extra.fromRect : null });
    if (zoom) setTimeout(() => { vOut.classList.remove('is-active'); }, 500);
  } else {
    setTheme(to === 'wall' ? THEMES.dark : THEMES.base, 1.2);
    if (to === 'wall') { wallView.init(openFromWall); pages.enter(vIn); wallView.enter(); }
    else { if (to === 'inquiry') renderInquiry($('#inq-page')); pages.enter(vIn); }
  }
  switching = false;
  if (pending) { const [pr, pe] = pending; pending = null; show(pr, pe); }
}

function openFromWall(slug, colorId, rect) {
  history.pushState(null, '', `#/p/${slug}/${colorId}`);
  show({ name: 'scene', slug, color: colorId }, { fromRect: rect });
}
function openFromEntry({ slug, color, rect }) {
  history.pushState(null, '', `#/p/${slug}/${color}`);
  show({ name: 'scene', slug, color }, { fromRect: rect });
}

addEventListener('hashchange', () => show(parse()));
addEventListener('resize', () => { if (current && !['entry', 'scene'].includes(current.name)) pages.resize(VIEWS[current.name]); });

/* About: two drifting rows of campaign photos */
function buildPhotoMarquee() {
  const host = $('#photo-marquee'); if (!host) return;
  const all = [...new Set(DB.products.flatMap(p => (p.gallery || []).map(g => g.src)))];
  const rows = [all.filter((_, i) => i % 2 === 0), all.filter((_, i) => i % 2 === 1)];
  rows.forEach((srcs, ri) => {
    const row = document.createElement('div'); row.className = 'pm-row' + (ri ? ' rev' : '');
    const html = srcs.map(s => `<img src="${s}" alt="" loading="lazy" decoding="async">`).join('');
    row.innerHTML = html + html;                       // duplicated for a seamless loop
    host.append(row);
  });
}

/* ---------- boot ---------- */
async function boot() {
  initGrain(); initCursor(); menu = initMenu(); initMaps();
  await Promise.race([
    Promise.all([loadData(), document.fonts?.load('900 40px Estedad'), document.fonts?.load('800 40px Archivo')]),
    wait(6000)
  ]);
  if (!DB.products.length) { console.error('no products'); return; }
  inquiry.prune();
  initDrawer(); initGallery(); buildPhotoMarquee();
  scene.init(DB.products, { onChange: slug => { lastSlug = slug; storage.set('3g.last', slug); } });
  entry.init(openFromEntry);
  lastSlug = storage.get('3g.last', null);
  if (!DB.bySlug[lastSlug]) lastSlug = null;
  await Promise.all(DB.flat.slice(0, 8).map(c => new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = c.imageSm; })));
  document.body.classList.remove('is-loading');
  // the orb dives into whichever shoe is in front; everything else behaves as a normal link
  $('#ent-go').addEventListener('click', e => { e.preventDefault(); requestMotion(); entry.pickFront(); });
  show(parse());
}
boot();
