import { storage, fa } from './util.js';

export const DB = { carton: { pairs: 12, min: 2 }, soleNames: {}, products: [], flat: [], bySlug: {} };
const GENDER = { men: 'مردانه', women: 'زنانه', unisex: 'یونیسکس' };
const SIZES = { men: '۴۰ تا ۴۴', women: '۳۶ تا ۴۰', unisex: '۳۶ تا ۴۴' };
const SOLE_DESC = { pu: 'سبک و ضدلغزش', eva: 'فوق‌سبک و انعطاف‌پذیر', airbolling: 'کوسن هوا در پاشنه', pvc: 'مقاوم در برابر سایش و رطوبت' };

export async function loadData() {
  const j = await (await fetch('data/products.json')).json();
  DB.carton = j.carton; DB.soleNames = j.sole;
  DB.products = j.products.filter(p => p.colors.some(c => c.image));
  DB.products.forEach((p, i) => {
    p.index = i;
    p.colors = p.colors.filter(c => c.image);
    p.genderLabel = GENDER[p.gender]; p.sizesLabel = p.sizes || SIZES[p.gender];
    p.soleLabel = DB.soleNames[p.sole]; p.soleDesc = SOLE_DESC[p.sole];
    p.colors.forEach((c, ci) => { c.index = ci; c.product = p; });
    DB.bySlug[p.slug] = p;
  });
  DB.flat = DB.products.flatMap(p => p.colors);
  return DB;
}

/* ---- wholesale inquiry list ---- */
class Inquiry extends EventTarget {
  constructor() { super(); this.items = storage.get('3g.inq', []); this.meta = storage.get('3g.meta', { shop: '', city: '' }); }
  #emit(detail) { storage.set('3g.inq', this.items); this.dispatchEvent(new CustomEvent('change', { detail })); }
  prune() { this.items = this.items.filter(i => DB.bySlug[i.slug] && DB.bySlug[i.slug].colors.some(c => c.id === i.color)); this.#emit(); }
  add(slug, color, n) {
    const it = this.items.find(i => i.slug === slug && i.color === color);
    if (it) it.cartons = Math.min(99, it.cartons + n); else this.items.push({ slug, color, cartons: n });
    this.#emit({ added: { slug, color } });
  }
  set(slug, color, n) {
    const it = this.items.find(i => i.slug === slug && i.color === color);
    if (it) { it.cartons = Math.max(DB.carton.min, Math.min(99, n)); this.#emit(); }
  }
  remove(slug, color) { this.items = this.items.filter(i => !(i.slug === slug && i.color === color)); this.#emit(); }
  clear() { this.items = []; this.#emit(); }
  setMeta(m) { Object.assign(this.meta, m); storage.set('3g.meta', this.meta); }
  get cartons() { return this.items.reduce((a, i) => a + i.cartons, 0); }
  get pairs() { return this.cartons * DB.carton.pairs; }
  get lines() {
    return this.items.map(i => { const p = DB.bySlug[i.slug]; const c = p.colors.find(c => c.id === i.color); return { ...i, p, c }; });
  }
  message() {
    const rows = this.lines.map((l, n) => `${fa(n + 1)}) ${l.p.name} — ${l.c.name} — ${fa(l.cartons)} کارتن (${fa(l.cartons * DB.carton.pairs)} جفت)`);
    const out = ['سلام، وقت بخیر.', 'درخواست استعلام قیمت عمده از سه‌گام:', '', ...rows, '', `جمع کل: ${fa(this.cartons)} کارتن (${fa(this.pairs)} جفت)`];
    if (this.meta.shop) out.push(`فروشگاه: ${this.meta.shop}`);
    if (this.meta.city) out.push(`شهر: ${this.meta.city}`);
    out.push('', 'لطفا قیمت عمده و موجودی را اعلام بفرمایید.');
    return out.join('\n');
  }
  waUrl() { return 'https://wa.me/989126779887?text=' + encodeURIComponent(this.message()); }
}
export const inquiry = new Inquiry();
