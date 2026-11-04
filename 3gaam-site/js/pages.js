import { $, $$, fa, d, RM, clamp } from './util.js';
const gsap = window.gsap;

/* Smooth inertial scrolling + reveal motion for the scrollable views (wall, about, contact, shipping, inquiry). */
const lenses = new Map();

function words(el) {
  if (el.dataset.split) return $$('.w', el);
  const txt = el.textContent.trim().split(/\s+/);
  el.innerHTML = txt.map(w => `<span class="w">${w}</span>`).join(' ');
  el.dataset.split = 1; return $$('.w', el);
}

function setup(view) {
  const scroller = $('.scroller', view);
  const content = scroller.firstElementChild;
  let lenis = null;
  if (window.Lenis && !RM) {
    lenis = new window.Lenis({ wrapper: scroller, content, lerp: .09, wheelMultiplier: .95, smoothWheel: true });
    gsap.ticker.add(t => { if (view.classList.contains('is-active')) lenis.raf(t * 1000); });
  }
  const st = { scroller, lenis, wordsEl: null, counters: [], strip: [] };

  // reveal on scroll — measured in the scroll handler (cheap, no IntersectionObserver latency)
  st.reveals = $$('.reveal', view);
  st.reveals.forEach((r, i) => { r.style.transitionDelay = (i % 4) * 60 + 'ms'; });

  // lead paragraph — words light up with scroll
  const lead = $('.lead', view);
  if (lead) { st.wordsEl = lead; st.words = words(lead); lead.classList.remove('reveal'); lead.style.opacity = 1; lead.style.transform = 'none'; }
  // parallax figures
  st.strip = $$('.strip figure', view).map(f => ({ f, img: $('img', f), speed: +f.dataset.speed || 0 }));
  st.mark = $('.pg-mark', view);

  const onScroll = () => {
    const vh = innerHeight;
    st.reveals = st.reveals.filter(r => {
      if (r.getBoundingClientRect().top > vh * .94) return true;
      r.classList.add('in');
      if (r.classList.contains('stats')) $$('[data-count]', r).forEach(b => countUp(b));
      return false;
    });
    if (st.words) {
      const r = lead.getBoundingClientRect();
      const p = clamp((vh * .92 - r.top) / (r.height + vh * .35), 0, 1);
      const n = Math.round(p * st.words.length * 1.12);
      st.words.forEach((w, i) => w.classList.toggle('on', i < n));
    }
    st.strip.forEach(s => {
      const r = s.f.getBoundingClientRect(), c = (r.top + r.height / 2 - vh / 2) / vh;
      gsap.set(s.img, { y: -c * 60 - 20 + s.speed * -200 * c });
    });
    if (st.mark) gsap.set(st.mark, { y: scroller.scrollTop * .25, rotation: scroller.scrollTop * .01 });
  };
  scroller.addEventListener('scroll', onScroll, { passive: true });
  lenis?.on('scroll', onScroll);
  st.onScroll = onScroll;
  let fr = 0;                                   // safety net for programmatic / keyboard scrolls
  gsap.ticker.add(() => { if (view.classList.contains('is-active') && ++fr % 10 === 0) onScroll(); });
  lenses.set(view.id, st);
  return st;
}

function countUp(b) {
  const to = +b.dataset.count; if (RM) return;
  const o = { v: 0 };
  gsap.to(o, { v: to, duration: 1.6, ease: 'expo.out', onUpdate: () => { b.textContent = fa(Math.round(o.v)); } });
}

export const pages = {
  enter(view) {
    const st = lenses.get(view.id) || setup(view);
    st.scroller.scrollTop = 0; st.lenis?.scrollTo(0, { immediate: true }); st.lenis?.resize?.();
    st.lenis?.start();
    // hero motion moment
    gsap.fromTo($$('.pg-hero > :not(.pg-mark), .wall-head > *', view), { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: d(1.3), stagger: .09, ease: 'expo.out', delay: .15 });
    requestAnimationFrame(st.onScroll);
    return st;
  },
  leave(view) { lenses.get(view.id)?.lenis?.stop(); },
  resize(view) { lenses.get(view.id)?.lenis?.resize?.(); },
};

export function initMaps() {
  const addr = 'تهران، شهرک ولیعصر، خیابان یاران، خیابان جلالی شمالی (ولی‌محمدی)، کوچه هفتم، جنب پست برق، پلاک ۲/۱';
  $('#map-google').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(addr);
  $('#map-neshan').href = 'https://neshan.org/maps/search/' + encodeURIComponent(addr);
}
