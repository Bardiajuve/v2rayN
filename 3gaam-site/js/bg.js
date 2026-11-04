import { hex2rgb, mix, RM } from './util.js';
const el = document.getElementById('bg');
// flat numeric state so GSAP can tween every channel
const cur = { a0: 15, a1: 42, a2: 70, b0: 8, b1: 18, b2: 31, c0: 5, c1: 7, c2: 11, g0: 43, g1: 123, g2: 189 };
const rgb = (k) => `${Math.round(cur[k + '0'])},${Math.round(cur[k + '1'])},${Math.round(cur[k + '2'])}`;
const apply = () => {
  el.style.setProperty('--bg1', `rgb(${rgb('a')})`);
  el.style.setProperty('--bg2', `rgb(${rgb('b')})`);
  el.style.setProperty('--bg3', `rgb(${rgb('c')})`);
  el.style.setProperty('--glow', `rgba(${rgb('g')},.34)`);
};
export const THEMES = {
  base: { bg: '#102c4a', bg2: '#08121f', accent: '#2b7bbd' },
  dark: { bg: '#0d1b2b', bg2: '#070b11', accent: '#2b7bbd' },
};
export function setTheme(t, duration = 1.1, ease = 'power3.inOut') {
  const to = {};
  const put = (k, rgbArr) => rgbArr.forEach((v, i) => { to[k + i] = v; });
  put('a', hex2rgb(t.bg)); put('b', hex2rgb(t.bg2)); put('c', hex2rgb(mix(t.bg2, '#000000', .55))); put('g', hex2rgb(t.accent));
  window.gsap.to(cur, { ...to, duration: RM ? .001 : duration, ease, overwrite: true, onUpdate: apply });
}
apply();
