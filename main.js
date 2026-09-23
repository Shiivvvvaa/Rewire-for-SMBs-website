/* ═══════════════════════════════════════════════════════════════════
   REWIRE AI — main.js
   One file, many small section modules. Each module is wrapped in run(),
   so a missing element or a thrown error in one never stops the others.
   Libraries (vendor/): GSAP + ScrollTrigger + SplitText + Flip, Lenis.
   ═══════════════════════════════════════════════════════════════════ */

/* ─── CONFIG: every placeholder lives here ─────────────────────────── */
const CONFIG = {
  // PLACEHOLDER: WhatsApp number in full international format, digits only.
  whatsappNumber: "00000000000",
  whatsappText: "Hello Rewire AI, I would like a free AI audit.",
  // Form endpoint (the existing n8n lead-capture webhook). Set to "" to
  // simulate a successful send while testing.
  formEndpoint: "https://n8n-cbac.srv1785299.hstgr.cloud/webhook/rewire-lead",
  // PLACEHOLDER: the live mailbox.
  email: "hi@rewireai.co",
};

/**
 * The one function the enquiry form calls. Wire it to anything.
 * Receives FormData (name, website, email, phone, process, contact_ok).
 * Sent as multipart on purpose: that is a "simple" request, so the browser
 * skips a CORS preflight the webhook would otherwise have to answer.
 */
async function submitEnquiry(data) {
  if (!CONFIG.formEndpoint) { await new Promise((r) => setTimeout(r, 900)); return { ok: true, simulated: true }; }
  const res = await fetch(CONFIG.formEndpoint, { method: "POST", body: data });
  if (!res.ok) throw new Error("Enquiry endpoint answered " + res.status);
  return { ok: true };
}

