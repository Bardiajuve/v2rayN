import { mix, RM } from './util.js';
/* Two stacked gradient layers; a theme change fades the new one in on the compositor
   (opacity only), so the colour morph never repaints a full-screen gradient per frame. */
const layers = [document.getElementById('bgA'), document.getElementById('bgB')];
let top = 0, z = 1;
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

export const THEMES = {
  base: { bg: '#102c4a', bg2: '#08121f', accent: '#2b7bbd' },
  dark: { bg: '#0d1b2b', bg2: '#070b11', accent: '#2b7bbd' },
};

function paint(el, t) {
  el.style.setProperty('--bg1', t.bg);
  el.style.setProperty('--bg2', t.bg2);
  el.style.setProperty('--bg3', mix(t.bg2, '#000000', .55));
  el.style.setProperty('--glow', rgba(t.accent, .34));
}

let last = null;
export function setTheme(t, duration = 1.1, ease = 'power2.inOut') {
  if (last && last.bg === t.bg && last.bg2 === t.bg2) return;
  last = t;
  const next = layers[1 - top], prev = layers[top];
  paint(next, t);
  top = 1 - top;
  window.gsap.killTweensOf(next);
  window.gsap.set(next, { zIndex: ++z, opacity: 0 });
  window.gsap.to(next, {
    opacity: 1, duration: RM ? .001 : duration, ease,
    onComplete: () => window.gsap.set(prev, { opacity: 0 })
  });
  document.documentElement.style.setProperty('--acc', rgba(t.accent, .45));
}
paint(layers[0], THEMES.base);
