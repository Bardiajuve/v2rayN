import { $, $$, fa, d, RM } from './util.js';
const gsap = window.gsap;

/* "On feet" gallery: a swipeable strip of the lifestyle photos that belong to a product. */
const el = $('#gal'), track = $('#gal-track');
let open = false, opener = null;

export function openGallery(p) {
  const list = p.gallery || [];
  if (!list.length || open) return;
  open = true; opener = document.activeElement;
  $('#gal-title').textContent = p.fa;
  $('#gal-count').textContent = `01 / ${String(list.length).padStart(2, '0')}`;
  track.innerHTML = '';
  list.forEach((g, i) => {
    const f = document.createElement('figure'); f.className = 'gal-card'; f.style.setProperty('--ar', (g.w / g.h).toFixed(4));
    const im = document.createElement('img'); im.src = g.src; im.alt = `${p.fa} — عکس ${fa(i + 1)}`; im.decoding = 'async'; im.draggable = false;
    f.append(im); track.append(f);
  });
  el.hidden = false;
  track.scrollLeft = 0;
  gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: d(.4) });
  gsap.fromTo($$('.gal-card', el), { y: 120, rotation: i => (i % 2 ? 4 : -4), opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: d(1.1), stagger: .08, ease: 'expo.out', delay: .1 });
  gsap.fromTo('.gal-head > *', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: d(.8), stagger: .06, ease: 'expo.out' });
  $('#gal-close').focus({ preventScroll: true });
  updateCount();
}

export function closeGallery() {
  if (!open) return;
  open = false;
  gsap.to(el, { opacity: 0, duration: d(.3), onComplete: () => { el.hidden = true; track.innerHTML = ''; } });
  opener?.focus?.({ preventScroll: true });
}

function updateCount() {
  const cards = $$('.gal-card', track); if (!cards.length) return;
  const mid = track.getBoundingClientRect().left + track.clientWidth / 2;
  let best = 0, bd = 1e9;
  cards.forEach((c, i) => { const r = c.getBoundingClientRect(); const dd = Math.abs(r.left + r.width / 2 - mid); if (dd < bd) { bd = dd; best = i; } });
  $('#gal-count').textContent = `${String(best + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
  cards.forEach((c, i) => { c.style.opacity = i === best ? 1 : .55; c.style.transform = `scale(${i === best ? 1 : .94})`; });
}

export function initGallery() {
  $('#gal-close').addEventListener('click', closeGallery);
  track.addEventListener('scroll', () => requestAnimationFrame(updateCount), { passive: true });
  addEventListener('keydown', e => {
    if (!open) return;
    if (e.key === 'Escape') closeGallery();
    const step = (track.querySelector('.gal-card')?.offsetWidth || 400) + 24;
    if (e.key === 'ArrowLeft') { e.preventDefault(); track.scrollBy({ left: -step, behavior: RM ? 'auto' : 'smooth' }); }
    if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: step, behavior: RM ? 'auto' : 'smooth' }); }
  });
  // wheel → horizontal, mouse drag → scroll
  track.addEventListener('wheel', e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); track.scrollBy({ left: -e.deltaY, behavior: 'auto' }); } }, { passive: false });
  let sx = 0, sl = 0, down = false;
  track.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = track.scrollLeft; track.classList.add('drag'); });
  addEventListener('pointermove', e => { if (down) track.scrollLeft = sl - (e.clientX - sx); });
  addEventListener('pointerup', () => { if (!down) return; down = false; track.classList.remove('drag'); });
}
