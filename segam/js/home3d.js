import { createShoe, studio, THREE } from "./shoe3d.js";

const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);

(async function () {
  const canvas = document.createElement("canvas"); canvas.id = "gl"; document.body.prepend(canvas);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" }); }
  catch (e) { document.body.classList.add("no-webgl"); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .9;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, .1, 80);
  const lights = await studio(renderer, scene);

  const shoe = createShoe({ color: "#2f86d0", high: 1 });
  const rig = new THREE.Group(); rig.add(shoe.group); scene.add(rig);

  /* floor glow + rings that follow the shoe */
  const floor = new THREE.Group(); scene.add(floor);
  const rc = document.createElement("canvas"); rc.width = rc.height = 256; { const g = rc.getContext("2d"), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, "rgba(47,134,208,.55)"); gr.addColorStop(.5, "rgba(47,134,208,.12)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(rc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.rotation.x = -Math.PI / 2; floor.add(glow);
  const ringA = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.225, 160), new THREE.MeshBasicMaterial({ color: 0xd4ff3a, transparent: true, opacity: .7, side: THREE.DoubleSide }));
  const ringB = new THREE.Mesh(new THREE.RingGeometry(2.9, 2.91, 160), new THREE.MeshBasicMaterial({ color: 0x2f86d0, transparent: true, opacity: .5, side: THREE.DoubleSide }));
  ringA.rotation.x = ringB.rotation.x = -Math.PI / 2; floor.add(ringA, ringB);

  /* particles */
  const N = innerWidth < 800 ? 500 : 1400, pg = new THREE.BufferGeometry(), pp = new Float32Array(N * 3), ps = new Float32Array(N);
  for (let i = 0; i < N; i++) { pp[i * 3] = (Math.random() - .5) * 22; pp[i * 3 + 1] = (Math.random() - .5) * 14 - 2; pp[i * 3 + 2] = (Math.random() - .5) * 16 - 2; ps[i] = Math.random(); }
  pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
  const dc = document.createElement("canvas"); dc.width = dc.height = 32; { const g = dc.getContext("2d"), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "#fff"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: .07, map: new THREE.CanvasTexture(dc), color: 0x9fc8ff, transparent: true, opacity: .75, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(pts);

  /* ---------- keyframes ---------- */
  const K = o => Object.assign({ px: 0, py: 0, pz: 0, rx: 0, ry: 0, rz: 0, s: 1, ex: 0, hl: -1, spin: 0, cx: 0, cy: .5, cz: 9.5 }, o);
  const KF = {
    hero:  K({ px: -2.0, py: -.25, s: .92, ry: -.5, rz: .05, spin: .12 }),
    scrub: K({ px: 2.6, py: -.9, pz: -1, s: .8, ry: -2.5, rz: -.18, spin: .2, cx: -.6 }),
    s0:    K({ px: -2.2, py: -.1, s: 1.1, ry: -.25, rz: .0, ex: 0 }),
    s1:    K({ px: -2.0, py: -.25, s: .74, ry: -.7, rx: .1, rz: .06, ex: .8, hl: 0, cy: .9, cz: 10.5 }),
    s2:    K({ px: -2.0, py: -.25, s: .74, ry: -1.05, rx: .12, rz: .08, ex: 1, hl: 1, cy: .3, cz: 10.5 }),
    s3:    K({ px: -2.0, py: -.25, s: .78, ry: -.28, rx: .0, rz: -.05, ex: 1, hl: 2, cy: .05, cz: 10.5 }),
    s4:    K({ px: -2.0, py: -.15, s: .74, ry: -.5, rx: 3.0, rz: .05, ex: 1, hl: 3, cy: 1.0, cz: 10.5 }),
    out:   K({ px: 0, py: -3.5, pz: -3, s: 0, ry: 1, ex: 0 }),
    mega:  K({ px: 3.5, py: -.3, s: .85, ry: -.4, spin: .35, cz: 9.5 })
  };
  const anchors = [];
  const top = el => el.getBoundingClientRect().top + scrollY;
  function buildAnchors() {
    anchors.length = 0; const vh = innerHeight, yc = el => top(el) + el.offsetHeight / 2 - vh / 2;
    const add = (y, kf) => anchors.push({ y, kf });
    const hero = $("#hero"), scrub = $(".scrub"), story = $("#story"), stats = $(".stats"), reel = $("#reel"), mega = $(".mega");
    if (hero) add(0, KF.hero);
    if (scrub) add(yc(scrub), KF.scrub);
    if (story) {
      const t0 = top(story), H = story.offsetHeight - vh;
      add(t0 - vh * .2, KF.s0); add(t0 + H * .02, KF.s0);
      [KF.s1, KF.s2, KF.s3, KF.s4].forEach((kf, i) => add(t0 + H * (.125 + i * .25), kf));
      add(t0 + H, KF.s4); add(t0 + H + vh * .6, KF.out);
    }
    if (stats) add(yc(stats), KF.out);
    if (reel) add(top(reel) + reel.offsetHeight, KF.out);
    if (mega) { add(top(mega) - vh * .5, KF.out); add(yc(mega), KF.mega); }
    anchors.sort((a, b) => a.y - b.y);
    for (let i = 1; i < anchors.length; i++) if (anchors[i].y <= anchors[i - 1].y) anchors[i].y = anchors[i - 1].y + 1;
  }
  const FIELDS = Object.keys(KF.hero);
  const target = K({}), cur = K({ s: 0, ry: -1.6, ex: 0 });
  function evalAt(y) {
    if (!anchors.length) return;
    let i = 0; while (i < anchors.length - 1 && y > anchors[i + 1].y) i++;
    const a = anchors[i], b = anchors[Math.min(i + 1, anchors.length - 1)];
    const t = a === b ? 0 : ease(clamp((y - a.y) / (b.y - a.y)));
    FIELDS.forEach(f => (target[f] = lerp(a.kf[f], b.kf[f], t)));
  }

  /* ---------- input ---------- */
  const m = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener("pointermove", e => { m.tx = e.clientX / innerWidth * 2 - 1; m.ty = -(e.clientY / innerHeight * 2 - 1); }, { passive: true });
  let lastY = scrollY, vel = 0;

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); buildAnchors();
  }
  addEventListener("resize", resize); resize();
  addEventListener("load", () => { buildAnchors(); setTimeout(buildAnchors, 700); });
  setTimeout(buildAnchors, 200); setTimeout(buildAnchors, 900);

  /* optional real model: models/shoe.glb replaces the procedural shoe */
  fetch("models/shoe.glb", { method: "HEAD" }).then(async r => {
    if (!r.ok || !(r.headers.get("content-type") || "").match(/gltf|octet/)) return;
    const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
    new GLTFLoader().load("models/shoe.glb", g => {
      const box = new THREE.Box3().setFromObject(g.scene), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
      g.scene.position.sub(c); const k = 3.2 / Math.max(size.x, size.z); g.scene.scale.setScalar(k); g.scene.position.multiplyScalar(k);
      shoe.group.visible = false; rig.add(g.scene);
    });
  }).catch(() => {});

  /* ---------- loop ---------- */
  const clock = new THREE.Clock(); let t = 0; document.body.classList.add("has-gl");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), .05); t += dt;
    const sy = scrollY; vel = lerp(vel, (sy - lastY) / Math.max(dt, .001), .15); lastY = sy;
    evalAt(sy);
    const k = 1 - Math.exp(-dt * 5.5); FIELDS.forEach(f => (cur[f] += (target[f] - cur[f]) * k));
    m.x += (m.tx - m.x) * (1 - Math.exp(-dt * 6)); m.y += (m.ty - m.y) * (1 - Math.exp(-dt * 6));

    const narrow = camera.aspect < .95, sc = cur.s * (narrow ? .5 : 1);
    rig.visible = sc > .02; floor.visible = rig.visible;
    rig.position.set(narrow ? 0 : cur.px, cur.py + (narrow ? .95 : 0), cur.pz);
    rig.scale.setScalar(Math.max(sc, .001));
    const spin = reduce ? 0 : t * cur.spin;
    shoe.group.rotation.set(cur.rx + m.y * -.18, cur.ry + spin + m.x * .55, cur.rz + clamp(vel * .00012, -.35, .35) + m.y * .1);
    shoe.setExplode(cur.ex); shoe.setHighlight(cur.hl);
    shoe.inner.position.y = -.55 + Math.sin(t * 1.3) * .035;

    floor.position.set(rig.position.x, rig.position.y - 1.15 * sc * (1 + cur.ex * .55), rig.position.z);
    floor.scale.setScalar(Math.max(sc, .001) * .9); ringA.rotation.z = t * .5; ringB.rotation.z = -t * .25;
    glow.material.opacity = .5 + Math.sin(t * 2) * .08;

    camera.position.set(cur.cx + m.x * .45, cur.cy + m.y * .3, cur.cz); camera.lookAt(cur.cx * .2, .1, 0);
    lights.mouse.position.set(m.x * 6, m.y * 3 + 1, 3.5);
    lights.blue.position.x = -4 + Math.sin(t * .6) * 1.5; lights.lime.position.y = -1 + Math.cos(t * .5) * 1.5;

    pts.rotation.y = t * .015 + m.x * .08; pts.rotation.x = m.y * .04; pts.position.y = sy * .0007; pts.position.x = -m.x * .3;
    renderer.render(scene, camera);
  }
  frame();
})();
