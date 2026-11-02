import { createShoe, studio, THREE } from "./shoe3d.js";
const D = window.SG_DATA, lerp = (a, b, t) => a + (b - a) * t;
const host = document.getElementById("v3d");
if (host) (async () => {
  const p = D.products.find(x => x.slug === new URLSearchParams(location.search).get("p")) || D.products[0];
  const canvas = document.createElement("canvas"); host.append(canvas);
  host.insertAdjacentHTML("beforeend", '<div class="tools"><button type="button" id="vex">نمای انفجاری</button><span>بکشید و بچرخانید</span></div>');
  let r; try { r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { host.style.display = "none"; return; }
  r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = .9;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, .1, 50); cam.position.set(0, .7, 9.6); cam.lookAt(0, .1, 0);
  const lights = await studio(r, scene);
  const high = p.cat === "hightop" ? 1 : p.cat === "runner" ? .35 : 0;
  const shoe = createShoe({ color: p.colors[0][1], high }); scene.add(shoe.group);
  addEventListener("sg:color", e => shoe.setColor(e.detail));
  let ry = -.55, rx = 0, vy = .004, drag = false, lx = 0, ly = 0, ex = 0, exT = 0, mx = 0, my = 0;
  canvas.style.touchAction = "pan-y";
  canvas.addEventListener("pointerdown", e => { drag = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); host.classList.add("drag"); });
  canvas.addEventListener("pointermove", e => {
    const b = canvas.getBoundingClientRect(); mx = (e.clientX - b.left) / b.width * 2 - 1; my = -((e.clientY - b.top) / b.height * 2 - 1);
    if (!drag) return; vy = (e.clientX - lx) * .008; ry += vy; rx = Math.max(-.6, Math.min(.9, rx + (e.clientY - ly) * .004)); lx = e.clientX; ly = e.clientY;
  });
  const up = () => { drag = false; host.classList.remove("drag"); }; canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  $("#vex").onclick = () => { exT = exT ? 0 : 1; $("#vex").classList.toggle("on", !!exT); };
  function $(s) { return host.querySelector(s); }
  function size() { const w = host.clientWidth || 1, h = host.clientHeight || 1; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  new ResizeObserver(size).observe(host); size();
  const clock = new THREE.Clock(); let t = 0;
  (function loop() {
    requestAnimationFrame(loop); if (!host.offsetParent) return;
    const dt = Math.min(clock.getDelta(), .05); t += dt;
    if (!drag) { vy += (.0035 - vy) * .03; ry += vy; }
    ex += (exT - ex) * (1 - Math.exp(-dt * 4)); shoe.setExplode(ex); shoe.setHighlight(exT ? (t * .8) % 4 : -1);
    shoe.group.rotation.set(rx + my * -.05, ry + mx * .12, 0); shoe.inner.position.y = -(high ? .65 : .45) + Math.sin(t * 1.4) * .03 + (exT ? .0 : 0);
    cam.position.z = 9.6 + ex * 1.8; lights.mouse.position.set(mx * 5, my * 3 + 1, 3.5);
    r.render(scene, cam);
  })();
})();
