export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
export const mobileMQ = matchMedia('(max-width: 899px)');
export const isMobile = () => mobileMQ.matches;
export const fa = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const d = x => (RM ? 0.001 : x);           // reduced-motion aware duration
export const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export const rgb2hex = a => '#' + a.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => rgb2hex(hex2rgb(a).map((v, i) => lerp(v, hex2rgb(b)[i], t)));
export const storage = {
  get(k, f) { try { const v = localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch { return f; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } }
};
export const wait = ms => new Promise(r => setTimeout(r, ms));
export function loadImg(src) {
  return new Promise(res => { const i = new Image(); i.decoding = 'async'; i.onload = i.onerror = () => res(i); i.src = src; });
}
