import { $, $$, FINE, d, mobileMQ } from './util.js';
const gsap = window.gsap;

export function initGrain() {
  const c = document.createElement('canvas'); c.width = c.height = 180;
  const x = c.getContext('2d'), im = x.createImageData(180, 180);
  for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() > .5 ? 255 : 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = Math.random() * 15; }
  x.putImageData(im, 0, 0);
  $('#grain').style.backgroundImage = `url(${c.toDataURL()})`;
}

export function initCursor() {
  if (!FINE) return;
  document.body.classList.add('has-cursor');
  const cur = $('#cursor'), dot = $('.c-dot'), ring = $('.c-ring'), lbl = $('.c-lbl');
  cur.style.opacity = 0;
  const dx = gsap.quickTo(dot, 'x', { duration: .08, ease: 'none' }), dy = gsap.quickTo(dot, 'y', { duration: .08, ease: 'none' });
  const rx = gsap.quickTo(ring, 'x', { duration: .5, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .5, ease: 'power3' });
  let shown = false;
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    if (!shown) { gsap.set([dot, ring], { x: e.clientX, y: e.clientY }); shown = true; cur.style.opacity = 1; }
    dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    const t = e.target.closest?.('[data-cursor-label],a,button,[role=radio],[role=tab],input,.w-item,.sc-stage');
    cur.classList.remove('is-link', 'is-label');
    if (t) {
      const l = t.closest('[data-cursor-label]')?.dataset.cursorLabel || (t.classList.contains('sc-stage') ? 'بکش' : t.classList.contains('w-item') ? 'ببین' : '');
      if (l) { lbl.textContent = l; cur.classList.add('is-label'); } else if (!t.matches('input')) cur.classList.add('is-link');
    }
  }, { passive: true });
  addEventListener('pointerdown', () => cur.classList.add('is-down'));
  addEventListener('pointerup', () => cur.classList.remove('is-down'));
  document.documentElement.addEventListener('pointerleave', () => cur.style.opacity = 0);
  document.documentElement.addEventListener('pointerenter', () => cur.style.opacity = 1);
}

export function initMenu() {
  const btn = $('#menu-btn'), menu = $('#menu');
  const set = open => {
    btn.setAttribute('aria-expanded', open);
    if (open) {
      menu.hidden = false;
      gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: d(.35) });
      gsap.from($$('a', menu), { y: 60, opacity: 0, stagger: .06, duration: d(.8), ease: 'expo.out' });
    } else gsap.to(menu, { opacity: 0, duration: d(.25), onComplete: () => { menu.hidden = true; } });
  };
  btn.addEventListener('click', () => set(menu.hidden));
  menu.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  mobileMQ.addEventListener('change', () => { if (!menu.hidden) set(false); });
  return { close: () => { if (!menu.hidden) set(false); } };
}

let toastTimer;
export function toast(msg, actionLabel, action) {
  const t = $('#toast');
  t.innerHTML = '';
  const s = document.createElement('span'); s.textContent = msg; t.append(s);
  const hide = () => { t.classList.remove('on'); gsap.to(t, { yPercent: 160, opacity: 0, duration: d(.45), ease: 'power3.in' }); };
  if (actionLabel) { const b = document.createElement('button'); b.type = 'button'; b.textContent = actionLabel; b.onclick = () => { action(); hide(); }; t.append(b); }
  t.classList.add('on');
  gsap.fromTo(t, { yPercent: 160, opacity: 0 }, { yPercent: 0, opacity: 1, duration: d(.6), ease: 'expo.out', overwrite: true });
  clearTimeout(toastTimer); toastTimer = setTimeout(hide, 3600);
}

export function setActiveNav(name) {
  $$('#nav a').forEach(a => a.classList.toggle('is-on', a.dataset.route === name));
}