(() => {
  "use strict";

  /* ─── Shared helpers ─────────────────────────────────────────────── */
  const html = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const HAS_GSAP = !!(window.gsap && window.ScrollTrigger);
  const MOTION = !RM && HAS_GSAP;
  /* Modules are queued and started one per task, yielding to the browser in
     between, so no single start-up task blocks input for long. */
  const queue = [];
  const run = (name, fn) => queue.push([name, fn]);
  const start = async () => {
    for (const [name, fn] of queue) {
      try { fn(); } catch (err) { console.error("[rewire] " + name, err); }
      await new Promise((r) => setTimeout(r, 0));
    }
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  };

  if (!MOTION) html.classList.remove("motion", "intro");
  window.RW_READY = true;

  if (HAS_GSAP) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);
    if (window.Flip) gsap.registerPlugin(Flip);
  }

  /* The site's base easing, cubic-bezier(.22,.61,.36,1), as a GSAP ease. */
  function cubicBezier(p1x, p1y, p2x, p2y) {
    const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
    const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) { const e = sx(t) - x, d = dx(t); if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; t -= e / d; }
      return sy(clamp(t));
    };
  }
  const EASE = cubicBezier(0.22, 0.61, 0.36, 1);
  const T = { fast: 0.15, mid: 0.2, slow: 0.5, tone: 0.9 };

  /* Run a rAF loop only while `el` is on screen and the tab is visible.
     tick(time, dtSeconds) may return false to sleep until wake(). */
  function loop(el, tick) {
    let raf = 0, vis = false, last = 0;
    const frame = (t) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t;
      if (tick(t, dt) === false) { raf = 0; return; }
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf && vis && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; vis ? start() : stop(); }).observe(el);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    return { wake: start, stop };
  }

  /* Call on(el) the first time el is visible (and off() when it leaves, if given). */
  function whenVisible(el, on, off, opts) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { on(e.target); if (!off) io.unobserve(e.target); } else if (off) off(e.target);
    }), opts || { rootMargin: "0px 0px -12% 0px" });
    io.observe(el);
    return io;
  }

  /* Wrap each word of an element's own text nodes in .w > .w__i (child elements are kept). */
  function wrapWords(el) {
    Array.from(el.childNodes).forEach((n) => {
      if (n.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(" "); return; }
        const w = document.createElement("span"); w.className = "w";
        const i = document.createElement("span"); i.className = "w__i"; i.textContent = part;
        w.append(i); frag.append(w);
      });
      n.replaceWith(frag);
    });
    return $$(".w", el);
  }

  const fontsReady = Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((r) => setTimeout(r, 1500)),
  ]);

  /* ─── Odometer ───────────────────────────────────────────────────── */
  const odos = new WeakMap();
  function odometer(el) {
    if (odos.has(el)) return odos.get(el);
    let shape = null;
    const api = {
      set(str, fromZero) {
        const s = String(str);
        const nextShape = s.replace(/\d/g, "0");
        if (nextShape !== shape) {
          el.textContent = "";
          for (const ch of s) {
            if (/\d/.test(ch)) {
              const d = document.createElement("span"); d.className = "odo__d";
              const col = document.createElement("span"); col.className = "odo__s";
              for (let k = 0; k <= 9; k++) { const n = document.createElement("span"); n.textContent = k; col.append(n); }
              col.style.setProperty("--v", fromZero || !shape ? 0 : 0);
              d.append(col); el.append(d);
            } else {
              const c = document.createElement("span"); c.className = "odo__c"; c.textContent = ch; el.append(c);
            }
          }
          shape = nextShape;
          el.offsetWidth; // commit the zero state so the roll is visible
        }
        const cols = $$(".odo__s", el);
        let k = 0;
        for (const ch of s) if (/\d/.test(ch)) cols[k++].style.setProperty("--v", ch);
      },
    };
    odos.set(el, api);
    return api;
  }

  /* ─── Smooth scroll (Lenis, synced to ScrollTrigger) ─────────────── */
  let lenis = null;
  run("smooth-scroll", () => {
    if (!MOTION || !window.Lenis) return;
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  });
  const hdrH = () => ($(".hdr") ? $(".hdr").offsetHeight : 0);
  function scrollToTarget(target, opts = {}) {
    if (lenis) lenis.scrollTo(target, { offset: typeof target === "number" ? 0 : -hdrH() + 1, duration: opts.duration || 1.3 });
    else if (typeof target === "number") window.scrollTo({ top: target, behavior: RM ? "auto" : "smooth" });
    else target.scrollIntoView({ behavior: RM ? "auto" : "smooth" });
  }

  run("anchors", () => {
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      const target = id.length > 1 ? document.querySelector(id) : null;
      if (!target) return;
      e.preventDefault();
      scrollToTarget(target);
      history.replaceState(null, "", id);
      // Move focus for keyboard and screen-reader users without a second jump.
      const focusEl = target.matches("section, main, article") ? target : target.closest("section") || target;
      if (!focusEl.hasAttribute("tabindex")) focusEl.setAttribute("tabindex", "-1");
      focusEl.focus({ preventScroll: true });
    });
  });

  /* ─── Intro: tiles assemble, wordmark draws (≤1.2s, once per session) ─ */
  let heroEnter = () => {};
  // The veil itself is CSS (it starts at first paint). This only times the
  // hand-over to the hero, handles skip, and remembers the session.
  const fcp = () => { const e = performance.getEntriesByName("first-contentful-paint")[0]; return e ? e.startTime : 0; };
  let introEnd = 0, heroWanted = false;
  const callHero = () => { heroWanted = true; heroEnter(); };
  run("intro", () => {
    if (!html.classList.contains("intro")) return;
    if (!MOTION) { html.classList.remove("intro"); return; }
    try { sessionStorage.setItem("rw-intro", "1"); } catch (e) {}
    introEnd = fcp() + 760;
    const finish = () => { html.classList.remove("intro"); callHero(); };
    const wait = Math.max(0, introEnd - performance.now());
    const timer = setTimeout(finish, wait + 450);
    setTimeout(callHero, wait);
    const skip = () => {
      clearTimeout(timer);
      html.classList.add("intro-skip");
      introEnd = performance.now();
      callHero();
      setTimeout(() => html.classList.remove("intro", "intro-skip"), 220);
    };
    ["click", "keydown", "wheel", "touchstart"].forEach((ev) => addEventListener(ev, skip, { passive: true, once: true }));
  });

  /* ─── Header: condense, tone, rail, active nav ───────────────────── */
  run("header", () => {
    const hdr = $(".hdr");
    if (!hdr) return;
    const sections = $$("main > section, .ftr");
    const railFill = $(".rail__fill"), railNow = $(".rail__now");
    const navLinks = $$(".nav__list a");
    const setTone = (tone) => { hdr.dataset.tone = tone; html.dataset.tone = tone; };
    const setCurrent = (sec) => {
      if (railNow && sec.dataset.rail && railNow.textContent !== sec.dataset.rail) {
        railNow.textContent = sec.dataset.rail;
        if (MOTION) gsap.fromTo(railNow, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: T.slow, ease: EASE });
      }
      navLinks.forEach((a) => a.setAttribute("aria-current", String(a.getAttribute("href") === "#" + sec.id)));
      html.dataset.railTone = sec.dataset.tone || "cream"; // what sits under the rail
    };

    const onScroll = () => {
      const y = window.scrollY;
      hdr.classList.toggle("is-condensed", y > 80);
      if (railFill) {
        const max = document.documentElement.scrollHeight - innerHeight;
        railFill.style.transform = "scaleY(" + clamp(max > 0 ? y / max : 0) + ")";
      }
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (HAS_GSAP) {
      sections.forEach((sec) => {
        ScrollTrigger.create({
          trigger: sec, start: () => "top " + (hdrH() / 2), end: () => "bottom " + (hdrH() / 2),
          onToggle: (self) => { if (self.isActive) setTone(sec.dataset.tone || "cream"); },
        });
        ScrollTrigger.create({
          trigger: sec, start: "top 55%", end: "bottom 55%",
          onToggle: (self) => { if (self.isActive) setCurrent(sec); },
        });
      });
    } else {
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) { setTone(e.target.dataset.tone || "cream"); setCurrent(e.target); }
      }), { rootMargin: "-40px 0px -90% 0px" });
      sections.forEach((s) => io.observe(s));
    }
  });

  /* ─── Tone seams: the perforated edge of each jade room scrubs open ─ */
  run("tone-seams", () => {
    if (!MOTION) return;
    $$('section[data-tone="jade"]').forEach((sec) => {
      gsap.fromTo(sec, { "--seam-s": 0.05 }, {
        "--seam-s": 1, ease: "none",
        scrollTrigger: { trigger: sec, start: "top bottom", end: "top 55%", scrub: true },
      });
      gsap.fromTo(sec, { "--seam-e": 1 }, {
        "--seam-e": 0.1, ease: "none",
        scrollTrigger: { trigger: sec, start: "bottom 75%", end: "bottom 15%", scrub: true },
      });
      // The room opens: the jade slab widens from inset to full bleed.
      if (sec.id !== "pipeline") {
        gsap.fromTo(sec, { clipPath: "inset(-44px 3.5vw -44px 3.5vw round 22px)" }, {
          clipPath: "inset(-44px 0vw -44px 0vw round 0px)", ease: "none",
          scrollTrigger: { trigger: sec, start: "top bottom", end: "top 35%", scrub: true },
        });
      }
    });
  });

  /* ─── Custom cursor (fine pointers only) ─────────────────────────── */
  const cursor = { refresh() {} };
  run("cursor", () => {
    if (!FINE || !MOTION) return;
    const el = $(".cursor"), label = $(".cursor__label");
    if (!el) return;
    html.classList.add("has-cursor");
    let x = -100, y = -100, cx = x, cy = y, lastTarget = null;
    const evaluate = (target) => {
      lastTarget = target;
      if (!target || !target.closest) return;
      const labelled = target.closest("[data-cursor]");
      const text = target.closest('input:not([type="range"]):not([type="checkbox"]), textarea, select');
      const hot = target.closest("a, button, label, [role=tab]");
      const tone = target.closest("[data-tone]");
      el.classList.toggle("on-jade", !!tone && tone.dataset.tone === "jade" || !!target.closest(".console, .wa, .menu"));
      el.classList.toggle("is-text", !!text);
      const name = labelled ? labelled.dataset.cursor : "";
      if (name && label.textContent !== name) label.textContent = name;
      el.classList.toggle("is-label", !!name);
      el.classList.toggle("is-stamp", name === "Approve");
      el.classList.toggle("is-hover", !name && !!hot);
    };
    addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; evaluate(e.target); }, { passive: true });
    addEventListener("pointerdown", () => el.classList.add("is-down"));
    addEventListener("pointerup", () => el.classList.remove("is-down"));
    document.addEventListener("pointerleave", () => { x = y = -100; });
    // Scrolling moves content under a still pointer; re-check what is there.
    cursor.refresh = () => { if (x > 0) evaluate(document.elementFromPoint(x, y)); };
    addEventListener("scroll", () => requestAnimationFrame(cursor.refresh), { passive: true });
    gsap.ticker.add(() => {
      cx += (x - cx) * 0.3; cy += (y - cy) * 0.3;
      el.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
    });
  });

  /* ─── Magnetic CTAs (max 6px, spring return) ─────────────────────── */
  run("magnetic", () => {
    if (!FINE || !MOTION) return;
    $$("[data-magnetic]").forEach((btn) => {
      const xTo = gsap.quickTo(btn, "x", { duration: 0.45, ease: "power3.out" });
      const yTo = gsap.quickTo(btn, "y", { duration: 0.45, ease: "power3.out" });
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        xTo(clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1, 1) * 6);
        yTo(clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2), -1, 1) * 6);
      });
      btn.addEventListener("pointerleave", () => gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.75)" }));
    });
  });

  /* ─── Reveal vocabulary: fade · stagger · lines (+ numbers, below) ── */
  run("reveals", () => {
    if (!MOTION) return;
    const outsideHero = (el) => !el.closest(".hero");
    $$('[data-reveal="fade"]').filter(outsideHero).forEach((el) => {
      gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: EASE, scrollTrigger: { trigger: el, start: "top 90%", once: true } });
    });
    $$('[data-reveal="stagger"]').forEach((el) => {
      gsap.to(el.children, { opacity: 1, y: 0, duration: 0.7, ease: EASE, stagger: 0.08, scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });
    // Headings are split only as they approach the viewport: no big start-up task.
    fontsReady.then(() => {
      $$('[data-reveal="lines"]').forEach((el) => {
        if (!window.SplitText) { el.style.visibility = "visible"; return; }
        whenVisible(el, () => {
          SplitText.create(el, {
            type: "lines", mask: "lines", autoSplit: true,
            onSplit(self) {
              gsap.set(el, { visibility: "visible" });
              return gsap.from(self.lines, { yPercent: 110, duration: 1, ease: "power4.out", stagger: 0.08 });
            },
          });
        }, null, { rootMargin: "0px 0px 10% 0px" });
      });
    });
  });

  /* ─── Numbers: every [data-odo] and .oc__n rolls in once, when seen ─ */
  run("numbers", () => {
    const els = $$(".oc__n");
    els.forEach((el) => {
      const target = el.dataset.count || el.textContent.trim();
      const inner = document.createElement("span"); inner.className = "odo"; inner.setAttribute("aria-hidden", "true");
      const sr = document.createElement("span"); sr.className = "sr"; sr.textContent = target;
      el.textContent = ""; el.append(inner, sr);
      const o = odometer(inner);
      if (!MOTION) { o.set(target); return; }
      o.set(target.replace(/\d/g, "0"));
      whenVisible(el, () => setTimeout(() => o.set(target), 150));
    });
  });

  /* ═══ 1 · HERO ══════════════════════════════════════════════════════ */
  run("hero-title", () => {
    const h1 = $(".hero__title");
    if (!h1) return;
    const label = h1.textContent.replace(/\s+/g, " ").trim();
    if (!MOTION) return;
    h1.setAttribute("aria-label", label);
    Array.from(h1.children).forEach((c) => c.setAttribute("aria-hidden", "true"));

    const a = $(".t-a", h1), manual = $(".t-manual", h1), b = $(".t-b", h1);
    const wordsA = wrapWords(a);
    // "manually." is typed a letter at a time, so it gets chars, not a mask.
    const chars = Array.from(manual.textContent).map((ch) => {
      const s = document.createElement("span"); s.className = "c"; s.textContent = ch; return s;
    });
    manual.textContent = ""; chars.forEach((c) => manual.append(c));
    const wordsB = wrapWords(b);
    gsap.set($$(".w__i", a), { yPercent: 115 });
    gsap.set($$(".w__i", b), { yPercent: 115 });
    gsap.set(chars, { opacity: 0, y: 6 });
    gsap.set(".hero__eyebrow, .hero__sub, .hero__card", { opacity: 0, y: 24 });
    const tagEls = $$(".tag");
    const tagRest = tagEls.map((t) => gsap.getProperty(t, "rotation"));
    gsap.set(tagEls, { y: -70, rotation: (i) => [-14, 12, -9][i] || 0 });

    let played = false;
    heroEnter = () => {
      if (played) return; played = true;
      h1.style.visibility = "visible";
      const tl = gsap.timeline({ delay: 0.05 });
      tl.to(".hero__eyebrow", { opacity: 1, y: 0, duration: 0.8, ease: EASE }, 0);
      tl.to(wordsA.map((w) => w.firstChild), { yPercent: 0, duration: 0.95, ease: "power4.out", stagger: 0.055 }, 0.05);
      // A tired human typing: irregular gaps, one hesitation, each letter
      // landing a little crooked and wobbling upright.
      let t = 0.05 + wordsA.length * 0.055 + 0.35;
      const gaps = [0.14, 0.09, 0.2, 0.11, 0.34, 0.1, 0.16, 0.12, 0.22];
      chars.forEach((c, i) => {
        const tilt = (i % 2 ? 1 : -1) * (5 + (i * 7) % 7);
        tl.set(c, { opacity: 1, y: (i % 3) - 1, rotation: tilt }, t);
        tl.to(c, { rotation: 0, y: 0, duration: 0.9, ease: "elastic.out(1.1, 0.32)" }, t);
        t += gaps[i % gaps.length];
      });
      // Beat. Then the answer arrives all at once, clean.
      t += 0.28;
      tl.to(wordsB.map((w) => w.firstChild), { yPercent: 0, duration: 0.34, ease: "expo.out" }, t);
      tl.to(".hero__sub", { opacity: 1, y: 0, duration: 0.8, ease: EASE }, t + 0.1);
      tl.to(tagEls, { y: 0, rotation: (i) => tagRest[i], duration: 1.3, ease: "elastic.out(1, 0.55)", stagger: 0.12 }, 0.35);
      tl.to(".hero__card", { opacity: 1, y: 0, duration: 0.9, ease: EASE }, t + 0.3);
    };
    if (heroWanted || !html.classList.contains("intro")) fontsReady.then(() => heroEnter());
  });

  /* The living jaali: a breeze-block wall whose holes catch the pointer. */
  run("hero-jaali", () => {
    const hero = $(".hero"), wall = $(".hero__wall"), cv = $(".hero__jaali"), title = $(".hero__title");
    if (!hero || !wall || !cv || !cv.getContext) return;
    const ctx = cv.getContext("2d");
    const cs = getComputedStyle(html);
    const C = { jade: cs.getPropertyValue("--jade").trim(), terra: cs.getPropertyValue("--terra").trim() };
    const TILE = 44, R = 13, RV = 6.5, CLOSE_ROWS = 3.2, FALLOFF = 130;
    let W = 0, H = 0, dpr = 1, tiles = [], verts = [], born = performance.now();
    const ptr = { x: -9999, y: -9999, on: false };
    const tilt = { x: 0 };
    const coarse = !FINE;

    /* The screen is an L: a pier on the right of the headline (wide screens)
       and a wall along the foot of the hero. Rows at the very bottom close
       up until the screen is solid jade. */
    let pierX = Infinity, pierY = 0, wallY = 0, ox = 0;
    const inScreen = (x, y) => y >= wallY || (x >= pierX && y >= pierY);
    const closure = (cy) => clamp(1 - ((H - cy) / TILE - 0.4) / CLOSE_ROWS);

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = hero.clientWidth; H = hero.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const hr = hero.getBoundingClientRect();
      // Snap the screen edges to the tile grid so it reads as built, not cropped.
      wallY = Math.round((wall.getBoundingClientRect().top - hr.top) / TILE) * TILE;
      if (W >= 900 && title) {
        const rg = document.createRange(); rg.selectNodeContents(title);
        const tr = rg.getBoundingClientRect(); // the text itself, not the box
        const want = Math.max(tr.right - hr.left + 56, W * 0.66);
        pierX = Math.ceil(want / TILE) * TILE;
        pierY = Math.ceil((hdrH() + 44) / TILE) * TILE;
        if (W - pierX < TILE * 3) pierX = Infinity;
      } else pierX = Infinity;
      ox = 0;
      const cols = Math.ceil(W / TILE) + 1, rows = Math.ceil(H / TILE) + 1;
      tiles = []; verts = [];
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const x0 = ox + i * TILE, y0 = j * TILE;
        if (!inScreen(x0, y0)) continue;
        const x = x0 + TILE / 2, y = y0 + TILE / 2;
        tiles.push({ x, y, i, j, c: closure(y), v: 0, vv: 0, dx: 0, dy: 0 });
      }
      // Vertex circles sit on tile corners inside the screen (not on its outer edge).
      for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
        const x = ox + i * TILE, y = j * TILE;
        if (inScreen(x, y) && inScreen(x - TILE, y - TILE) && inScreen(x - TILE, y) && inScreen(x, y - TILE)) verts.push({ x, y, i, j, c: closure(y) });
      }
    }

    function draw(now, dt) {
      ctx.clearRect(0, 0, W, H);
      const age = MOTION ? now - born : 1e9;
      let busy = age < 2400;
      ctx.fillStyle = C.jade;
      ctx.fillRect(0, H - TILE, W, TILE);
      for (const t of tiles) {
        let target = 0;
        if (MOTION) {
          if (ptr.on) {
            const ddx = ptr.x - t.x, ddy = ptr.y - t.y;
            target = Math.exp(-(ddx * ddx + ddy * ddy) / (2 * FALLOFF * FALLOFF));
          } else if (coarse) {
            // Touch: a slow ambient wave, nudged by device tilt where available.
            target = 0.32 * (0.5 + 0.5 * Math.sin(t.x * 0.011 + t.y * 0.007 - now * 0.0011 + tilt.x * 2));
            busy = true;
          }
          target *= 1 - t.c;
          const k = 140, d = 20; // spring stiffness and damping
          t.vv += ((target - t.v) * k - t.vv * d) * dt;
          t.v += t.vv * dt;
          if (Math.abs(t.vv) > 0.0005 || Math.abs(target - t.v) > 0.001) busy = true;
          if (ptr.on) {
            const ddx = ptr.x - t.x, ddy = ptr.y - t.y, dist = Math.hypot(ddx, ddy) || 1;
            t.dx = lerp(t.dx, (ddx / dist) * 4 * t.v, 0.25); t.dy = lerp(t.dy, (ddy / dist) * 4 * t.v, 0.25);
          } else { t.dx *= 0.85; t.dy *= 0.85; }
        }
        // Tiles assemble in a diagonal wave on load.
        const a = clamp((age - (t.i + t.j) * 20) / 480);
        const grow = a === 1 ? 1 : 1 - Math.pow(1 - a, 3);
        const r = lerp(R, 33, t.c) * grow;
        if (r <= 0.2) continue;
        if (t.v > 0.02) {
          // Light through the hole: terracotta behind, the jade disc shrinking off it.
          ctx.fillStyle = C.terra;
          ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = C.jade;
          ctx.beginPath(); ctx.arc(t.x + t.dx, t.y + t.dy, r * (1 - 0.72 * t.v), 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = C.jade;
          ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.fillStyle = C.jade;
      for (const v of verts) {
        const a = clamp((age - (v.i + v.j) * 20 - 120) / 480);
        const r = lerp(RV, 33, v.c) * (a === 1 ? 1 : 1 - Math.pow(1 - a, 3));
        if (r <= 0.2) continue;
        ctx.beginPath(); ctx.arc(v.x, v.y, r, 0, Math.PI * 2); ctx.fill();
      }
      return busy;
    }

    let lp = null;
    resize();
    new ResizeObserver(() => { resize(); if (lp) lp.wake(); else draw(0, 0); }).observe(hero);
    if (!MOTION) { draw(0, 0); return; }
    let lastDraw = 0;
    lp = loop(hero, (now, dt) => {
      if (coarse && now - born > 2400 && now - lastDraw < 32) return true; // ambient wave at ~30fps
      lastDraw = now;
      return draw(now, dt);
    });
    fontsReady.then(() => { resize(); lp.wake(); });
    hero.addEventListener("pointermove", (e) => {
      const r = cv.getBoundingClientRect();
      ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.on = e.pointerType === "mouse" || e.pointerType === "pen";
      lp.wake();
    }, { passive: true });
    hero.addEventListener("pointerleave", () => { ptr.on = false; lp.wake(); });
    if (coarse) addEventListener("deviceorientation", (e) => { if (e.gamma != null) { tilt.x = e.gamma / 45; lp.wake(); } }, { passive: true });
    // Start the assembly wave as the intro veil lifts, so it is seen.
    if (introEnd) born = Math.max(performance.now(), introEnd);
  });

  /* ═══ 2 · PIPELINE ══════════════════════════════════════════════════
     Geometry: node centres in diagram units. Edges are drawn from ports.
     Time: one unit per beat of the story; scroll scrubs time. */
  run("pipeline", () => {
    const sec = $("#pipeline"), svg = $(".pipe__svg"), stage = $(".pipe__stage"), list = $(".steps");
    if (!sec || !svg || !list) return;
    if (!HAS_GSAP) { sec.classList.add("pipe--timeline"); return; }
    const NS = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.append(e); return e; };
    const items = $$(".step", list);

    // Readable extras for the list: node type badges and branch stubs.
    items.forEach((li) => {
      const btn = $(".step__btn", li);
      if (li.dataset.type) { const t = document.createElement("span"); t.className = "step__type"; t.setAttribute("aria-hidden", "true"); t.textContent = li.dataset.type; btn.append(t); }
      if (li.dataset.stubs) {
        const s = document.createElement("span"); s.className = "step__stubs"; s.setAttribute("aria-hidden", "true");
        li.dataset.stubs.split("|").forEach((txt) => { const b = document.createElement("span"); b.textContent = txt; s.append(b); });
        li.append(s);
      }
    });

    const X = 260;
    const N = {
      1: [0, 0], 2: [X, 0], 3: [2 * X, -110], 4: [2 * X, 110], 5: [2 * X, 290], 6: [3 * X, 0],
      7: [4 * X, -170], 8: [4 * X, 0], 9: [5 * X, 0], 10: [6 * X, 0], 11: [7 * X, 0], 12: [6.5 * X, 190],
      13: [8 * X, 0], 14: [9 * X, 0], 15: [10 * X, 0], 16: [10 * X, 200], 17: [11 * X, 0],
    };
    const HW = 88, HH = 32;
    const Rp = (n) => [N[n][0] + HW, N[n][1]], Lp = (n) => [N[n][0] - HW, N[n][1]];
    const Tp = (n) => [N[n][0], N[n][1] - HH], Bp = (n) => [N[n][0], N[n][1] + HH];
    const curve = (a, b) => { const dx = Math.max(36, (b[0] - a[0]) / 2); return `M${a[0]},${a[1]} C${a[0] + dx},${a[1]} ${b[0] - dx},${b[1]} ${b[0]},${b[1]}`; };
    const NOW = [N[10][0], -128];
    const EDGES = {
      e1_2: { d: curve(Rp(1), Lp(2)) },
      e2_3: { d: curve(Rp(2), Lp(3)), label: "real" },
      e2_4: { d: curve(Rp(2), Lp(4)) },
      e2_5: { d: `M${Bp(2)} C${X},${N[5][1] - 40} ${X + 60},${N[5][1]} ${Lp(5)}`, label: "junk", at: 0.62, ghost: true },
      e3_6: { d: curve(Rp(3), Lp(6)) },
      e4_6: { d: curve(Rp(4), Lp(6)) },
      e6_7: { d: curve(Rp(6), Lp(7)), label: "big" },
      e6_8: { d: curve(Rp(6), Lp(8)), label: "all" },
      e8_9: { d: curve(Rp(8), Lp(9)) },
      e9_8: { d: `M${Tp(9)} C${N[9][0]},-122 ${N[8][0]},-122 ${Tp(8)}`, label: "edits" },
      e9_10: { d: curve(Rp(9), Lp(10)) },
      e10_now: { d: `M${Tp(10)} L${NOW[0]},${NOW[1] + 10}`, label: "now", at: 0.45, ghost: true },
      e10_11: { d: curve(Rp(10), Lp(11)), label: "later" },
      e11_12: { d: `M${Bp(11)} C${N[11][0]},${N[12][1] - 40} ${N[11][0] - 10},${N[12][1]} ${Rp(12)}`, label: "no answer", at: 0.4 },
      e12_10: { d: `M${Lp(12)} C${N[10][0] + 10},${N[12][1]} ${N[10][0]},${N[12][1] - 40} ${Bp(10)}` },
      e11_13: { d: curve(Rp(11), Lp(13)), label: "answered" },
      e13_14: { d: curve(Rp(13), Lp(14)) },
      e14_15: { d: curve(Rp(14), Lp(15)) },
      e15_16: { d: `M${N[15][0] - 34},${HH} C${N[15][0] - 80},${90} ${N[16][0] - 80},${N[16][1] - 90} ${N[16][0] - 34},${N[16][1] - HH}`, label: "late", at: 0.5 },
      e16_15: { d: `M${N[16][0] + 34},${N[16][1] - HH} C${N[16][0] + 80},${N[16][1] - 90} ${N[15][0] + 80},${90} ${N[15][0] + 34},${HH}` },
      e15_17: { d: curve(Rp(15), Lp(17)), label: "paid" },
    };
    // The story, in time units. [packet, edge, start, end]
    const MOVES = [
      ["A", "e1_2", 0.6, 1.4],
      ["A", "e2_3", 2.0, 2.8], ["B", "e2_4", 2.0, 3.1], ["G", "e2_5", 2.0, 3.8],
      ["A", "e3_6", 4.2, 5.0], ["B", "e4_6", 4.2, 5.0],
      ["S", "e6_7", 5.4, 6.1],
      ["A", "e6_8", 6.6, 7.4], ["A", "e8_9", 7.9, 8.7],
      ["A", "e9_8", 9.1, 9.8], ["A", "e8_9", 9.9, 10.5],
      ["A", "e9_10", 12.1, 12.9], ["G2", "e10_now", 13.0, 13.8],
      ["A", "e10_11", 13.9, 14.6],
      ["A", "e11_12", 15.0, 15.6], ["A", "e12_10", 15.9, 16.5], ["A", "e10_11", 16.6, 17.0],
      ["A", "e11_13", 17.3, 18.0], ["A", "e13_14", 18.5, 19.2], ["A", "e14_15", 19.7, 20.4],
      ["A", "e15_16", 20.8, 21.4], ["A", "e16_15", 21.7, 22.3], ["A", "e15_17", 22.6, 23.4],
    ];
    const STOPS = [0, 1.4, 2.8, 3.1, 3.8, 5.0, 6.1, 7.4, 8.7, 12.9, 14.6, 15.6, 18.0, 19.2, 20.4, 21.4, 23.4];
    const T_END = 24.1;
    const HUMAN = { from: 9.9, to: 12.1, auto: 11.4 };
    const FADING = { B: 0, G: 0.5, S: 0.7, G2: 0.5 };

    /* ── Build the SVG once ── */
    const cam = mk("g", { class: "cam" }, svg);
    const gBp = mk("g", {}, cam), gEdge = mk("g", {}, cam), gPk = mk("g", {}, cam), gNode = mk("g", {}, cam), gLbl = mk("g", {}, cam), gTop = mk("g", {}, cam);
    Object.entries(EDGES).forEach(([id, e]) => {
      mk("path", { d: e.d, class: "edge-bp" }, gBp);
      e.path = mk("path", { d: e.d, class: "edge" + (e.ghost ? " is-ghost" : "") }, gEdge);
      e.len = e.path.getTotalLength();
      e.path.style.strokeDasharray = e.len + " " + e.len;
      e.path.style.strokeDashoffset = e.len;
      e.p = -1;
      if (e.label) {
        const pt = e.path.getPointAtLength(e.len * (e.at || 0.5));
        const g = mk("g", { class: "bl", transform: `translate(${pt.x},${pt.y})` }, gLbl);
        const w = e.label.length * 6.6 + 16;
        mk("rect", { x: -w / 2, y: -9, width: w, height: 18, rx: 9 }, g);
        mk("text", { x: 0, y: 3.5, "text-anchor": "middle" }, g).textContent = e.label;
        e.lbl = g;
      }
      e.win = null;
    });
    MOVES.forEach(([, id, t0, t1]) => { if (!EDGES[id].win) EDGES[id].win = [t0, t1]; });

    const nodes = {};
    items.forEach((li, k) => {
      const n = k + 1, [x, y] = N[n];
      const type = li.dataset.type;
      const g = mk("g", { class: "pn" + (n === 9 ? " pn--human" : "") + (type === "END" ? " pn--end" : ""), transform: `translate(${x},${y})` }, gNode);
      if (type) mk("text", { class: "type", x: -HW, y: -HH - 9 }, g).textContent = type;
      mk("rect", { class: "card", x: -HW, y: -HH, width: HW * 2, height: HH * 2, rx: 6 }, g);
      mk("circle", { class: "port", cx: -HW, cy: 0, r: 3.5 }, g);
      mk("circle", { class: "port", cx: HW, cy: 0, r: 3.5 }, g);
      mk("text", { class: "num", x: -HW + 14, y: -7 }, g).textContent = String(n).padStart(2, "0");
      mk("text", { class: "title", x: -HW + 14, y: 15 }, g).textContent = $(".step__title", li).textContent;
      nodes[n] = g;
    });
    // "now" terminal (a reply stops the run) and the day dial on WAIT.
    const term = mk("g", { class: "pn pn--end", transform: `translate(${NOW[0]},${NOW[1]})` }, gNode);
    mk("circle", { class: "terminal", r: 10 }, term); mk("circle", { class: "terminal", r: 4 }, term);
    mk("circle", { cx: HW - 22, cy: -2, r: 10, fill: "none", stroke: "var(--rule-jade)", "stroke-width": 3 }, nodes[10]);
    const dial = mk("circle", { class: "dial", cx: HW - 22, cy: -2, r: 10, transform: `rotate(-90 ${HW - 22} -2)` }, nodes[10]);
    const DIAL_LEN = 2 * Math.PI * 10;
    dial.style.strokeDasharray = DIAL_LEN; dial.style.strokeDashoffset = DIAL_LEN;
    // Approval stamp and its ink spread.
    const ink = mk("circle", { class: "ink", cx: 0, cy: 0, r: 80 }, gTop);
    const stamp = mk("g", { class: "stamp" }, gTop);
    mk("rect", { x: -64, y: -21, width: 128, height: 42, rx: 4 }, stamp);
    mk("rect", { class: "inner", x: -58, y: -15, width: 116, height: 30, rx: 2 }, stamp);
    mk("text", { x: 0, y: 5, "text-anchor": "middle" }, stamp).textContent = "Approved";

    const packets = {};
    ["A", "B", "S", "G", "G2"].forEach((id) => {
      const g = mk("g", { class: "pk", opacity: 0 }, gPk);
      if (id === "G" || id === "G2") mk("circle", { class: "ghost", r: 6.5 }, g);
      else { mk("circle", { class: "halo", r: 15 }, g); mk("circle", { class: "packet", r: 6.5 }, g); }
      packets[id] = { g, moves: MOVES.filter((m) => m[0] === id), x: 0, y: 0, op: -1 };
    });

    const bounds = { x0: -HW - 40, x1: N[17][0] + HW + 40, y0: -225, y1: 345 };
    const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
    const endOf = (id) => { const e = EDGES[id]; return e.path.getPointAtLength(e.len); };
    const startOf = (id) => EDGES[id].path.getPointAtLength(0);

    function packetAt(pk, t) {
      const ms = pk.moves;
      if (t < ms[0][2]) {
        if (pk === packets.A) { const s = startOf(ms[0][1]); return { x: s.x - HW, y: s.y, op: 1 }; }
        return { x: 0, y: 0, op: 0 };
      }
      for (let k = ms.length - 1; k >= 0; k--) {
        const [, id, t0, t1] = ms[k];
        if (t < t0) continue;
        const e = EDGES[id];
        if (t <= t1) { const pt = e.path.getPointAtLength(e.len * ease((t - t0) / (t1 - t0))); return { x: pt.x, y: pt.y, op: 1 }; }
        const end = endOf(id);
        if (k === ms.length - 1) {
          const f = FADING[Object.keys(packets).find((key) => packets[key] === pk)];
          if (f === undefined) return { x: end.x + HW, y: end.y, op: 1 };
          return { x: end.x, y: end.y, op: f === 0 ? 0 : clamp(1 - (t - t1) / f) };
        }
        // Between moves the packet is inside the node, sliding port to port.
        const next = ms[k + 1], ns = startOf(next[1]);
        const f = ease(clamp((t - t1) / Math.max(0.01, next[2] - t1)));
        return { x: lerp(end.x, ns.x, f), y: lerp(end.y, ns.y, f), op: 1 };
      }
      return { x: 0, y: 0, op: 0 };
    }

    /* ── Render any moment of the story ── */
    let current = -1, stamped = false, view = { w: 0, h: 0, s: 1 };
    const cap = {
      num: $(".pipe__cap-num"), type: $(".pipe__cap-type"), title: $(".pipe__cap-title"), desc: $(".pipe__cap-desc"), body: $(".pipe__cap-body"),
    };
    function setCaption(i, animate) {
      const li = items[i];
      cap.num.textContent = String(i + 1).padStart(2, "0");
      cap.type.textContent = li.dataset.type || "";
      cap.title.textContent = $(".step__title", li).textContent;
      cap.desc.textContent = $(".step__desc", li).textContent;
      if (animate && MOTION) {
        gsap.fromTo(cap.body, { clipPath: "inset(0 0 100% 0)", y: 16 }, { clipPath: "inset(0 0 0% 0)", y: 0, duration: 0.5, ease: "power3.out", overwrite: true });
        gsap.fromTo(cap.num, { yPercent: 35, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4, ease: "power3.out", overwrite: true });
      }
    }
    function doStamp() {
      if (stamped) return;
      stamped = true;
      nodes[9].classList.add("is-stamped");
      if (!MOTION) { gsap.set(stamp, { opacity: 1 }); return; }
      gsap.timeline()
        .fromTo(stamp, { scale: 1.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.22, ease: "power4.in" })
        .fromTo(nodes[9], { scale: 1 }, { scale: 0.95, duration: 0.08, yoyo: true, repeat: 1, transformOrigin: "50% 50%", ease: "power2.out" }, 0.2)
        .fromTo(ink, { scale: 0.25, opacity: 0.35 }, { scale: 1, opacity: 0, duration: 0.8, ease: "power2.out", transformOrigin: "50% 50%" }, 0.21);
      stage.removeAttribute("data-cursor");
      cursor.refresh();
    }
    function unstamp() {
      if (!stamped) return;
      stamped = false;
      nodes[9].classList.remove("is-stamped");
      gsap.killTweensOf([stamp, ink]);
      gsap.set(stamp, { opacity: 0 }); gsap.set(ink, { opacity: 0 });
    }
    gsap.set(stamp, { x: N[9][0], y: N[9][1] + 2, rotation: -9, opacity: 0, transformOrigin: "50% 50%" });
    gsap.set(ink, { x: N[9][0], y: N[9][1], opacity: 0 });

    function render(t, opts = {}) {
      Object.values(EDGES).forEach((e) => {
        const p = opts.all ? 1 : e.win ? clamp((t - e.win[0]) / (e.win[1] - e.win[0]) + 0.18) : 0;
        if (p !== e.p) { e.p = p; e.path.style.strokeDashoffset = e.len * (1 - p); if (e.lbl) e.lbl.classList.toggle("is-lit", p > 0.5); }
      });
      let A = { x: 0, y: 0 };
      Object.values(packets).forEach((pk) => {
        const pos = opts.all ? { x: 0, y: 0, op: 0 } : packetAt(pk, t);
        if (pk === packets.A) A = pos;
        if (pos.x !== pk.x || pos.y !== pk.y) { pk.g.setAttribute("transform", `translate(${pos.x},${pos.y})`); pk.x = pos.x; pk.y = pos.y; }
        if (pos.op !== pk.op) { pk.g.setAttribute("opacity", pos.op); pk.op = pos.op; }
      });
      const idx = opts.all ? -1 : STOPS.reduce((acc, s, i) => (t >= s - 1e-4 ? i : acc), 0);
      for (let n = 1; n <= 17; n++) {
        nodes[n].classList.toggle("is-lit", !!opts.all || t >= STOPS[n - 1] - 1e-4);
        nodes[n].classList.toggle("is-now", n === idx + 1);
      }
      term.classList.toggle("is-lit", !!opts.all || t >= 13.8);
      dial.style.strokeDashoffset = DIAL_LEN * (1 - (opts.all ? 1 : clamp((t - 12.9) / 1.0)));
      // Camera follows the enquiry.
      if (!opts.all && view.w) {
        const half = view.w / 2 / view.s;
        const cx = clamp(A.x + 150, bounds.x0 + half, Math.max(bounds.x0 + half, bounds.x1 - half));
        const cy = (bounds.y0 + bounds.y1) / 2;
        cam.setAttribute("transform", `translate(${view.w / 2 - cx * view.s},${view.h / 2 - cy * view.s}) scale(${view.s})`);
      }
      if (idx !== current && idx >= 0) {
        items.forEach((li, i) => { li.classList.toggle("is-active", i === idx); li.classList.toggle("is-done", i < idx); });
        setCaption(idx, current !== -1);
        current = idx;
      }
      // The human step.
      if (!opts.all) {
        if (t < HUMAN.from - 0.4) unstamp();
        if (t >= HUMAN.auto) doStamp();
        const waiting = t >= HUMAN.from && t < HUMAN.to && !stamped;
        if (waiting) stage.dataset.cursor = "Approve"; else stage.removeAttribute("data-cursor");
      }
    }
    stage.addEventListener("click", () => { if (stage.dataset.cursor === "Approve") doStamp(); });

    /* ── Modes ── */
    const state = { t: 0 };
    let pinST = null;
    const setMode = (m) => { sec.classList.remove("pipe--pinned", "pipe--static", "pipe--timeline"); sec.classList.add("pipe--" + m); };
    const measure = () => {
      // Reserve room for the tallest caption so the stage never resizes mid-story.
      const capBox = $(".pipe__caption");
      if (capBox && sec.classList.contains("pipe--pinned")) {
        capBox.style.minHeight = "";
        let max = 0;
        items.forEach((_, i) => { setCaption(i, false); max = Math.max(max, capBox.offsetHeight); });
        setCaption(Math.max(0, current), false);
        capBox.style.minHeight = max + "px";
      }
      view.w = stage.clientWidth; view.h = stage.clientHeight;
      view.s = Math.min(1.6, view.h / (bounds.y1 - bounds.y0 + 30));
      // Start the drawing on the same left edge as the text column.
      const head = $(".pipe__head"), pad = head ? head.getBoundingClientRect().left + parseFloat(getComputedStyle(head).paddingLeft) : 40;
      bounds.x0 = -HW - pad / view.s;
      bounds.x1 = N[17][0] + HW + pad / view.s;
    };

    function staticDiagram() {
      setMode("static");
      // Here the stage scrolls sideways, so it must be reachable by keyboard.
      stage.removeAttribute("aria-hidden"); svg.setAttribute("aria-hidden", "true");
      stage.setAttribute("role", "region"); stage.setAttribute("aria-label", "One job, start to end"); stage.tabIndex = 0;
      svg.setAttribute("viewBox", `${bounds.x0} ${bounds.y0} ${bounds.x1 - bounds.x0} ${bounds.y1 - bounds.y0}`);
      cam.removeAttribute("transform");
      render(T_END, { all: true });
      stamped = false; doStamp();
    }

    function timeline() {
      setMode("timeline");
      if (!MOTION) return () => {};
      const fill = document.createElement("span"); fill.className = "steps__fill"; fill.setAttribute("aria-hidden", "true");
      const dot = document.createElement("span"); dot.className = "steps__packet"; dot.setAttribute("aria-hidden", "true");
      list.append(fill, dot);
      const st = ScrollTrigger.create({
        trigger: list, start: "top 65%", end: "bottom 65%", scrub: 0.4,
        onUpdate: (self) => {
          const h = list.offsetHeight - 16, y = self.progress * h;
          dot.style.transform = `translateY(${y}px)`;
          fill.style.transform = `scaleY(${self.progress})`;
          let active = 0;
          items.forEach((li, i) => { if (li.offsetTop <= y + 12) active = i; });
          items.forEach((li, i) => { li.classList.toggle("is-active", i === active); li.classList.toggle("is-done", i < active); });
        },
      });
      return () => { st.kill(); fill.remove(); dot.remove(); };
    }

    function pinned() {
      setMode("pinned");
      svg.removeAttribute("viewBox");
      measure();
      const unit = () => Math.max(170, innerHeight * 0.28);
      const tween = gsap.to(state, {
        t: T_END, ease: "none",
        scrollTrigger: {
          trigger: sec, pin: ".pipe__pin", start: "top top", end: () => "+=" + T_END * unit(), scrub: 0.8,
          invalidateOnRefresh: true, anticipatePin: 1,
          refreshPriority: 10, // measured first, so every trigger below it accounts for the pin
          onRefresh: () => { measure(); render(state.t); },
        },
        onUpdate: () => render(state.t),
      });
      pinST = tween.scrollTrigger;
      render(0);
      return () => { pinST = null; gsap.set(".pipe__pin", { clearProps: "all" }); };
    }

    // Step list: jump the packet (pinned) or bring the step into view.
    items.forEach((li, i) => {
      $(".step__btn", li).addEventListener("click", () => {
        if (pinST) {
          const y = pinST.start + (STOPS[i] / T_END) * (pinST.end - pinST.start) + 2;
          scrollToTarget(y, { duration: 1.6 });
        } else if (sec.classList.contains("pipe--timeline")) {
          li.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "center" });
        }
      });
    });

    setCaption(0, false);
    if (HAS_GSAP) {
      const mm = gsap.matchMedia();
      mm.add({ wide: "(min-width: 900px) and (min-height: 560px)", narrow: "(max-width: 899px), (max-height: 559px)" }, (ctx) => {
        if (ctx.conditions.wide) return MOTION ? pinned() : staticDiagram();
        return timeline();
      });
    } else if (matchMedia("(min-width: 900px)").matches) staticDiagram();
    else setMode("timeline");
  });

  /* ═══ 3 · WHAT WE BUILD: three live specimens ═══════════════════════ */
  const specSpeed = new WeakMap();
  run("specimen-tilt", () => {
    $$(".spec").forEach((spec) => specSpeed.set(spec, { v: 1 }));
    if (!FINE || !MOTION) return;
    $$("[data-tilt]").forEach((card) => {
      const spec = card.closest(".spec");
      gsap.set(card, { transformPerspective: 900 });
      const rx = gsap.quickTo(card, "rotationX", { duration: 0.6, ease: "power3.out" });
      const ry = gsap.quickTo(card, "rotationY", { duration: 0.6, ease: "power3.out" });
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 8);   // ±4°
        rx(-((e.clientY - r.top) / r.height - 0.5) * 8);
      });
      card.addEventListener("pointerenter", () => { gsap.to(specSpeed.get(spec), { v: 2.2, duration: 0.4 }); spec.dispatchEvent(new Event("speed")); });
      card.addEventListener("pointerleave", () => { rx(0); ry(0); gsap.to(specSpeed.get(spec), { v: 1, duration: 0.6 }); spec.dispatchEvent(new Event("speed")); });
    });
  });

  /* Pause/resume a GSAP timeline with visibility; sync its speed to hover. */
  function bindTimeline(spec, tl) {
    const sp = specSpeed.get(spec) || { v: 1 };
    const sync = () => tl.timeScale(sp.v);
    spec.addEventListener("speed", () => gsap.to(tl, { timeScale: sp.v > 1 ? 2.2 : 1, duration: 0.4 }));
    whenVisible(spec, () => tl.play(), () => tl.pause(), { rootMargin: "0px" });
    document.addEventListener("visibilitychange", () => (document.hidden ? tl.pause() : null));
    sync();
  }

  run("demo-automation", () => {
    const spec = $("#spec-auto"), svg = $(".demo--auto");
    if (!spec || !svg || !HAS_GSAP) return;
    const fills = $$(".da-fill", svg), caret = $(".da-caret", svg), wires = $$(".da-wires path", svg), dots = $$(".da-packets circle", svg);
    const targets = [$(".da-sheet", svg), $(".da-crm", svg), $(".da-report", svg)];
    const hotBar = $(".da-bar--hot", svg);
    const newCells = targets.map((g) => $$(".da-cell", g));
    if (!MOTION) { newCells.flat().forEach((c) => c.classList.add("is-new")); return; }
    gsap.set(fills, { scaleX: 0 });
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6, paused: true });
    // Typed once…
    fills.forEach((f, i) => {
      const x = +f.getAttribute("x"), w = +f.getAttribute("width"), y = +f.getAttribute("y");
      tl.set(caret, { attr: { x, y: y - 2 } })
        .to(f, { scaleX: 1, duration: 0.7, ease: "steps(9)" })
        .to(caret, { attr: { x: x + w + 2 }, duration: 0.7, ease: "steps(9)" }, "<")
        .to({}, { duration: 0.15 });
    });
    // …then the same data travels to every place it is needed. No retyping.
    const along = (dot, path) => {
      const len = path.getTotalLength(), o = { p: 0 };
      return gsap.to(o, { p: 1, duration: 0.9, ease: "power2.inOut", onStart: () => gsap.set(dot, { opacity: 1 }),
        onUpdate: () => { const pt = path.getPointAtLength(len * o.p); dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y); },
        onComplete: () => gsap.to(dot, { opacity: 0, duration: 0.2 }) });
    };
    const flow = gsap.timeline();
    wires.forEach((w, i) => {
      flow.add(along(dots[i], w), i * 0.12);
      flow.call(() => newCells[i].forEach((c) => c.classList.add("is-new")), null, 0.9 + i * 0.12);
      flow.fromTo(targets[i], { y: 0 }, { y: -4, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.out" }, 0.9 + i * 0.12);
    });
    flow.fromTo(hotBar, { scaleY: 0.2 }, { scaleY: 1, duration: 0.6, ease: "power3.out" }, 1.15);
    tl.add(flow, "+=0.1");
    tl.to({}, { duration: 1.6 });
    tl.to(fills, { scaleX: 0, duration: 0.3, ease: "power2.in" });
    tl.call(() => newCells.flat().forEach((c) => c.classList.remove("is-new")));
    bindTimeline(spec, tl);
  });

  run("demo-voice", () => {
    const spec = $("#spec-voice"), box = $(".demo--voice"), cv = $(".dv-wave"), timer = $(".dv-timer"), tr = $(".dv-transcript"), toggle = $(".dv-toggle");
    if (!spec || !box || !cv) return;
    const ctx = cv.getContext("2d");
    const cs = getComputedStyle(html);
    const COL = { day: cs.getPropertyValue("--jade").trim(), night: cs.getPropertyValue("--on-jade").trim(), hot: cs.getPropertyValue("--terra").trim() };
    let W = 0, H = 0;
    const size = () => { const d = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    size(); new ResizeObserver(size).observe(cv);

    toggle.addEventListener("click", () => {
      const on = toggle.getAttribute("aria-pressed") !== "true";
      toggle.setAttribute("aria-pressed", String(on));
      box.classList.toggle("is-night", on);
    });

    // Pointer speed drives the voice's energy.
    let energy = 0.3, lastX = 0, lastY = 0, lastT = 0;
    addEventListener("pointermove", (e) => {
      const now = performance.now(), dt = Math.max(8, now - lastT);
      const v = Math.hypot(e.clientX - lastX, e.clientY - lastY) / dt;
      energy = Math.min(1.4, energy + v * 0.08);
      lastX = e.clientX; lastY = e.clientY; lastT = now;
    }, { passive: true });

    let phase = 0, secs = 0, secAcc = 0, wordAcc = 0;
    const words = () => $$("i", tr);
    function addWord() {
      if (words().length >= 14) tr.textContent = "";
      words().forEach((w) => w.classList.remove("is-hot"));
      const i = document.createElement("i");
      i.style.width = (18 + Math.round(Math.random() * 52)) + "px";
      i.className = "is-hot";
      tr.append(i);
      if (MOTION) gsap.from(i, { scaleX: 0, duration: 0.3, ease: "power2.out" });
    }
    function draw(dt) {
      const sp = (specSpeed.get(spec) || { v: 1 }).v;
      phase += dt * 5 * sp;
      energy = lerp(energy, 0.28, dt * 1.6);
      ctx.clearRect(0, 0, W, H);
      const night = box.classList.contains("is-night");
      const bars = Math.floor(W / 7), mid = H / 2;
      for (let b = 0; b < bars; b++) {
        const x = b * 7 + 2;
        const env = Math.sin((b / bars) * Math.PI);
        const a = (Math.sin(b * 0.45 + phase) * 0.5 + Math.sin(b * 0.17 - phase * 1.3) * 0.35 + Math.sin(b * 1.1 + phase * 0.7) * 0.15);
        const h = Math.max(2, Math.abs(a) * env * mid * 0.95 * Math.min(1, energy + 0.2));
        ctx.fillStyle = b === Math.floor(((phase * 6) % bars)) ? COL.hot : night ? COL.night : COL.day;
        ctx.fillRect(x, mid - h, 3, h * 2);
      }
      secAcc += dt * sp; wordAcc += dt * sp;
      if (secAcc >= 1) { secAcc -= 1; secs++; timer.textContent = String(Math.floor(secs / 60)).padStart(2, "0") + ":" + String(secs % 60).padStart(2, "0"); }
      if (wordAcc >= 0.42) { wordAcc = 0; addWord(); }
    }
    if (!MOTION) { for (let k = 0; k < 9; k++) addWord(); energy = 0.8; phase = 2; draw(0); timer.textContent = "00:42"; return; }
    loop(spec, (now, dt) => { draw(dt); });
  });

  run("demo-vision", () => {
    const spec = $("#spec-vision"), svg = $(".dvis-shelf"), countEl = $(".dvis-count"), times = $(".dvis-times");
    if (!spec || !svg) return;
    const NS = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, p) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); p.append(e); return e; };
    // A top-down shelf: three bays, simple geometric stock.
    const items = [];
    const kinds = ["rect", "circle", "pill"];
    [34, 108, 182].forEach((sy, row) => {
      mk("rect", { class: "shelf", x: 14, y: sy - 26, width: 372, height: 56, rx: 4 }, svg);
      for (let c = 0; c < 7; c++) {
        if ((row * 7 + c) % 5 === 3) continue; // gaps on the shelf
        const kind = kinds[(row + c * 2) % 3], cx = 44 + c * 52, cy = sy + 2;
        const cls = "item" + ["", " item--b", " item--c"][(c + row) % 3];
        let el;
        if (kind === "rect") el = mk("rect", { class: cls, x: cx - 13, y: cy - 16, width: 26, height: 32, rx: 3 }, svg);
        else if (kind === "circle") el = mk("circle", { class: cls, cx, cy, r: 15 }, svg);
        else el = mk("rect", { class: cls, x: cx - 10, y: cy - 18, width: 20, height: 36, rx: 10 }, svg);
        const box = mk("rect", { class: "bbox", x: cx - 20, y: cy - 23, width: 40, height: 46, rx: 1 }, svg);
        items.push({ el, box });
      }
    });
    const scan = mk("rect", { class: "scan", x: 0, y: 0, width: 36, height: 240 }, svg);
    mk("line", { class: "scanline", x1: 36, y1: 0, x2: 36, y2: 240 }, scan.parentNode);
    const scanLine = svg.lastChild;
    let count = 0, clock = 9 * 3600 + 14 * 60 + 2;
    const fmt = (s) => [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((n) => String(n).padStart(2, "0")).join(":");
    const log = () => {
      count++; clock += 1 + (count % 3);
      countEl.textContent = String(count).padStart(3, "0");
      const li = document.createElement("li"); li.textContent = fmt(clock);
      times.prepend(li);
      while (times.children.length > 4) times.lastChild.remove();
    };
    if (!MOTION || !HAS_GSAP) {
      items.forEach((it) => { it.box.style.opacity = 1; log(); });
      scan.remove(); scanLine.remove();
      return;
    }
    const order = items.map((_, i) => i).sort((a, b) => ((a * 37) % 17) - ((b * 37) % 17));
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.fromTo([scan, scanLine], { x: -40 }, { x: 400, duration: order.length * 0.42, ease: "none" }, 0);
    order.forEach((i, k) => {
      tl.fromTo(items[i].box, { opacity: 0, scale: 1.5, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.22, ease: "power3.out" }, k * 0.42);
      tl.call(log, null, k * 0.42 + 0.1);
    });
    tl.to(items.map((it) => it.box), { opacity: 0, duration: 0.4, stagger: 0.02 }, "+=1.2");
    bindTimeline(spec, tl);
  });

  /* ═══ 4 · PROOF: pick a name ════════════════════════════════════════ */
  run("proof", () => {
    const sec = $("#proof"), tabs = $$(".pname"), cases = $$(".case");
    if (!sec || !tabs.length || tabs.length !== cases.length) return;
    let idx = 0, progress = null, paused = false, inView = false, splits = [];
    const DURATION = 10;

    function enter(c) {
      const body = $(".case__body", c);
      splits.forEach((s) => s.revert()); splits = [];
      if (!MOTION) return;
      gsap.set(body, { opacity: 1 });
      const q1 = $(".q1", c);
      const tl = gsap.timeline();
      if (window.SplitText) {
        const s = SplitText.create(q1, { type: "lines", mask: "lines", aria: "none" }); splits.push(s);
        tl.from(s.lines, { yPercent: 105, duration: 0.9, ease: "power4.out", stagger: 0.09 }, 0);
      }
      tl.from([$(".q2", c), $(".case__attr", c), $(".case__top", c)], { opacity: 0, y: 14, duration: 0.7, ease: EASE, stagger: 0.08 }, 0.2);
      // Stack chips fly in scattered, then snap into a little flow.
      const chips = $$(".case__stack li", c);
      tl.fromTo(chips, { x: (i) => (i % 2 ? 1 : -1) * (30 + i * 14), y: (i) => (i % 3 - 1) * 28, rotation: (i) => (i % 2 ? 9 : -7), opacity: 0 },
        { x: 0, y: 0, rotation: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.06 }, 0.45);
      tl.fromTo(chips, { "--link": 0 }, { "--link": 1, duration: 0.35, ease: "power2.out", stagger: 0.07 }, 1.05);
      const fill = $(".oc__bar-fill", c);
      if (fill) tl.fromTo(fill, { scaleX: 1 }, { scaleX: 2 / 23, duration: 1.4, ease: "power3.inOut" }, 0.9);
    }

    function startProgress() {
      if (!MOTION) return;
      if (progress) progress.kill();
      const bar = tabs[idx];
      progress = gsap.fromTo(bar, { "--p": 0 }, { "--p": 1, duration: DURATION, ease: "none", paused: paused || !inView, onComplete: () => show((idx + 1) % cases.length) });
    }

    function show(i, userFocus) {
      if (i === idx && cases[i].classList.contains("is-active")) { startProgress(); return; }
      const state = MOTION && window.Flip ? Flip.getState(cases) : null;
      cases.forEach((c, k) => {
        const on = k === i;
        c.classList.toggle("is-active", on);
      });
      tabs.forEach((t, k) => { t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1; t.style.setProperty("--p", k === i ? 0 : 0); });
      idx = i;
      if (userFocus) tabs[i].focus();
      if (state) {
        const body = $(".case__body", cases[i]);
        gsap.set(body, { opacity: 0 });
        gsap.set($$(".case__slice > *", sec), { opacity: 0 });
        Flip.from(state, {
          duration: 0.85, ease: "power3.inOut", scale: true,
          onComplete: () => { gsap.to($$(".case__slice > *", sec), { opacity: 1, duration: 0.3 }); enter(cases[i]); },
        });
      } else enter(cases[i]);
      startProgress();
    }

    tabs.forEach((t, k) => {
      t.addEventListener("click", () => show(k));
      t.addEventListener("keydown", (e) => {
        const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (e.key === "Home") { e.preventDefault(); show(0, true); }
        else if (e.key === "End") { e.preventDefault(); show(tabs.length - 1, true); }
        else if (d) { e.preventDefault(); show((idx + d + tabs.length) % tabs.length, true); }
      });
    });
    cases.forEach((c, k) => $(".case__slice", c).addEventListener("click", () => show(k)));

    const setPaused = (p) => { paused = p; if (progress) (paused || !inView ? progress.pause() : progress.resume()); };
    [$(".proof__stage"), $(".proof__names")].forEach((el) => {
      el.addEventListener("pointerenter", () => setPaused(true));
      el.addEventListener("pointerleave", () => setPaused(false));
      el.addEventListener("focusin", () => setPaused(true));
      el.addEventListener("focusout", () => setPaused(false));
    });
    // Initial state.
    if (MOTION) {
      gsap.set($(".case__body", cases[0]), { opacity: 0 });
      whenVisible($(".proof__stage"), () => { enter(cases[0]); startProgress(); }, null, { rootMargin: "0px 0px -20% 0px" });
      ScrollTrigger.create({ trigger: sec, start: "top 60%", end: "bottom 40%", onToggle: (s) => { inView = s.isActive; setPaused(paused); } });
    }
  });

  /* ═══ 5 · CALCULATOR: the mixing desk ═══════════════════════════════ */
  run("calculator", () => {
    const people = $("#inPeople"), hours = $("#inHours"), cost = $("#inCost");
    if (!people || !hours || !cost) return;
    // Keep this exact maths.
    const RECOVERY = 0.35;        // share of repetitive time a live build removes
    const HOURS_IN_MONTH = 160;   // standard working month
    const compute = (p, h, c) => ({
      monthlyHours: p * h * RECOVERY * (52 / 12),
      annualMoney: p * h * RECOVERY * 52 * (c / HOURS_IN_MONTH),
    });
    const fmtN = (n) => Math.round(n).toLocaleString("en-US");
    const fmtM = (n) => "$" + Math.round(n).toLocaleString("en-US");

    const outH = $("#outHours"), outM = $("#outMoney");
    const odoH = odometer($("[data-odo]", outH)), odoM = odometer($("[data-odo]", outM));
    const srH = $("[data-sr]", outH), srM = $("[data-sr]", outM);
    const cells = $(".weekgrid__cells"), xBadge = $(".weekgrid__x");
    for (let i = 0; i < HOURS_IN_MONTH; i++) cells.append(document.createElement("i"));
    const cellEls = Array.from(cells.children);
    let lastFilled = 0, srTimer = 0, live = !MOTION;

    function update() {
      const p = +people.value, h = +hours.value, c = +cost.value;
      const r = compute(p, h, c);
      [people, hours, cost].forEach((inp) => {
        const out = $(`[data-for="${inp.id}"]`);
        const txt = inp === cost ? fmtM(+inp.value) : fmtN(+inp.value);
        out.textContent = txt;
        inp.setAttribute("aria-valuetext", txt);
        const f = (inp.value - inp.min) / (inp.max - inp.min);
        inp.parentNode.style.setProperty("--f", f);
      });
      if (!live) return;
      odoH.set(fmtN(r.monthlyHours));
      odoM.set(fmtM(r.annualMoney));
      clearTimeout(srTimer);
      srTimer = setTimeout(() => { srH.textContent = fmtN(r.monthlyHours); srM.textContent = fmtM(r.annualMoney); }, 350);
      // The month grid: 160 blocks = one person's working month.
      const filled = Math.min(HOURS_IN_MONTH, Math.round(r.monthlyHours));
      cellEls.forEach((el, i) => {
        const on = i < filled;
        if (on !== el.classList.contains("on")) {
          el.style.transitionDelay = MOTION ? Math.min(0.4, Math.abs(i - lastFilled) * 0.004) + "s" : "0s";
          el.classList.toggle("on", on);
        }
      });
      lastFilled = filled;
      xBadge.textContent = r.monthlyHours > HOURS_IN_MONTH ? "×" + (r.monthlyHours / HOURS_IN_MONTH).toFixed(2) : "";
    }
    [people, hours, cost].forEach((inp) => inp.addEventListener("input", update));
    // First view: the numbers roll up from zero.
    if (MOTION) {
      odoH.set("000"); odoM.set("$00,000");
      whenVisible($(".calc__outs"), () => { live = true; update(); });
    }
    update();
    if (!MOTION) { live = true; update(); }
  });

  /* ═══ 6 · BEFORE AND AFTER: untangle ═══════════════════════════════ */
  run("before-after", () => {
    const sec = $("#before-after"), stage = $(".ba__stage"), sw = $("#baSwitch"), linesSvg = $(".ba__lines");
    if (!sec || !stage || !sw) return;
    const before = $$(".ba__list--before .note"), after = $$(".ba__list--after .note");
    const listA = $(".ba__list--before"), listB = $(".ba__list--after");
    [...before, ...after].forEach((li) => { const p = document.createElement("span"); p.className = "note__p"; p.textContent = li.textContent; li.textContent = ""; li.append(p); });
    const NS = "http://www.w3.org/2000/svg";
    const tangle = document.createElementNS(NS, "path"); tangle.setAttribute("class", "tangle"); linesSvg.append(tangle);
    const clean = document.createElementNS(NS, "path"); clean.setAttribute("class", "clean"); linesSvg.append(clean);

    // Normalised centres [x, y, rotation]. A stressed whiteboard, then a straight run.
    const MESSY = {
      wide: [[.1, .2, -4], [.63, .15, 3], [.3, .64, -2], [.8, .5, 5], [.22, .38, 6], [.52, .83, -5], [.89, .24, -3], [.42, .3, 4], [.12, .8, -6], [.66, .4, -2], [.85, .83, 3]],
      tall: [[.28, .07, -4], [.72, .15, 3], [.3, .3, -3], [.7, .42, 5], [.24, .52, 4], [.7, .62, -5], [.32, .71, -2], [.7, .81, 4], [.26, .9, -5], [.64, .26, -3], [.62, .94, 3]],
    };
    const CLEAN = { wide: [[.15, .5], [.45, .5], [.79, .5]], tall: [[.5, .2], [.5, .5], [.5, .8]] };
    // Which clean node each messy note folds into (0 = Enquiry itself).
    const INTO = [0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2];
    let isAuto = false, userTouched = false;
    const shape = () => (stage.clientWidth / stage.clientHeight > 1.1 ? "wide" : "tall");
    const size = (el) => [el.offsetWidth, el.offsetHeight];
    const place = (el, nx, ny) => { const [w, h] = size(el); return { x: nx * stage.clientWidth - w / 2, y: ny * stage.clientHeight - h / 2 }; };

    function drawLines() {
      const centre = (el) => {
        const [w, h] = size(el);
        return [gsap.getProperty(el, "x") + w / 2, gsap.getProperty(el, "y") + h / 2];
      };
      const vis = before.filter((el) => +gsap.getProperty(el, "opacity") > 0.05);
      tangle.setAttribute("d", vis.length > 1 ? "M" + vis.map((el) => centre(el).join(",")).join(" L") : "");
      tangle.style.opacity = vis.length > 1 ? 1 : 0;
      const ca = after.map(centre);
      clean.setAttribute("d", "M" + ca.map((p) => p.join(",")).join(" L"));
      clean.style.opacity = gsap.getProperty(after[1], "opacity");
    }

    function layout(auto, dur) {
      const s = shape(), messy = MESSY[s], cl = CLEAN[s];
      const d = MOTION ? dur : 0;
      const tl = gsap.timeline({ onUpdate: drawLines, onComplete: drawLines });
      before.forEach((el, i) => {
        if (!auto) {
          const p = place(el, messy[i][0], messy[i][1]);
          tl.to(el, { x: p.x, y: p.y, rotation: messy[i][2], scale: 1, opacity: 1, duration: d * 0.9, ease: "power3.inOut" }, d ? (10 - i) * 0.02 : 0);
        } else {
          const target = cl[INTO[i]], p = place(el, target[0], target[1]);
          tl.to(el, { x: p.x, y: p.y, rotation: 0, scale: INTO[i] ? 0.5 : 1, opacity: i === 0 ? 1 : 0, duration: d, ease: "power3.inOut" }, d ? i * 0.035 : 0);
        }
      });
      after.forEach((el, i) => {
        const p = place(el, cl[i][0], cl[i][1]);
        gsap.set(el, { x: p.x, y: p.y });
        tl.to(el, { opacity: auto ? 1 : 0, scale: auto ? 1 : 0.7, duration: d * 0.5, ease: auto ? "back.out(1.4)" : "power2.in" }, auto ? d * 0.7 + i * 0.06 : 0);
      });
      if (auto) tl.set(before[0], { opacity: 0 }, d * 0.9 + 0.05);
      return tl;
    }

    const stats = $$(".bstat");
    const odo = stats.map((s) => odometer($("[data-odo]", s)));
    const srs = stats.map((s) => $("[data-sr]", s));
    const hoursLabel = $(".bstat__hl"), hoursLabelSr = $(".bstat__hl-sr");
    const VALUES = { off: ["11", "23", "6"], on: ["3", "20", "1"] };
    const LABELS = { off: "hours a week across the team", on: "hours saved across the team" };

    function set(auto, dur = 1.3) {
      isAuto = auto;
      sw.setAttribute("aria-checked", String(auto));
      sec.classList.toggle("is-auto", auto);
      sec.classList.toggle("ba--tangled", !auto);
      listA.setAttribute("aria-hidden", String(auto));
      listB.setAttribute("aria-hidden", String(!auto));
      layout(auto, dur);
      const v = auto ? VALUES.on : VALUES.off;
      odo.forEach((o, i) => o.set(v[i]));
      srs.forEach((s, i) => (s.textContent = v[i]));
      hoursLabel.textContent = auto ? LABELS.on : LABELS.off;
      hoursLabelSr.textContent = hoursLabel.textContent;
    }
    sw.addEventListener("click", () => { userTouched = true; set(!isAuto); });

    // Initial positions with no motion.
    gsap.set([...before, ...after], { x: 0, y: 0 });
    set(false, 0);
    gsap.set(after, { opacity: 0, scale: 0.7 });
    new ResizeObserver(() => layout(isAuto, 0)).observe(stage);

    // Numbers roll in once; the untangle auto-plays once, then it is yours.
    if (MOTION) {
      odo.forEach((o, i) => o.set(VALUES.off[i].replace(/\d/g, "0")));
      whenVisible(stage, () => {
        odo.forEach((o, i) => o.set(VALUES.off[i]));
        gsap.delayedCall(1.6, () => { if (!userTouched && !isAuto) set(true); });
      }, null, { rootMargin: "0px 0px -30% 0px" });
    }
  });

  /* ═══ 7 · YOUR DATA: the vault and the log ═════════════════════════ */
  run("data", () => {
    const sec = $("#data"), statement = $(".data__statement"), logIn = $(".data__log-in");
    if (!sec) return;
    // Decorative run log built from the pipeline's own steps.
    if (logIn) {
      const titles = $$(".step__title").map((e) => e.textContent);
      const branch = { 1: "real", 5: "all", 8: "edits", 9: "later", 10: "answered", 14: "paid" };
      let s = 9 * 3600 + 14 * 60 + 2, rows = [];
      for (let k = 0; k < 64; k++) {
        const i = k % titles.length;
        s += 3 + ((k * 7) % 11);
        const ts = [Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60].map((n) => String(n).padStart(2, "0")).join(":");
        rows.push(ts + "  " + titles[i] + (branch[i] ? "  → " + branch[i] : ""));
      }
      const text = rows.join("\n");
      logIn.textContent = text + "\n" + text; // doubled for a seamless loop
      new IntersectionObserver(([e]) => sec.classList.toggle("is-off", !e.isIntersecting)).observe(sec);
    }
    $$(".plate", sec).forEach((p) => {
      p.addEventListener("pointerenter", () => sec.classList.add("is-inspect"));
      p.addEventListener("pointerleave", () => sec.classList.remove("is-inspect"));
    });
    if (!statement || !MOTION) return;
    const words = wrapWords(statement);
    statement.setAttribute("aria-label", statement.textContent.replace(/\s+/g, " ").trim());
    words.forEach((w) => w.setAttribute("aria-hidden", "true"));
    gsap.fromTo(words, { opacity: 0.2 }, {
      opacity: 1, ease: "none", stagger: 0.1,
      scrollTrigger: { trigger: statement, start: "top 82%", end: "bottom 40%", scrub: true },
    });
  });

  /* ═══ 8 · WHO WE ARE: career lines ═════════════════════════════════ */
  run("about", () => {
    if (!MOTION) return;
    $$(".person").forEach((p) => {
      const line = $(".line", p), stops = $$(".stop", p);
      whenVisible(p, () => {
        line.classList.add("is-drawn");
        gsap.to(stops, { opacity: 1, x: 0, duration: 0.6, ease: EASE, stagger: 0.14, delay: 0.15 });
      }, null, { rootMargin: "0px 0px -18% 0px" });
    });
  });

  /* ═══ 9 · ENQUIRIES ════════════════════════════════════════════════ */
  run("whatsapp", () => {
    const href = "https://wa.me/" + CONFIG.whatsappNumber + "?text=" + encodeURIComponent(CONFIG.whatsappText);
    const wa = $("#waLink");
    if (wa) wa.href = href;
    $$(".js-wa").forEach((a) => (a.href = "https://wa.me/" + CONFIG.whatsappNumber));
    $$(".js-mail").forEach((a) => { a.href = "mailto:" + CONFIG.email; a.textContent = CONFIG.email; });
    const typed = $(".wa__typed");
    if (!wa || !typed) return;
    const msg = CONFIG.whatsappText;
    if (!MOTION) { typed.textContent = msg; wa.classList.add("is-sent"); return; }
    whenVisible(wa, () => {
      let i = 0;
      const step = () => {
        typed.textContent = msg.slice(0, ++i);
        if (i < msg.length) setTimeout(step, 38 + ((i * 29) % 70));
        else setTimeout(() => wa.classList.add("is-sent"), 450);
      };
      setTimeout(step, 500);
    });
  });

  run("form", () => {
    const form = $("#enqForm");
    if (!form) return;
    form.action = CONFIG.formEndpoint || form.action;
    const status = $("#formStatus"), btn = $(".form__submit", form), btnTxt = $(".form__submit-txt", form);
    const ticket = $(".ticket");
    const checks = [
      { input: $("#fName"), err: $("#errName"), ok: (v) => v.trim().length > 1 },
      { input: $("#fEmail"), err: $("#errEmail"), ok: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) },
      { input: $("#fWhat"), err: $("#errWhat"), ok: (v) => v.trim().length > 4 },
    ];
    const validate = (c) => { const good = c.ok(c.input.value); c.err.hidden = good; c.input.setAttribute("aria-invalid", String(!good)); return good; };
    // Gentle inline validation: only after the first blur, never a shake.
    checks.forEach((c) => {
      c.input.addEventListener("blur", () => { if (c.input.value) validate(c); });
      c.input.addEventListener("input", () => { if (c.input.getAttribute("aria-invalid") === "true") validate(c); });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      let first = null;
      checks.forEach((c) => { if (!validate(c) && !first) first = c.input; });
      if (first) { first.focus(); return; }
      if (btn.disabled) return;
      btn.disabled = true; btnTxt.textContent = "Sending…";
      status.classList.remove("is-bad"); status.textContent = "Sending…";
      const data = new FormData(form);
      try {
        if (!$("#fCompany").value) await submitEnquiry(data); // honeypot filled: quietly drop
        showTicket(data.get("name"), data.get("email"));
      } catch (err) {
        console.error(err);
        status.classList.add("is-bad");
        status.textContent = "That did not send. Please message us on WhatsApp instead.";
        btn.disabled = false; btnTxt.textContent = "Book my free audit";
      }
    });

    function showTicket(name, email) {
      $(".ticket__name", ticket).textContent = name;
      $(".ticket__mail", ticket).textContent = email;
      const swap = () => {
        form.hidden = true; ticket.hidden = false;
        ticket.setAttribute("tabindex", "-1"); ticket.setAttribute("role", "status");
        ticket.focus({ preventScroll: true });
        if (!MOTION) return;
        const stampEl = $(".ticket__stamp", ticket);
        gsap.timeline()
          .from(ticket, { y: 24, opacity: 0, rotation: -1.5, duration: 0.6, ease: EASE })
          .fromTo(stampEl, { scale: 2.2, opacity: 0, rotation: -30 }, { scale: 1, opacity: 1, rotation: -14, duration: 0.28, ease: "power4.in" }, 0.45)
          .fromTo(ticket, { x: 0 }, { x: 1.5, duration: 0.05, yoyo: true, repeat: 1 }, 0.72);
      };
      if (MOTION) gsap.to(form, { opacity: 0, y: -12, duration: 0.35, ease: "power2.in", onComplete: swap });
      else swap();
    }
  });

  /* ═══ MOBILE MENU: a jaali reveal ═══════════════════════════════════ */
  run("menu", () => {
    const btn = $(".menu-btn"), menu = $("#menu"), tilesEl = $(".menu__tiles");
    if (!btn || !menu) return;
    const txt = $(".menu-btn__txt", btn);
    let open = false, tl = null;
    const links = () => $$("a", menu);

    function build() {
      tilesEl.textContent = "";
      const cols = Math.ceil(innerWidth / 44) + 1, rows = Math.ceil(innerHeight / 44) + 1;
      tilesEl.style.setProperty("--cols", cols);
      for (let i = 0; i < cols * rows; i++) tilesEl.append(document.createElement("i"));
      return [rows, cols];
    }
    function openMenu() {
      open = true; menu.hidden = false; html.classList.add("menu-open");
      btn.setAttribute("aria-expanded", "true"); txt.textContent = "Close";
      if (lenis) lenis.stop();
      document.body.style.overflow = "hidden";
      if (MOTION) {
        const [rows, cols] = build();
        tl = gsap.timeline();
        tl.fromTo($$("i", tilesEl), { scale: 0 }, { scale: 2.4, duration: 0.5, ease: "power2.in", stagger: { grid: [rows, cols], from: [0, cols - 1], amount: 0.3 } })
          .fromTo($$(".menu__nav ul a", menu), { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: "power4.out", stagger: 0.05 }, 0.35)
          .fromTo($(".menu__nav .btn", menu), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: EASE }, 0.6);
      }
      links()[0].focus({ preventScroll: true });
    }
    function closeMenu(then) {
      open = false; btn.setAttribute("aria-expanded", "false"); txt.textContent = "Menu";
      const finish = () => { menu.hidden = true; html.classList.remove("menu-open"); document.body.style.overflow = ""; if (lenis) lenis.start(); if (then) then(); };
      if (MOTION && tl) {
        gsap.timeline({ onComplete: finish })
          .to($$(".menu__nav ul a, .menu__nav .btn", menu), { opacity: 0, duration: 0.2 })
          .to($$("i", tilesEl), { scale: 0, duration: 0.4, ease: "power2.out", stagger: { amount: 0.2, from: "end" } }, 0.1)
          .set($$(".menu__nav ul a, .menu__nav .btn", menu), { clearProps: "opacity" });
      } else finish();
    }
    btn.addEventListener("click", () => (open ? closeMenu(() => btn.focus()) : openMenu()));
    document.addEventListener("keydown", (e) => {
      if (!open) return;
      if (e.key === "Escape") closeMenu(() => btn.focus());
      if (e.key === "Tab") { // keep focus inside the menu and its button
        const f = [btn, ...links()], i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    menu.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      e.preventDefault(); e.stopPropagation();
      const target = document.querySelector(a.getAttribute("href"));
      closeMenu(() => target && scrollToTarget(target));
    });
    addEventListener("resize", () => { if (open && innerWidth >= 1100) closeMenu(); });
  });

  /* ═══ 10 · FOOTER: the terrazzo wordmark ═══════════════════════════ */
  run("footer", () => {
    const ftr = $(".ftr"), word = $(".ftr__word svg"), flecks = $(".ftr__word-flecks");
    if (!ftr || !word || !MOTION) return;
    gsap.fromTo(word, { yPercent: 62 }, {
      yPercent: 0, ease: "none",
      scrollTrigger: { trigger: ftr, start: "top bottom", end: "bottom bottom", scrub: true },
    });
    if (!FINE || !flecks) return;
    const xTo = gsap.quickTo(flecks, "x", { duration: 1.2, ease: "power3.out" });
    const yTo = gsap.quickTo(flecks, "y", { duration: 1.2, ease: "power3.out" });
    ftr.addEventListener("pointermove", (e) => {
      const r = ftr.getBoundingClientRect();
      xTo(((e.clientX - r.left) / r.width - 0.5) * -36);
      yTo(((e.clientY - r.top) / r.height - 0.5) * -18);
    });
  });

  /* Late layout shifts (fonts, images) move trigger positions. */
  if (HAS_GSAP) addEventListener("load", () => ScrollTrigger.refresh());
  start();
})();
