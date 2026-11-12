(() => {
  const hdr = document.querySelector('[data-hdr]');
  const onScroll = () => hdr && hdr.classList.toggle('is-scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  // mobile menu
  const btn = document.querySelector('[data-menu-btn]'), menu = document.querySelector('[data-menu]');
  if (btn && menu) {
    const set = o => { btn.setAttribute('aria-expanded', o); menu.classList.toggle('is-open', o); };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    addEventListener('keydown', e => { if (e.key === 'Escape') { set(false); btn.focus(); } });
  }
  // hero B: parallax + pause control (respects reduced motion)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.querySelector('[data-heroB]');
  if (hero && reduce) hero.querySelectorAll('video').forEach(v => { v.removeAttribute('autoplay'); v.pause(); });
  if (hero && !reduce) {
    const layers = hero.querySelectorAll('[data-parallax]'); let paused = false, tick = false;
    addEventListener('scroll', () => { if (tick || paused) return; tick = true; requestAnimationFrame(() => {
      const y = Math.min(scrollY, innerHeight); layers.forEach(l => l.style.transform = `translate3d(0,${y * l.dataset.parallax}px,0)`); tick = false; }); }, { passive: true });
    const t = hero.querySelector('[data-motion-toggle]');
    t && t.addEventListener('click', () => { paused = !paused; hero.classList.toggle('is-paused', paused);
      t.setAttribute('aria-pressed', paused); t.textContent = paused ? 'Play motion' : 'Pause motion';
      hero.querySelectorAll('video').forEach(v => paused ? v.pause() : v.play()); });
  }
  // project filters (progressive enhancement)
  const f = document.querySelector('[data-filters]'), g = document.querySelector('[data-gallery]');
  if (f && g) { f.hidden = false; f.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
    f.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    g.querySelectorAll('[data-cat]').forEach(i => i.hidden = b.dataset.f !== 'all' && i.dataset.cat !== b.dataset.f); }); }
})();
