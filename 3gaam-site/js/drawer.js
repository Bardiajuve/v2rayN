import { $, $$, fa, d, isMobile } from './util.js';
import { DB, inquiry } from './state.js';
const gsap = window.gsap;

const drawer = $('#drawer'), scrim = $('#scrim'), body = $('#drawer-body');
let opener = null, isOpen = false;

const EMPTY_SVG = '<svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 40c0-6 4-8 9-9l9-2 6-9c2-3 6-3 8 0l4 7c5 2 9 5 9 11v4H8z"/><path d="M8 48h48"/></svg>';

/* Renders the inquiry list into any container (drawer or full page). */
export function renderInquiry(root) {
  const L = inquiry.lines;
  root.innerHTML = '';
  if (!L.length) {
    root.innerHTML = `<div class="iq-empty">${EMPTY_SVG}<p>لیست استعلام شما خالی است.</p><p style="font-size:13px;color:var(--faint)">مدل‌های دلخواه را اضافه کنید و یک‌جا برای قیمت عمده بفرستید.</p><a class="btn btn-lime" href="#/wall" data-close-drawer>دیدن همه مدل‌ها</a></div>`;
    return;
  }
  const list = document.createElement('div'); list.className = 'iq-list';
  L.forEach(l => {
    const row = document.createElement('div'); row.className = 'iq';
    row.style.setProperty('--t1', l.c.theme.bg); row.style.setProperty('--t2', l.c.theme.bg2);
    row.innerHTML = `
      <div class="iq-img"><img src="${l.c.imageSm}" alt="${l.p.fa} — رنگ ${l.c.name}"></div>
      <div><h3>${l.p.fa}</h3><p>${l.c.name} · ${l.p.soleLabel}</p><p><b>${fa(l.cartons * DB.carton.pairs)}</b> جفت</p></div>
      <div class="iq-side">
        <div class="mini-st" role="group" aria-label="تعداد کارتن">
          <button type="button" data-a="dec" aria-label="کاهش">−</button><output>${fa(l.cartons)}</output><button type="button" data-a="inc" aria-label="افزایش">+</button>
        </div>
        <button type="button" class="iq-rm" data-a="rm">حذف</button>
      </div>`;
    row.addEventListener('click', e => {
      const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
      if (a === 'inc') inquiry.set(l.p.slug, l.c.id, l.cartons + 1);
      if (a === 'dec') inquiry.set(l.p.slug, l.c.id, l.cartons - 1);
      if (a === 'rm') inquiry.remove(l.p.slug, l.c.id);
    });
    list.append(row);
  });
  root.append(list);

  const tot = document.createElement('div'); tot.className = 'iq-total';
  tot.innerHTML = `<span>جمع کل</span><b>${fa(inquiry.cartons)} کارتن · ${fa(inquiry.pairs)} جفت</b>`;
  root.append(tot);

  const form = document.createElement('div'); form.className = 'iq-form';
  form.innerHTML = `<input name="shop" placeholder="نام فروشگاه (اختیاری)" autocomplete="organization" value="${inquiry.meta.shop || ''}" aria-label="نام فروشگاه"><input name="city" placeholder="شهر (اختیاری)" autocomplete="address-level2" value="${inquiry.meta.city || ''}" aria-label="شهر">`;
  root.append(form);

  const act = document.createElement('div'); act.className = 'iq-actions';
  act.innerHTML = `<a class="btn btn-lime btn-block" id="iq-wa" target="_blank" rel="noopener" href="${inquiry.waUrl()}"><span>ارسال لیست در واتساپ</span></a>
    <a class="btn btn-ghost btn-block" href="tel:09126779887">تماس با مدیر فروش · ۰۹۱۲۶۷۷۹۸۸۷</a>
    <button type="button" class="iq-rm" id="iq-clear" style="align-self:center;margin-top:4px">پاک کردن لیست</button>
    <p class="iq-note">قیمتی روی سایت نمایش داده نمی‌شود؛ پس از دریافت لیست، قیمت عمده اعلام می‌شود. حداقل سفارش هر مدل ${fa(DB.carton.min)} کارتن است.</p>`;
  root.append(act);
  form.addEventListener('input', () => {
    inquiry.setMeta({ shop: form.shop.value, city: form.city.value });
    $('#iq-wa', root).href = inquiry.waUrl();
  });
  $('#iq-clear', root).onclick = () => inquiry.clear();
}

const pageRoot = () => $('#inq-page');
function renderAll() {
  $('#inq-count').textContent = fa(inquiry.cartons);
  if (isOpen) renderInquiry(body);
  if (pageRoot() && $('#v-inquiry').classList.contains('is-active')) renderInquiry(pageRoot());
}

export function openDrawer() {
  if (isOpen) return;
  isOpen = true; opener = document.activeElement;
  $('#toast').classList.remove('on'); gsap.set('#toast', { opacity: 0, yPercent: 160 });
  renderInquiry(body);
  drawer.hidden = false; scrim.hidden = false;
  const m = isMobile();
  gsap.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: d(.4) });
  gsap.fromTo(drawer, m ? { yPercent: 105 } : { xPercent: -105 }, { yPercent: 0, xPercent: 0, duration: d(.75), ease: 'expo.out' });
  gsap.from('.iq', { y: 24, opacity: 0, stagger: .05, delay: .15, duration: d(.6), ease: 'expo.out' });
  $('#drawer-close').focus({ preventScroll: true });
}
export function closeDrawer() {
  if (!isOpen) return;
  isOpen = false;
  const m = isMobile();
  gsap.to(scrim, { opacity: 0, duration: d(.3) });
  gsap.to(drawer, m ? { yPercent: 105, duration: d(.5), ease: 'expo.in' } : { xPercent: -105, duration: d(.5), ease: 'expo.in' }).eventCallback('onComplete', () => { drawer.hidden = true; scrim.hidden = true; });
  opener?.focus?.({ preventScroll: true });
}

export function initDrawer() {
  $('#inq-btn').addEventListener('click', () => (isOpen ? closeDrawer() : openDrawer()));
  $('#drawer-close').addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);
  addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) closeDrawer(); });
  drawer.addEventListener('click', e => { if (e.target.closest('[data-close-drawer]')) closeDrawer(); });
  // mobile bottom sheet: drag the grip down to dismiss
  let y0 = null;
  drawer.addEventListener('pointerdown', e => { if (isMobile() && e.target.closest('.drawer-grip,.drawer-head')) y0 = e.clientY; });
  addEventListener('pointermove', e => { if (y0 != null) gsap.set(drawer, { y: Math.max(0, e.clientY - y0) }); });
  addEventListener('pointerup', e => {
    if (y0 == null) return; const dy = e.clientY - y0; y0 = null;
    if (dy > 90) { gsap.set(drawer, { y: 0 }); closeDrawer(); } else gsap.to(drawer, { y: 0, duration: d(.4), ease: 'expo.out' });
  });
  inquiry.addEventListener('change', renderAll);
  renderAll();
}
export { renderAll as refreshInquiry };
