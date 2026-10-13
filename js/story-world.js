/* Progressive enhancement: all commercial routes and contact paths remain ordinary links. */
(() => {
  'use strict';
  const hero = document.querySelector('.hero');
  const dialog = document.getElementById('worldDialog');
  if (!hero || !dialog || typeof dialog.showModal !== 'function') return;
  const chapters = {
    mind: { image: 'face', label: '01 / The thinking', title: 'Story first. Always.', text: 'Before the camera. Before the campaign. Before the spend. We find the one thing your brand can say with conviction—then build everything around it.', links: [['Our fundamentals', '/about/'], ['Content strategy', '/services/content-strategy/']] },
    vision: { image: 'face', label: '02 / The vision', title: 'Feel it. Or use it.', text: 'A film that stays with you. An ad that makes the next step obvious. Different formats, one clear story. Explore the real work behind the point of view.', links: [['Explore the work', '/work/'], ['Films & production', '/services/video-production/'], ['Advertising', '/services/advertising/']] },
    craft: { image: 'watch', label: '03 / The craft', title: 'From first idea to final frame.', text: 'Get the story clear. Shape the execution. Refine the edit, sound and finish. Bring us an idea—or bring a ready brief. Based in India, working with teams worldwide.', links: [['Post-production', '/services/post-production/'], ['Video editing', '/services/video-editing/'], ['Your remote creative partner', '/remote-creative-services/']] },
    detail: { image: 'outfit', label: '04 / The details', title: 'Nothing is just a detail.', text: 'Texture. Movement. A moment of recognition. We help product and D2C brands turn what makes them different into something people can feel.', links: [['D2C creative', '/d2c-creative-agency/'], ['See product & lifestyle work', '/work/'], ['Motion graphics', '/services/motion-graphics/']] },
    direction: { image: 'direction', label: '05 / The perspective', title: 'A different way of seeing.', text: 'Creative direction gives every choice a reason: the idea, the image, the voice, the cut. One point of view, carried from your brand story into the things you put into the world.', links: [['Content & creative strategy', '/services/content-strategy/'], ['Campaigns & advertising', '/services/advertising/'], ['Meet Payoff', '/about/']] }
  };
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let quiet = preference.matches, returnFocus = null, raf = 0;
  const anchors = {mind:[.54,.18],vision:[.55,.30],craft:[.425,.70],detail:[.66,.53],direction:[.325,.52]};
  function placePoints() {
    const w = hero.clientWidth, h = hero.clientHeight;
    const scale = Math.max(w / 1672, h / 941);
    document.querySelectorAll('.world-point').forEach(b => {
      if (w <= 800) { b.style.left = ''; b.style.top = ''; return; }
      const [x,y] = anchors[b.dataset.chapter];
      b.style.left = `${(w - 1672 * scale) / 2 + x * 1672 * scale - 25}px`;
      b.style.top = `${(h - 941 * scale) / 2 + y * 941 * scale - 25}px`;
    });
  }
  new ResizeObserver(placePoints).observe(hero);
  placePoints();
  const toggle = document.getElementById('worldMotion');
  function motionState() {
    document.body.classList.toggle('world-quiet', quiet);
    toggle.textContent = quiet ? 'Motion off' : 'Motion on';
    toggle.setAttribute('aria-pressed', String(quiet));
    hero.style.setProperty('--px', '0px'); hero.style.setProperty('--py', '0px');
    hero.style.setProperty('--rx', '0deg'); hero.style.setProperty('--ry', '0deg');
  }
  toggle.addEventListener('click', () => { quiet = !quiet; motionState(); });
  preference.addEventListener('change', e => { quiet = e.matches; motionState(); });
  motionState();
  let chapterRequest = 0;
  async function openChapter(key, trigger) {
    const c = chapters[key]; if (!c) return;
    const request = ++chapterRequest;
    const incoming = new Image();
    incoming.src = `/assets/story/${c.image}.webp`;
    try { await incoming.decode(); } catch { return; }
    if (request !== chapterRequest) return;
    if (!dialog.open) returnFocus = trigger;
    const img = document.getElementById('chapterImage');
    dialog.querySelectorAll('.chapter-outgoing').forEach(e => e.remove());
    img.getAnimations().forEach(a => a.cancel());
    const outgoing = dialog.open && !quiet ? img.cloneNode() : null;
    if (outgoing) {
      outgoing.removeAttribute('id'); outgoing.alt = ''; outgoing.setAttribute('aria-hidden', 'true');
      outgoing.className = 'chapter-outgoing'; img.after(outgoing);
      outgoing.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(1.04)'}],{duration:650,easing:'cubic-bezier(.22,.61,.36,1)'}).finished.then(() => outgoing.remove()).catch(() => outgoing.remove());
    }
    img.src = `/assets/story/${c.image}.webp`;
    img.alt = {face: 'Close-up of the character and his sunglasses', watch: 'Steel watch and burgundy sleeve detail', outfit: 'Burgundy tailoring and ivory shirt detail', direction: 'The second character in the same roadside scene'}[c.image];
    document.getElementById('chapterKicker').textContent = c.label;
    document.getElementById('chapterTitle').textContent = c.title;
    document.getElementById('chapterText').textContent = c.text;
    const links = document.getElementById('chapterLinks'); links.replaceChildren();
    c.links.forEach(([label, href]) => { const a = document.createElement('a'); a.href = href; a.textContent = `${label} ↗`; links.append(a); });
    dialog.dataset.chapter = key;
    const [originX, originY] = anchors[key];
    dialog.style.setProperty('--origin-x', `${originX * 100}%`);
    dialog.style.setProperty('--origin-y', `${originY * 100}%`);
    dialog.querySelectorAll('[data-chapter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.chapter === key)));
    if (!dialog.open) { dialog.showModal(); document.body.classList.add('chapter-open'); document.getElementById('worldBack').focus(); }
    if (!quiet) {
      img.animate([{opacity:.35,transform:'scale(1.075)'},{opacity:1,transform:'scale(1)'}],{duration:850,easing:'cubic-bezier(.22,.61,.36,1)'});
      const panel = dialog.querySelector('.chapter-glass');
      panel.getAnimations().forEach(a => a.cancel());
      panel.animate([{opacity:.25,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:500,easing:'ease-out'});
    }
  }
  document.querySelectorAll('[data-chapter]').forEach(b => b.addEventListener('click', () => openChapter(b.dataset.chapter, b)));
  document.getElementById('worldBack').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { chapterRequest++; dialog.querySelectorAll('.chapter-outgoing').forEach(e => e.remove()); document.body.classList.remove('chapter-open'); returnFocus?.focus({preventScroll: true}); });
  document.getElementById('chapterTeardown').addEventListener('click', () => { dialog.close(); document.getElementById('teardown').scrollIntoView({behavior: quiet ? 'instant' : 'smooth'}); });
  hero.addEventListener('pointermove', e => {
    if (quiet || !fine.matches || raf || dialog.open) return;
    const box = hero.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width - .5, y = (e.clientY - box.top) / box.height - .5;
    raf = requestAnimationFrame(() => { hero.style.setProperty('--px', `${x * 12}px`); hero.style.setProperty('--py', `${y * 8}px`); hero.style.setProperty('--rx', `${-y * .7}deg`); hero.style.setProperty('--ry', `${x * .7}deg`); raf = 0; });
  }, {passive: true});
  hero.addEventListener('pointerleave', () => { hero.style.setProperty('--px', '0px'); hero.style.setProperty('--py', '0px'); hero.style.setProperty('--rx', '0deg'); hero.style.setProperty('--ry', '0deg'); });
})();
