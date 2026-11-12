/* Version-B scroll hero: CSS sticky pin + canvas scrub over an image sequence. Vanilla, no deps.
   Config: data/hero-stages.json (inlined). Keyframes load first, in-betweens fill in after.
   Draws the wanted frame; if it is not loaded yet, the nearest loaded frame is shown BLURRED (never a silent skip)
   and the wanted frame is fetched at once. URLs carry ?v=<content hash> because /static/* is cached immutable. */
(() => {
  const hs = document.querySelector('[data-hs]');
  if (!hs || matchMedia('(prefers-reduced-motion: reduce)').matches) return; // poster + <ol> already in HTML
  const C = JSON.parse(hs.querySelector('[data-hs-cfg]').textContent);
  const $ = s => hs.querySelector(s), pin = $('[data-hs-pin]'), cv = $('[data-hs-canvas]'), cx = cv.getContext('2d', { alpha: false });
  const num = $('[data-hs-num]'), txt = $('[data-hs-txt]'), bar = $('[data-hs-bar]'), poster = $('[data-hs-poster]');
  const N = C.stages.length, w = innerWidth;
  const tier = w <= 640 ? 'sm' : w <= 1200 ? 'md' : 'lg', W = C.widths[tier];
  // flatten: small screens keyframes only; larger screens keyframes + in-betweens
  const F = [];
  C.stages.forEach((s, i) => (tier === 'sm' ? s.frames.slice(0, 1) : s.frames).forEach((f, j) => F.push({ f, s: i, key: !j })));
  const img = new Array(F.length);
  let ext = 'webp', drawn = -1, want = 0, tick = false, shownStage = -1;
  const pad = i => String(i + 1).padStart(2, '0');
  const load = i => new Promise(r => { if (img[i]) return r();
    if (i === 0 && F[0].f === C.poster && poster.naturalWidth) { img[0] = poster; return r(); } // reuse the already-decoded poster
    const im = new Image(); im.decoding = 'async';
    im.onload = () => { img[i] = im; r(); if (Math.abs(i - want) < Math.abs(drawn - want)) paint(); };
    im.onerror = r; im.src = `static/img/hero-stages/${F[i].f}-${W}.${ext}?v=${C.v}`; });
  const near = t => { for (let d = 0; d < F.length; d++) { if (img[t - d]) return t - d; if (img[t + d]) return t + d; } return -1; };
  const fit = () => { const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); drawn = -1; };
  const paint = () => {
    const i = near(want); if (i < 0) return;
    if (i !== drawn) { // object-fit: cover around the config focus point
      const im = img[i], k = Math.max(cv.width / im.naturalWidth, cv.height / im.naturalHeight);
      const dw = im.naturalWidth * k, dh = im.naturalHeight * k;
      const x = Math.min(0, Math.max(cv.width - dw, cv.width / 2 - dw * C.focus[0]));
      const y = Math.min(0, Math.max(cv.height - dh, cv.height / 2 - dh * C.focus[1]));
      cx.drawImage(im, x, y, dw, dh); drawn = i;
    }
    const miss = drawn !== want; cv.classList.toggle('is-blur', miss);
    if (miss) { load(want); if (want + 1 < F.length) load(want + 1); } // fetch the wanted frame now, not in queue order
    const s = F[drawn].s; // UI follows what is actually on the canvas
    if (s !== shownStage) { shownStage = s; num.textContent = `${pad(s)} / ${pad(N - 1)}`; txt.textContent = C.stages[s].caption;
      bar.setAttribute('aria-valuenow', s + 1); }
    bar.firstChild.style.transform = `scaleX(${drawn / (F.length - 1)})`;
    hs.classList.toggle('is-building', drawn > 0);
  };
  const prog = () => { const r = hs.getBoundingClientRect(), span = r.height - innerHeight;
    return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0; };
  const onScroll = () => { if (tick) return; tick = true; requestAnimationFrame(() => { tick = false;
    want = Math.round(prog() * (F.length - 1)); paint(); }); };
  // keyboard: arrows / PageUp/Down step one stage while the pinned hero has focus
  pin.tabIndex = 0;
  pin.addEventListener('keydown', e => {
    const d = { ArrowDown: 1, ArrowRight: 1, PageDown: 1, ArrowUp: -1, ArrowLeft: -1, PageUp: -1 }[e.key]; if (!d) return;
    const s = Math.max(0, Math.min(N - 1, (shownStage < 0 ? 0 : shownStage) + d));
    const t = F.findIndex(x => x.s === s && x.key), span = hs.offsetHeight - innerHeight;
    if (s === shownStage && t === drawn) return; e.preventDefault();
    scrollTo(0, hs.getBoundingClientRect().top + scrollY + span * t / (F.length - 1));
  });
  const start = async () => {
    const u = poster.currentSrc || ''; ext = /\.avif/.test(u) ? 'avif' : /\.jpg/.test(u) ? 'jpg' : 'webp';
    const keys = F.map((x, i) => x.key ? i : -1).filter(i => i >= 0), mids = F.map((x, i) => x.key ? -1 : i).filter(i => i >= 0);
    await load(0); // first paint needs only frame 0
    hs.classList.add('is-live'); cv.hidden = false; fit(); onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', () => { fit(); onScroll(); });
    const idle = window.requestIdleCallback || (f => setTimeout(f, 50));
    // poster == frame 0: the rest waits for the load event (keeps LCP/TBT clean) or the first scroll, whichever comes first
    if (document.readyState !== 'complete') await new Promise(r => { addEventListener('load', r, { once: true }); addEventListener('scroll', r, { once: true, passive: true }); });
    await Promise.all(keys.slice(1, 4).map(load)); // 1) next three stages together, right away
    for (const i of keys.slice(4)) await load(i);  // 2) remaining keyframes in order
    for (const i of mids) await new Promise(r => idle(() => load(i).then(r))); // 2) in-betweens when idle
  };
  poster.complete ? start() : (poster.addEventListener('load', start, { once: true }), poster.addEventListener('error', start, { once: true }));
})();
