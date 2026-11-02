(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fa = n => Number(n).toLocaleString("fa-IR");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer:fine)").matches;
  const page = document.body.dataset.page;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  document.body.insertAdjacentHTML("beforeend", '<div class="grain"></div><div class="vig"></div><div class="sprog"><i></i></div><div class="spot"></div><div class="wipe" id="wipe"></div>');
  const spot = $(".spot"), prog = $(".sprog i");

  /* ---------- ready / preloader ---------- */
  let seen = false; try { seen = sessionStorage.getItem("sg_pre"); } catch {}
  const ready = () => { document.body.classList.add("ready"); requestAnimationFrame(() => onScroll()); };
  if (page === "home" && !seen && !reduce) {
    try { sessionStorage.setItem("sg_pre", "1"); } catch {}
    document.body.insertAdjacentHTML("beforeend", '<div class="pre" id="pre"><div class="h t"></div><div class="h b"></div><div class="mid"><div><div class="num" id="pn">۰</div><div class="lbl">3 GAAM</div><div class="bar"><i id="pb"></i></div></div></div></div>');
    const pre = $("#pre"); let v = 0;
    const t = setInterval(() => {
      v = Math.min(100, v + 3 + Math.random() * 9);
      $("#pn").textContent = fa(Math.floor(v)); $("#pb").style.width = v + "%";
      if (v >= 100) { clearInterval(t); setTimeout(() => { pre.classList.add("go"); ready(); setTimeout(() => pre.classList.add("gone"), 1300); }, 250); }
    }, 55);
  } else { ready(); }

  /* ---------- page wipe on navigation ---------- */
  const wipe = $("#wipe");
  try { if (sessionStorage.getItem("sg_wipe")) { sessionStorage.removeItem("sg_wipe"); wipe.classList.add("out"); setTimeout(() => wipe.classList.remove("out"), 700); } } catch {}
  document.addEventListener("click", e => {
    const a = e.target.closest("a[href]"); if (!a || reduce) return;
    const h = a.getAttribute("href");
    if (!h || h[0] === "#" || /^(tel:|mailto:|https?:)/.test(h) || a.target === "_blank" || e.metaKey || e.ctrlKey) return;
    e.preventDefault(); wipe.classList.add("in");
    try { sessionStorage.setItem("sg_wipe", "1"); } catch {}
    setTimeout(() => (location.href = a.href), 430);
  });

  /* ---------- split headings into masked words ---------- */
  $$(".sh h2").forEach(h => {
    let i = 0;
    [...h.childNodes].forEach(n => {
      if (n.nodeType === 3 && n.textContent.trim()) {
        const f = document.createDocumentFragment();
        n.textContent.trim().split(/\s+/).forEach(w => { const s = document.createElement("span"); s.className = "w"; s.innerHTML = `<span style="--i:${i++}">${w}&nbsp;</span>`; f.append(s); });
        n.replaceWith(f);
      }
    });
    const sh = h.closest(".sh"); sh.classList.add("rv");
  });

  /* ---------- scrub statement ---------- */
  const sp = $("#scrub");
  if (sp) {
    const hl = (sp.dataset.hl || "").split(",");
    sp.innerHTML = sp.textContent.trim().split(/\s+/).map(w => `<span class="wd${hl.includes(w) ? " hl" : ""}">${w}</span>`).join(" ");
  }

  /* ---------- counters ---------- */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, suf = el.dataset.suf || "", t0 = performance.now();
    const step = t => { const k = clamp((t - t0) / 1600), v = Math.round(to * (1 - Math.pow(1 - k, 3))); el.textContent = fa(v) + suf; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: .5 });
  $$("[data-count]").forEach(el => cio.observe(el));

  /* ---------- scroll engine ---------- */
  const hero = $("#hero"), heroShoe = $("#heroShoe"), htext = $(".htext"), h3 = $(".h3");
  const story = $("#story"), scenes = $$(".scene"), frames = $$(".storyframes .frame"), dots = $$(".sdots i"), sbig = $(".story .big");
  const reelEl = $("#reel"), track = $("#featured"), rbar = $("#rbar");
  const words = $$(".scrub .wd"), scrubSec = $(".scrub");
  let tick = false, curScene = -1, vh = innerHeight;

  function sizeReel() {
    if (!reelEl || innerWidth <= 900) { if (reelEl) reelEl.style.height = ""; return; }
    reelEl.style.height = track.scrollWidth - innerWidth + innerHeight * 1.1 + "px";
  }
  function onScroll() {
    tick = false;
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${clamp(y / max)})`;
    if (hero && y < vh * 1.3) {
      const k = clamp(y / vh);
      if (heroShoe) heroShoe.style.transform = `translateY(${k * 120}px) rotate(${-10 + k * 14}deg) scale(${1 + k * .18})`;
      if (htext) { htext.style.transform = `translateY(${k * -60}px)`; htext.style.opacity = 1 - k * 1.1; }
      if (h3) h3.style.transform = `translateY(calc(-50% + ${k * 160}px))`;
    }
    if (scrubSec) {
      const r = scrubSec.getBoundingClientRect(), k = clamp((vh * .85 - r.top) / (r.height + vh * .3));
      const upto = Math.floor(k * 1.15 * words.length);
      words.forEach((w, i) => w.classList.toggle("on", i < upto));
    }
    if (story) {
      const r = story.getBoundingClientRect(), k = clamp(-r.top / (r.height - vh));
      const idx = Math.min(scenes.length - 1, Math.floor(k * scenes.length));
      if (idx !== curScene) {
        curScene = idx;
        scenes.forEach((s, i) => s.classList.toggle("on", i === idx));
        frames.forEach((s, i) => s.classList.toggle("on", i === idx));
        dots.forEach((s, i) => s.classList.toggle("on", i === idx));
        if (sbig) sbig.textContent = fa(idx + 1);
      }
    }
    if (reelEl && innerWidth > 900) {
      const r = reelEl.getBoundingClientRect(), k = clamp(-r.top / (reelEl.offsetHeight - vh)), tot = track.scrollWidth - innerWidth;
      track.style.transform = `translateX(${k * tot}px)`;
      if (rbar) rbar.style.transform = `scaleX(${k})`;
    }
  }
  const req = () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } };
  addEventListener("scroll", req, { passive: true });
  addEventListener("resize", () => { vh = innerHeight; sizeReel(); req(); });
  setTimeout(() => { sizeReel(); req(); }, 60); setTimeout(() => { sizeReel(); req(); }, 600);
  addEventListener("load", () => { sizeReel(); req(); });

  /* ---------- pointer effects ---------- */
  if (fine && !reduce) {
    let mx = 0, my = 0, sx = 0, sy = 0;
    addEventListener("mousemove", e => {
      mx = e.clientX; my = e.clientY; spot.classList.add("on");
      if (hero && heroShoe && scrollY < vh) {
        const px = (e.clientX / innerWidth - .5), py = (e.clientY / innerHeight - .5);
        const sh = $(".hshoe"); if (sh) sh.style.transform = `rotateY(${px * 16}deg) rotateX(${-py * 12}deg) translate(${px * 26}px,${py * 18}px)`;
      }
    });
    (function loop() { sx += (mx - sx) * .12; sy += (my - sy) * .12; spot.style.transform = `translate(${sx}px,${sy}px)`; requestAnimationFrame(loop); })();
    document.addEventListener("mousemove", e => {
      const c = e.target.closest(".card");
      if (c) {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        c.style.transform = `perspective(900px) rotateY(${x * -10}deg) rotateX(${y * 8}deg) translateY(-8px)`;
      }
      const b = e.target.closest(".btn");
      if (b) { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .3}px)`; }
    });
    document.addEventListener("mouseout", e => {
      const c = e.target.closest(".card"); if (c && !c.contains(e.relatedTarget)) c.style.transform = "";
      const b = e.target.closest(".btn"); if (b && !b.contains(e.relatedTarget)) b.style.transform = "";
    });
  }
})();

/* observe split headings (app.js ran before they got .rv) */
(function(){
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .2 });
  document.querySelectorAll(".sh.rv").forEach(el => io.observe(el));
})();
