import { $, $$, d, RM, storage, wait } from './util.js';
import { DB, loadData, inquiry } from './state.js';
import { setTheme, THEMES } from './bg.js';
import { initGrain, initCursor, initMenu, setActiveNav } from './chrome.js';
import { initDrawer, closeDrawer, renderInquiry } from './drawer.js';
import { entry, requestMotion } from './entry.js';
import { scene } from './scene.js';
import { wallView } from './wall.js';
import { pages, initMaps } from './pages.js';

const gsap = window.gsap;
if (window.Flip) gsap.registerPlugin(window.Flip);
if (RM) document.documentElement.classList.add('reduce');

const VIEWS = { entry: $('#v-entry'), scene: $('#v-scene'), wall: $('#v-wall'), about: $('#v-about'), contact: $('#v-contact'), shipping: $('#v-shipping'), inquiry: $('#v-inquiry') };
const TITLES = { entry: 'سه‌گام | شو‌روم فروش عمده کفش — گروه تولیدی کفش سه‌گام', wall: 'همه مدل‌ها | سه‌گام', about: 'درباره ما | سه‌گام', contact: 'تماس با سه‌گام', shipping: 'ارسال و نحوه خرید | سه‌گام', inquiry: 'لیست استعلام | سه‌گام' };
let current = null, switching = false, pending = null, lastSlug = null, menu;

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
  document.body.dataset.view = to;
  setActiveNav(to);
  document.title = TITLES[to] || document.title;

  /* ---- leave ---- */
  if (from === 'entry') { entry.leave(); if (to === 'scene') await new Promise(res => entry.exit().eventCallback('onComplete', res)); }
  if (from === 'scene') scene.hide();
  if (from && from !== 'entry' && from !== 'scene') pages.leave(vOut);
  const zoom = from === 'wall' && to === 'scene' && extra.fromRect;
  if (vOut) {
    await new Promise(res => gsap.to(vOut, { opacity: 0, duration: d(zoom ? .4 : from === 'scene' ? .45 : .4), ease: 'power2.inOut', onComplete: res, ...(zoom ? { onStart: () => res() } : {}) }));
    if (!zoom) vOut.classList.remove('is-active');
  }

  /* ---- enter ---- */
  current = { ...r };
  vIn.classList.add('is-active');
  gsap.set(vIn, { opacity: 1 });
  if (to === 'entry') {
    setTheme(THEMES.base, 1.4); gsap.set('.ent-core', { clearProps: 'all' });
    entry.enter(!show.seen); show.seen = true;
  } else if (to === 'scene') {
    await scene.show(r.slug, r.color, { first: from !== 'wall' || !extra.fromRect, fromRect: extra.fromRect });
    if (zoom) setTimeout(() => vOut.classList.remove('is-active'), 500);
  } else {
    setTheme(to === 'wall' ? THEMES.dark : THEMES.base, 1.2);
    if (to === 'wall') { wallView.init(openFromWall); pages.enter(vIn); wallView.enter(); }
    else { if (to === 'inquiry') renderInquiry($('#inq-page')); pages.enter(vIn); }
  }
  switching = false;
  if (pending) { const [pr, pe] = pending; pending = null; show(pr, pe); }
}

function openFromWall(slug, colorId, rect) {
  const target = `#/p/${slug}/${colorId}`;
  history.pushState(null, '', target);
  show({ name: 'scene', slug, color: colorId }, { fromRect: rect });
}

addEventListener('hashchange', () => show(parse()));
addEventListener('popstate', () => { /* hashchange handles it; replaceState calls never fire this */ });
addEventListener('resize', () => { if (current && !['entry', 'scene'].includes(current.name)) pages.resize(VIEWS[current.name]); });

/* ---------- boot ---------- */
async function boot() {
  initGrain(); initCursor(); menu = initMenu(); initMaps();
  await Promise.race([
    Promise.all([loadData(), document.fonts?.load('900 40px Estedad'), document.fonts?.load('800 40px Archivo')]),
    wait(6000)
  ]);
  if (!DB.products.length) { console.error('no products'); return; }
  inquiry.prune();
  initDrawer();
  scene.init(DB.products, { onChange: slug => { lastSlug = slug; storage.set('3g.last', slug); } });
  lastSlug = storage.get('3g.last', null);
  if (!DB.bySlug[lastSlug]) lastSlug = null;
  // warm the first images
  await Promise.all(DB.flat.slice(0, 6).map(c => new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = c.imageSm; })));
  document.body.classList.remove('is-loading');
  $('#ent-go').addEventListener('click', () => requestMotion());
  show(parse());
}
boot();
