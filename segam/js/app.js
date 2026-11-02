(function () {
  const D = window.SG_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fa = n => Number(n).toLocaleString("fa-IR");
  const page = document.body.dataset.page;
  const P = D.products;
  const bySlug = s => P.find(p => p.slug === s);
  const telDisp = n => n.replace(/^0(\d{3})(\d{3})(\d{4})$/, "0$1 $2 $3");
  const landDisp = n => n.replace(/^021(\d{4})(\d{4})$/, "۰۲۱-$1 $2").replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
  const faDigits = s => String(s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);

  /* ---------- placeholder shoe (used until real photos are uploaded) ---------- */
  function ph(color = "#2b7bbd", bg = "#14171c") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="${bg}"/><circle cx="200" cy="250" r="150" fill="${color}" opacity=".2"/>
<g transform="translate(0,70)"><path d="M40 190C40 140 70 120 110 116L150 78C165 66 185 68 195 80L215 108C250 118 300 128 340 158C360 173 366 188 366 196L40 196Z" fill="${color}" stroke="#0d0d0d" stroke-width="6" stroke-linejoin="round"/>
<path d="M150 80l30 40M178 92l28 36M205 108l24 30" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".85"/>
<rect x="28" y="192" width="350" height="34" rx="17" fill="#fff" stroke="#0d0d0d" stroke-width="6"/>
<path d="M60 209h290" stroke="#0d0d0d" stroke-width="3" stroke-dasharray="3 9" stroke-linecap="round"/></g></svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }
  const imgSrc = (p, i) => `images/products/${p.slug}/${i}.jpg`;
  function imgTag(src, color, cls = "", alt = "") {
    return `<img class="${cls}" src="${src}" alt="${alt}" loading="lazy" onerror="this.onerror=null;this.src='${ph(color)}'">`;
  }

  /* ---------- cart ---------- */
  const KEY = "segam_order_v1";
  const cart = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} updateBadge(); },
    add(slug, ci, n) {
      const c = this.get(), f = c.find(x => x.slug === slug && x.ci === ci);
      f ? (f.n += n) : c.push({ slug, ci, n });
      this.set(c);
    },
    total() { return this.get().reduce((a, x) => a + x.n, 0); }
  };
  function updateBadge() { const b = $("#cartN"); if (b) b.textContent = fa(cart.total()); }
  function toast(msg) {
    let t = $(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.append(t); }
    t.textContent = msg; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 2400);
  }

  /* ---------- layout ---------- */
  const nav = [["index.html", "خانه", "home"], ["shop.html", "محصولات", "shop"], ["about.html", "درباره سه‌گام", "about"], ["shipping.html", "نحوه خرید و ارسال", "shipping"], ["contact.html", "تماس با ما", "contact"]];
  const B = D.brand;
  $("#site-header").outerHTML = `
  <div class="strip"><div class="wrap"><span>🚚 موجودی‌ها <b>همان روز ارسال</b> می‌شوند</span>
  <span>مدیر فروش: <a href="tel:${B.phones[0].num}"><b>${faDigits(telDisp(B.phones[0].num))}</b></a></span></div></div>
  <header class="site"><div class="wrap">
    <a class="logo" href="index.html" aria-label="سه‌گام"><img src="images/logo-wide.jpg" alt="گروه تولیدی کفش سه‌گام" onerror="this.outerHTML='<b>سه‌گام</b>'"></a>
    <nav class="main" id="nav">${nav.map(n => `<a href="${n[0]}" class="${n[2] === page ? "on" : ""}">${n[1]}</a>`).join("")}</nav>
    <div class="hbtns"><a class="cartbtn" href="cart.html">🧾 <span class="t">لیست استعلام</span><span class="n" id="cartN">۰</span></a>
    <button class="burger" id="burger" aria-label="منو">☰</button></div></div></header>`;
  $("#site-footer").outerHTML = `
  <footer class="site"><div class="wrap">
    <div class="huge" aria-hidden="true">سه‌گام</div>
    <div class="cols">
      <div><a class="logo f" href="index.html"><img src="images/logo-wide.jpg" alt="سه‌گام"></a><p style="margin-top:14px">گروه تولیدی کفش سه‌گام؛ بیش از ۴ دهه تجربه در تولید و عرضه عمده کفش اسپرت.</p></div>
      <div><h4>صفحات</h4>${nav.map(n => `<a href="${n[0]}">${n[1]}</a>`).join("")}<a href="cart.html">لیست استعلام</a></div>
      <div><h4>دسته‌ها</h4>${Object.entries(D.cats).map(([k, v]) => `<a href="shop.html?cat=${k}">${v}</a>`).join("")}</div>
      <div><h4>تماس</h4>
        ${B.phones.map(p => `<a class="ltr" href="tel:${p.num}">${p.label}: ${faDigits(telDisp(p.num))}</a>`).join("")}
        ${B.landlines.map(l => `<a class="ltr" href="tel:${l}">${landDisp(l)}</a>`).join("")}
        <p style="margin-top:8px;font-size:14px">${B.address}</p></div>
    </div>
    <div class="copy"><span>© ${new Date().toLocaleDateString("fa-IR", { year: "numeric" })} گروه تولیدی کفش سه‌گام — تمامی حقوق محفوظ است</span><span>فروش عمده، مستقیم از تولیدکننده</span></div></div></footer>
  <div class="fab"><a class="wa" href="https://wa.me/${B.whatsapp}" target="_blank" rel="noopener" aria-label="واتساپ">💬</a><a class="ph" href="tel:${B.phones[0].num}" aria-label="تماس">📞</a></div>`;
  $("#burger").onclick = () => $("#nav").classList.toggle("open");
  updateBadge();

  /* reveal on scroll */
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 }) : null;
  const reveal = () => $$(".rv:not(.in)").forEach(el => io ? io.observe(el) : el.classList.add("in"));

  /* ---------- product card ---------- */
  function card(p) {
    const c0 = p.colors[0][1];
    return `<a class="card rv" href="product.html?p=${p.slug}">
      <div class="ph">${p.tag ? `<span class="tag">${p.tag}</span>` : ""}<span class="tag sole">${D.soles[p.sole].name.split(" ")[0]}</span>
        ${imgTag(imgSrc(p, 1), c0, "a", p.name)}${imgTag(imgSrc(p, 2), c0, "b", "")}</div>
      <div class="bd"><h3>${p.name}</h3>
        <div class="meta"><span>${D.cats[p.cat]}</span><span class="dots">${p.colors.map(c => `<i style="background:${c[1]}" title="${c[0]}"></i>`).join("")}</span></div>
        <div class="pr"><div><small>سایز ${faDigits(p.sizes.replace("-", " تا "))}</small><br><b class="inqt">استعلام قیمت عمده</b></div><span class="go">←</span></div></div></a>`;
  }

  /* ================= pages ================= */
  if (page === "home") {
    $("#featured").innerHTML = P.map(card).join("");
  }

  if (page === "shop") {
    const q = new URLSearchParams(location.search);
    const st = { cat: q.get("cat") || "", sole: q.get("sole") || "", gender: "", q: "", sort: "def" };
    const gm = { men: "مردانه", women: "زنانه", unisex: "یونیسکس" };
    const chips = (id, label, obj, key) => {
      $(id).innerHTML = `<b>${label}</b><button class="chip" data-k="${key}" data-v="">همه</button>` + Object.entries(obj).map(([k, v]) => `<button class="chip" data-k="${key}" data-v="${k}">${v}</button>`).join("");
    };
    chips("#fCat", "دسته:", D.cats, "cat");
    chips("#fSole", "زیره:", Object.fromEntries(Object.entries(D.soles).map(([k, v]) => [k, v.name])), "sole");
    chips("#fGender", "جنسیت:", gm, "gender");
    const render = () => {
      $$(".chip").forEach(c => c.classList.toggle("on", st[c.dataset.k] === c.dataset.v));
      let l = P.filter(p => (!st.cat || p.cat === st.cat) && (!st.sole || p.sole === st.sole) && (!st.gender || p.gender === st.gender) && (!st.q || (p.name + p.desc + D.cats[p.cat]).includes(st.q)));
      if (st.sort === "hot") l.sort((a, b) => (b.tag ? 1 : 0) - (a.tag ? 1 : 0));
      $("#count").textContent = `${fa(l.length)} مدل`;
      $("#list").innerHTML = l.length ? l.map(card).join("") : `<div class="empty">مدلی با این فیلتر پیدا نشد.</div>`;
      reveal();
    };
    document.addEventListener("click", e => { const c = e.target.closest(".chip"); if (c) { st[c.dataset.k] = c.dataset.v; render(); } });
    $("#q").oninput = e => { st.q = e.target.value.trim(); render(); };
    $("#sort").onchange = e => { st.sort = e.target.value; render(); };
    render();
  }

  if (page === "product") {
    const p = bySlug(new URLSearchParams(location.search).get("p")) || P[0];
    document.title = `${p.name} | سه‌گام`;
    let ci = 0, n = D.minCartons, cur = 0;
    const sizes = (() => {
      const [a, b] = p.sizes.split("-").map(Number), cnt = b - a + 1, base = Math.floor(D.cartonPairs / cnt);
      const arr = []; for (let s = a; s <= b; s++) arr.push([s, base]);
      let sum = base * cnt; for (let i = 1; sum < D.cartonPairs; i = (i + 2) % arr.length) { arr[i][1]++; sum++; }
      return arr;
    })();
    const rel = P.filter(x => x.cat === p.cat && x.slug !== p.slug).concat(P.filter(x => x.cat !== p.cat)).slice(0, 4);
    $("#pd").innerHTML = `
    <div class="gal"><div class="v3d" id="v3d"></div><div class="main" id="gm" style="display:none"></div><div class="th" id="th"></div></div>
    <div class="pinfo">
      <div class="crumb"><a href="index.html">خانه</a> / <a href="shop.html?cat=${p.cat}">${D.cats[p.cat]}</a></div>
      ${p.tag ? `<span class="eyebrow">${p.tag}</span>` : ""}
      <h1>${p.name}</h1><p class="desc">${p.desc}</p>
      <div class="price-box"><div><small>قیمت عمده</small><div class="big">استعلام از مدیر فروش</div><small>قیمت ویژه بر اساس مدل و حجم سفارش</small></div>
        <a class="btn btn-lime btn-sm" href="tel:${B.phones[0].num}">تماس مستقیم</a></div>
      <div class="opt"><h4>رنگ: <span id="cn">${p.colors[0][0]}</span></h4><div class="swatches">${p.colors.map((c, i) => `<button class="sw ${i ? "" : "on"}" data-i="${i}"><i style="background:${c[1]}"></i>${c[0]}</button>`).join("")}</div></div>
      <div class="opt"><h4>سایزبندی هر کارتن (${fa(D.cartonPairs)} جفت)</h4><div class="sizes">${sizes.map(s => `<div><b>${fa(s[0])}</b><span>${fa(s[1])} جفت</span></div>`).join("")}</div></div>
      <div class="opt"><h4>تعداد کارتن (حداقل ${fa(D.minCartons)})</h4>
        <div class="sticky-buy"><div class="qty"><button id="mi">−</button><input id="qn" value="${fa(n)}" inputmode="numeric"><button id="pl">+</button></div>
        <div><b id="pairs" style="font-size:22px"></b> <small style="color:var(--mute)">جفت</small></div></div></div>
      <div class="sticky-buy"><button class="btn btn-acc" id="add">افزودن به لیست استعلام</button><a class="btn btn-lime" id="waq" target="_blank" rel="noopener">استعلام قیمت در واتساپ</a></div>
      <table class="spec" style="margin-top:26px"><tr><td>دسته</td><td>${D.cats[p.cat]}</td></tr><tr><td>نوع زیره</td><td>${D.soles[p.sole].name} — ${D.soles[p.sole].text}</td></tr>
      <tr><td>سایز</td><td>${faDigits(p.sizes.replace("-", " تا "))}</td></tr><tr><td>جنسیت</td><td>${{ men: "مردانه", women: "زنانه", unisex: "یونیسکس" }[p.gender]}</td></tr>
      <tr><td>بسته‌بندی</td><td>کارتن ${fa(D.cartonPairs)} جفتی</td></tr></table>
    </div>`;
    $("#related").innerHTML = rel.map(card).join("");
    const paint = () => {
      const c = p.colors[ci][1];
      $("#gm").innerHTML = imgTag(imgSrc(p, cur || 1), c, "", p.name);
      $("#gm").style.display = cur ? "" : "none"; $("#v3d").style.display = cur ? "none" : "";
      dispatchEvent(new CustomEvent("sg:color", { detail: p.colors[ci][1] }));
      $("#th").innerHTML = `<button class="${cur === 0 ? "on" : ""}" data-i="0" style="font-weight:900;color:var(--lime);font-size:20px">3D</button>` + [1, 2, 3].map(i => `<button class="${i === cur ? "on" : ""}" data-i="${i}">${imgTag(imgSrc(p, i), c)}</button>`).join("");
      $("#cn").textContent = p.colors[ci][0];
      $("#pairs").textContent = fa(n * D.cartonPairs);
      $("#qn").value = fa(n);
      $("#waq").href = `https://wa.me/${B.whatsapp}?text=` + encodeURIComponent(`سلام، استعلام قیمت عمده:\n${p.name}\nرنگ: ${p.colors[ci][0]}\nتعداد: ${n} کارتن (${n * D.cartonPairs} جفت)`);
    };
    $("#th").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { cur = +b.dataset.i; paint(); } });
    $$(".sw").forEach(b => b.onclick = () => { ci = +b.dataset.i; $$(".sw").forEach(x => x.classList.toggle("on", x === b)); paint(); });
    $("#mi").onclick = () => { n = Math.max(1, n - 1); paint(); };
    $("#pl").onclick = () => { n++; paint(); };
    $("#qn").onchange = e => { const v = parseInt(e.target.value.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))); n = v > 0 ? v : 1; paint(); };
    $("#add").onclick = () => { cart.add(p.slug, ci, n); toast("به لیست استعلام اضافه شد ✓"); };
    paint(); reveal();
  }

  if (page === "cart") {
    const draw = () => {
      const c = cart.get().filter(x => bySlug(x.slug));
      const box = $("#cbody");
      if (!c.length) { box.innerHTML = `<div class="emptycart"><b>لیست استعلام شما خالی است</b><p style="margin-bottom:20px">مدل‌های مورد نظر را از کاتالوگ انتخاب کنید.</p><a class="btn btn-acc" href="shop.html">مشاهده محصولات</a></div>`; return; }
      const cartons = c.reduce((a, x) => a + x.n, 0), need = cartons < D.minCartons;
      const rows = c.map((x, i) => { const p = bySlug(x.slug), col = p.colors[x.ci] || p.colors[0];
        return `<div class="citem"><a href="product.html?p=${p.slug}">${imgTag(imgSrc(p, 1), col[1], "", p.name)}</a>
        <div><h4>${p.name}</h4><small>رنگ: ${col[0]} · سایز ${faDigits(p.sizes.replace("-", " تا "))}</small><small>${fa(x.n * D.cartonPairs)} جفت (${fa(x.n)} کارتن)</small><button class="rm" data-i="${i}">حذف</button></div>
        <div class="side"><div class="qty"><button data-d="-1" data-i="${i}">−</button><input readonly value="${fa(x.n)}"><button data-d="1" data-i="${i}">+</button></div></div></div>`; }).join("");
      box.innerHTML = `<div class="cartgrid"><div>${need ? `<div class="warn">حداقل سفارش ${fa(D.minCartons)} کارتن است؛ لطفاً تعداد را افزایش دهید.</div>` : ""}${rows}</div>
      <aside class="sum"><h3>درخواست قیمت عمده</h3>
        <div class="row"><span>تعداد مدل</span><b>${fa(c.length)}</b></div><div class="row"><span>تعداد کارتن</span><b>${fa(cartons)}</b></div><div class="row t"><span>جمع جفت</span><b>${fa(cartons * D.cartonPairs)}</b></div>
        <label>نام و نام خانوادگی / فروشگاه<input id="cn1"></label><label>شماره تماس<input id="cp1" inputmode="tel" dir="ltr"></label><label>شهر و توضیحات<textarea id="cd1" rows="2"></textarea></label>
        <button class="btn btn-lime" id="wa">ارسال استعلام در واتساپ</button><button class="btn btn-line" style="color:#fff;border-color:#555" id="cp">کپی متن استعلام</button>
        <p style="font-size:12px;color:#999;margin-top:12px">قیمت عمده و موجودی توسط مدیر فروش پس از دریافت لیست اعلام می‌شود.</p></aside></div>`;
      const text = () => {
        let t = `درخواست قیمت عمده از سایت سه‌گام\n\n`;
        c.forEach(x => { const p = bySlug(x.slug); t += `• ${p.name} | ${(p.colors[x.ci] || p.colors[0])[0]} | ${fa(x.n)} کارتن (${fa(x.n * D.cartonPairs)} جفت)\n`; });
        return t + `\nجمع: ${fa(cartons)} کارتن / ${fa(cartons * D.cartonPairs)} جفت\n\nنام: ${$("#cn1").value}\nتلفن: ${$("#cp1").value}\nتوضیحات: ${$("#cd1").value}`;
      };
      $("#wa").onclick = () => open(`https://wa.me/${B.whatsapp}?text=${encodeURIComponent(text())}`, "_blank");
      $("#cp").onclick = () => { navigator.clipboard?.writeText(text()).then(() => toast("متن استعلام کپی شد ✓")); };
    };
    $("#cbody").addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b || (b.dataset.i === undefined)) return;
      const c = cart.get(), i = +b.dataset.i;
      if (b.classList.contains("rm")) c.splice(i, 1); else if (b.dataset.d) c[i].n = Math.max(1, c[i].n + +b.dataset.d);
      cart.set(c); draw();
    });
    draw();
  }

  if (page === "contact") {
    $("#cf").onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target);
      open(`https://wa.me/${B.whatsapp}?text=${encodeURIComponent(`پیام از سایت سه‌گام\nنام: ${f.get("n")}\nتلفن: ${f.get("p")}\n\n${f.get("m")}`)}`, "_blank");
    };
  }

  reveal();
})();
