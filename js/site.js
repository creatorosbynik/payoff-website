
(function(){
  document.documentElement.classList.add('js');
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const clamp = (v,a=0,b=1) => Math.max(a, Math.min(b, v));
  const ease = t => t<.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = Math.min(innerWidth, innerHeight) < 700;
  // phone held upright? read the device, not the iframe (in-app viewers can report a 0-height frame at load)
  const phoneUp = () => { const phone = Math.min(screen.width, screen.height) < 760 || Math.min(innerWidth, innerHeight) < 700; if (!phone) return false;
    if (typeof window.orientation === 'number') return window.orientation % 180 === 0;
    if (screen.orientation && screen.orientation.type) return screen.orientation.type.indexOf('portrait') === 0;
    return innerHeight >= innerWidth; };
  // iOS won't paint a frame from a muted video until it has played once: nudge it, then pause
  const primeVideo = v => v.addEventListener('loadedmetadata', () => { const pr = v.play(); if (pr && pr.then) pr.then(() => v.pause()).catch(() => {}); }, {once:true});
  const store = { get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }, set(k,v){ try { localStorage.setItem(k,v); } catch(e){} } };

  /* preloader: counts up, then lifts. Never longer than ~1.6s */
  (function(){
    const pre = $('#pre'), c = $('#count'); if (reduce) { pre.remove(); return; }
    if (document.visibilityState === 'hidden') { pre.remove(); return; } // opened in a background tab: skip the intro
    const t0 = performance.now(), D = 1100; let done = false;
    const end = () => { if (done) return; done = true; c.textContent = '100'; pre.classList.add('out'); setTimeout(() => pre.remove(), 950); };
    const tick = now => { const k = Math.min(1, (now - t0) / D); c.textContent = String(Math.floor(100 * (1 - Math.pow(1 - k, 2)))).padStart(2,'0'); if (k < 1) requestAnimationFrame(tick); else setTimeout(end, 160); };
    requestAnimationFrame(tick); setTimeout(end, 2200); // hard cap
  })();

  /* smooth scroll */
  let lenis = null;
  if (window.Lenis && !reduce) { lenis = new Lenis({lerp:.075, wheelMultiplier:.95, touchMultiplier:1.1, smoothWheel:true}); const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const el = document.querySelector(a.getAttribute('href')); if (el) { e.preventDefault(); lenis.scrollTo(el, {offset:-10}); } })); }

  /* hero loop */
  const hv = $('#heroVid');
  if (phoneUp()) { $('#intro').classList.add('vert'); $('#intro .poster').src = 'director-loop-poster-v.jpg'; hv.poster = 'director-loop-poster-v.jpg'; hv.src = 'director-loop-v.mp4'; }
  else hv.src = small ? 'director-loop-960.mp4' : 'director-loop-1920.mp4';
  if (!reduce) hv.play().catch(()=>{});

  /* nav + reveals + sticky mobile CTA */
  const nav = $('#nav'), mcta = $('#mcta');
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold:.12});
  $$('.rv').forEach(el => io.observe(el));

  /* brand name */
  let brand = store.get('payoff-brand') || '';
  function setBrand(v){ brand = (v||'').trim(); $$('.b').forEach(el => el.textContent = brand || 'your brand'); $('#brandInput').value = brand; if ($('#fBrand').value === '' || brand) $('#fBrand').value = brand; store.set('payoff-brand', brand); }
  setBrand(brand);
  const film = $('#story');
  const toAct1 = () => { const y = film.offsetTop + (film.offsetHeight - innerHeight) * .1; lenis ? lenis.scrollTo(y, {duration:2}) : scrollTo({top:y, behavior:'smooth'}); };
  $('#nameForm').addEventListener('submit', e => { e.preventDefault(); setBrand($('#brandInput').value); toAct1(); });
  $('#skipBtn').addEventListener('click', () => { setBrand(''); toAct1(); });

  /* filter divider */
  let split = .5, drag = false; const fl = $('#filter'), handle = $('#handle');
  function setSplit(p){ split = clamp(p,.08,.92); fl.style.setProperty('--split', (split*100)+'%'); const off = Math.abs(split-.5) > .18; $('#adline').classList.toggle('gone', off); $('#verdict').classList.toggle('on', off); }
  handle.addEventListener('pointerdown', e => { drag = true; handle.setPointerCapture(e.pointerId); });
  handle.addEventListener('pointermove', e => { if (drag) setSplit(e.clientX / innerWidth); });
  handle.addEventListener('pointerup', () => drag = false);
  handle.addEventListener('keydown', e => { if (e.key==='ArrowLeft') setSplit(split-.06); if (e.key==='ArrowRight') setSplit(split+.06); });
  setSplit(.5);

  /* film chapter: 9 keyframes, 8 moves of 5s; each segment holds then moves */
  const meter = $('#meter');
  let portrait = phoneUp();
  if (portrait) $('#fstill').src = 'still-v0.jpg';
  const video = $('#film'), still = $('#fstill'), caps = $$('.cap');
  const ACTS = ['Cold open','Act I — The noise','The cut','Act II — The dig','The filter','Act III — The work','Credits','The payoff','Post-credits','Enter the Director'];
  const N = 9, DUR = 45;
  const HOLD = .42; let loaded = false, cur = 0, lastSet = -1, lastStill = -1;
  function loadFilm(){
    if (loaded) return; loaded = true;
    const av1 = !small && video.canPlayType('video/mp4; codecs="av01.0.08M.08"') === 'probably';
    portrait = phoneUp(); if (portrait) still.src = 'still-v' + Math.max(0, lastStill) + '.jpg';
    const src = portrait ? 'film-v720.mp4' : small ? 'film-m1280.mp4' : (av1 ? 'film-1920-av1.mp4' : 'film-m1280.mp4'); // phones held upright get a native 9:16 cut
    // Buffer the whole film as a blob first: seeking inside a local blob is near-instant, range requests over the network stutter.
    const bar = $('#floadBar'), pct = $('#floadPct');
    const setP = f => { bar.style.transform = 'scaleX(' + f + ')'; pct.textContent = 'LOADING FILM ' + Math.round(f*100) + '%'; };
    let attached = false;
    const attach = u => { if (attached) return; attached = true; primeVideo(video); video.src = u; video.load(); setTimeout(() => film.classList.add('ready'), 12000); };
    const ac = window.AbortController ? new AbortController() : null;
    const bail = setTimeout(() => { if (!attached) { ac && ac.abort(); setP(1); attach(src); } }, 15000); // slow network: stream instead
    fetch(src, ac ? {signal: ac.signal} : {}).then(res => {
      if (!res.ok || !res.body) throw 0;
      const total = +res.headers.get('content-length') || 0, rd = res.body.getReader(), chunks = []; let got = 0;
      const pump = () => rd.read().then(r => { if (r.done) return new Blob(chunks, {type:'video/mp4'}); chunks.push(r.value); got += r.value.length; setP(total ? got/total : Math.min(got/10.5e6, .95)); return pump(); });
      return pump();
    }).then(b => { clearTimeout(bail); setP(1); attach(URL.createObjectURL(b)); }).catch(() => { clearTimeout(bail); setP(1); attach(src); });
    ['loadeddata','canplaythrough'].forEach(ev => video.addEventListener(ev, () => film.classList.add('ready'), {once:true}));
    video.addEventListener('error', () => film.classList.add('ready'), {once:true});
  }
  new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) loadFilm(); }), {rootMargin:'100% 0px'}).observe(film);
  // iOS won't paint a frame from a video that has never played: nudge once on first touch, then pause.
  const unlock = () => { const pr = video.play(); if (pr && pr.then) pr.then(() => video.pause()).catch(() => {}); else video.pause(); };
  ['touchstart','pointerdown','wheel','keydown'].forEach(ev => addEventListener(ev, unlock, {once:true, passive:true}));
  function filmState(){
    const p = clamp((scrollY - film.offsetTop) / Math.max(1, film.offsetHeight - innerHeight));
    const seg = Math.min(p * N, N - .0001); const i = Math.floor(seg), f = seg - i;
    const move = f < HOLD ? 0 : ease((f - HOLD) / (1 - HOLD));
    const t = p >= .9999 ? DUR : i*5 + move*5;
    if (p > .975) return {p, t: DUR, key: N, holding: true, z: 1};
    const key = f < .72 ? i : i + 1;
    const z = f < HOLD ? ease(f / HOLD) : 1 - move; // slow push-in while a frame holds, release as the camera moves
    return {p, t, key, holding: f < HOLD + .05, z};
  }

  /* custom cursor: dot + lagging ring that stretches with speed */
  const cursor = $('#cursor'), clabel = $('#cursorLabel'), cdot = $('#cdot');
  let mx = innerWidth/2, my = innerHeight/2, cx = mx, cy = my, vx = 0, vy = 0;
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, {passive:true});
  document.addEventListener('pointerover', e => {
    const t = e.target.closest('.w-tile,.w-feat'), l = e.target.closest('a,button,summary,label,.svc');
    cursor.classList.toggle('play', !!t); cursor.classList.toggle('link', !t && !!l);
    clabel.textContent = t ? 'Play' : '';
    cursor.classList.toggle('text', !!e.target.closest('input,textarea'));
  });
  document.addEventListener('pointerdown', () => cursor.classList.add('down')); document.addEventListener('pointerup', () => cursor.classList.remove('down'));
  document.addEventListener('pointerleave', () => { cursor.classList.add('gone'); cdot.classList.add('gone'); });
  document.addEventListener('pointerenter', () => { cursor.classList.remove('gone'); cdot.classList.remove('gone'); });

  /* folio hover-to-play (tap on touch) */
  $$('.card[data-play]').forEach(card => {
    const v = card.querySelector('video'); const img = card.querySelector('img');
    const on = () => { if (!v.src) { v.src = v.dataset.src; if (v.dataset.start) v.addEventListener('loadedmetadata', () => v.currentTime = +v.dataset.start, {once:true}); } v.play().then(() => img.style.opacity = 0).catch(()=>{}); };
    const off = () => { v.pause(); img.style.opacity = 1; };
    card.addEventListener('pointerenter', on); card.addEventListener('pointerleave', off); card.addEventListener('click', () => v.paused ? on() : off());
  });


  /* WORK: filterable portfolio grid, hover-play, lightbox */
  (function(){
    const data = JSON.parse($('#workData').textContent), KIND = {films:'Film',ads:'Ad',creators:'Creator',ai:'AI',jewellery:'Jewellery',stills:'Still'};
    const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const REELS = [
      ['films','The big','screen.','Brand and product films, cut to be remembered.'],
      ['ads','Thumb','stoppers.','Ads and UGC built for the first three seconds.'],
      ['creators','Real people,','real takes.','Creator films and reels that sound like the feed.'],
      ['ai','Made with','machines.','AI campaigns and motion, directed by people.'],
      ['jewellery','Things that','sparkle.','Jewellery reels and stills, lit for the close-up.'],
      ['stills','Frames worth','stopping for.','Product, fashion and key-visual photography.']
    ];
    const box = $('#wReels'), hoverable = matchMedia('(hover:hover)').matches;
    box.innerHTML = REELS.map(([t,a,b,sub],k) => { const n = data.filter(w => w.tab === t).length; return `<div class="reel" data-t="${t}">
      <button class="reel-h" type="button" aria-expanded="false" aria-controls="reel-${t}"><span class="rn mono">Reel ${String(k+1).padStart(2,'0')}</span><span class="rt cond">${a} <span class="it">${b}</span></span><span class="rs">${sub}</span><span class="rc mono">${n} pieces</span><span class="pm" aria-hidden="true"></span></button>
      <div class="reel-b" id="reel-${t}" role="region" aria-label="${esc(a+' '+b)}"><div class="reel-in"><div class="w-grid"></div></div></div></div>`; }).join('');
    const tile = (w,i) => `<button class="w-tile" data-i="${i}" data-t="${w.tab}" style="aspect-ratio:${w.hv ? 1.7778 : w.ar}" aria-label="${esc((w.client ? w.client + ': ' : '') + w.title)}">
      <img src="${w.hp || w.p}" alt="" loading="lazy" decoding="async">${w.v ? `<video muted loop playsinline preload="none" aria-hidden="true"></video><span class="pl"><svg viewBox="0 0 10 12" fill="currentColor"><path d="M0 0l10 6-10 6z"/></svg></span>` : ''}
      <span class="kind mono">${KIND[w.tab]}</span>
      <span class="meta"><span class="mono">${esc(w.client || w.cat)}</span><b>${esc(w.title)}</b></span></button>`;
    const play = t => { const w = data[t.dataset.i], v = t.querySelector('video'); if (!v) return; if (!v.src) v.src = w.hv || w.v; v.play().then(() => t.classList.add('on')).catch(()=>{}); };
    const stop = t => { const v = t.querySelector('video'); if (v) { v.pause(); t.classList.remove('on'); } };
    let vis = data.map((_,i) => i);
    function fill(reel){
      const g = reel.querySelector('.w-grid'); if (g.childElementCount) return;
      g.innerHTML = data.map((w,i) => w.tab === reel.dataset.t ? tile(w,i) : '').join('');
      g.querySelectorAll('.w-tile').forEach((t,j) => {
        t.style.setProperty('--d', (j * 45) + 'ms');
        if (hoverable) { t.addEventListener('pointerenter', () => play(t)); t.addEventListener('pointerleave', () => stop(t)); }
        t.addEventListener('click', () => open(+t.dataset.i));
      });
    }
    function toggle(reel, force){
      const h = reel.querySelector('.reel-h'), on = force ?? h.getAttribute('aria-expanded') !== 'true';
      if (on) { $$('.reel.open', box).forEach(r => r !== reel && toggle(r, false)); fill(reel); }
      else reel.querySelectorAll('.w-tile').forEach(stop);
      h.setAttribute('aria-expanded', on); reel.classList.toggle('open', on);
      if (on) { vis = $$('.w-tile', reel).map(t => +t.dataset.i); setTimeout(() => { const top = h.getBoundingClientRect().top; if (top < 60 || top > innerHeight * .55) (lenis ? lenis.scrollTo(h, {offset:-90, duration:1}) : h.scrollIntoView({behavior:'smooth'})); }, 380); }
    }
    $$('.reel', box).forEach(r => r.querySelector('.reel-h').addEventListener('click', () => toggle(r)));
    /* lightbox */
    const lb = $('#lbx'); let cur = -1, last = null;
    function show(i){
      cur = i; const w = data[i], st = $('#lbxS');
      st.innerHTML = w.v ? `<video src="${w.hv || w.v}" poster="${w.hp || w.p}" autoplay muted loop playsinline controls></video>` : `<img src="${w.p}" alt="${esc(w.title)}">`;
      $('#lbxC').textContent = [w.client, w.cat, w.via ? 'Made with ' + w.via : ''].filter(Boolean).join(' · ');
      $('#lbxT').textContent = w.title;
      const L = $('#lbxL'); if (w.link) { L.href = w.link; L.hidden = false; } else L.hidden = true;
      $('#lbxNote').textContent = w.v ? (w.link ? 'Silent preview. The full cut with sound opens in Google Drive.' : 'Silent preview.') : '';
    }
    function open(i){ last = document.activeElement; lb.hidden = false; requestAnimationFrame(() => lb.classList.add('open')); show(i); lenis && lenis.stop(); document.body.style.overflow = 'hidden'; $('#lbxX').focus(); }
    function close(){ lb.classList.remove('open'); $('#lbxS').innerHTML = ''; lenis && lenis.start(); document.body.style.overflow = ''; setTimeout(() => lb.hidden = true, 300); last && last.focus(); }
    const step = d => { const pool = vis.includes(cur) ? vis : data.map((_,i) => i); const k = pool.indexOf(cur); show(pool[(k + d + pool.length) % pool.length]); };
    $('#lbxX').addEventListener('click', close); $('#lbxP').addEventListener('click', () => step(-1)); $('#lbxN').addEventListener('click', () => step(1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
  })();


  /* 3D hover tilt with glare (pointer devices only) */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduce) {
    const tilt = el => {
      if (!el.querySelector(':scope > .glare')) { const g = document.createElement('span'); g.className = 'glare'; el.appendChild(g); }
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      const max = +(el.dataset.tilt || 8);
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.classList.add('tilting');
        el.style.transform = `perspective(1000px) rotateX(${(.5 - y) * max}deg) rotateY(${(x - .5) * max}deg) scale3d(1.02,1.02,1.02)`;
        el.style.setProperty('--gx', x*100 + '%'); el.style.setProperty('--gy', y*100 + '%');
      });
      el.addEventListener('pointerleave', () => { el.classList.remove('tilting'); el.style.transform = ''; });
    };
    $$('.w-tile').forEach(el => { el.dataset.tilt = 9; tilt(el); });
    [['.w-feat',3],['.step',7],['.tear figure',6],['.director figure',6]].forEach(([q,m]) => $$(q).forEach(el => { el.dataset.tilt = m; tilt(el); }));
  }


  /* v5: split H2s into masked words (motion-style stagger) */
  $$('.h2, .hero h1').forEach(h => {
    const walk = (node, out) => { node.childNodes.forEach(n => { if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(t => out.push(/^\s+$/.test(t) || !t ? document.createTextNode(t) : Object.assign(document.createElement('span'), {textContent:t}))); else { const c = n.cloneNode(false); const inner = []; walk(n, inner); inner.forEach(x => c.appendChild(x)); out.push(c); } }); };
    const out = []; walk(h, out); h.textContent = ''; let i = 0;
    out.forEach(n => { if (n.nodeType === 3) { h.appendChild(n); return; } const wd = document.createElement('span'); wd.className = 'wd'; const inner = n.tagName === 'SPAN' && !n.className ? n : (() => { const x = document.createElement('span'); x.appendChild(n); return x; })(); inner.style.setProperty('--i', i++); wd.appendChild(inner); h.appendChild(wd); });
    h.classList.add('split'); if (!h.closest('.rv')) { new IntersectionObserver(([e], o) => { if (e.isIntersecting) { h.classList.add('in'); o.disconnect(); } }, {threshold:.2}).observe(h); }
  });
  /* v5: magnetic CTAs */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduce) $$('.cta').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width/2) * .22}px,${(e.clientY - r.top - r.height/2) * .3}px)`; });
    b.addEventListener('pointerleave', () => b.style.transform = '');
  });
  /* v10: scroll-scrubbed film — a storm of sale tags and taglines pulled into one red card, then the real logo lands on it */
  (function(){
    const sec = $('#assemble'), v = $('#asVid'), frame = $('.as-frame'), logo = $('.as-logo'), words = $('#asWords'), hint = $('.as-hint');
    const parts = []; words.childNodes.forEach(n => { if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(t => parts.push(t)); else parts.push(n); });
    words.textContent = ''; const ws = [];
    parts.forEach(t => { if (typeof t === 'string') { if (!t.trim()) { words.appendChild(document.createTextNode(t)); return; } const sp = document.createElement('span'); sp.className = 'w'; sp.textContent = t; words.appendChild(sp); ws.push(sp); } else { t.classList.add('w'); words.appendChild(t); ws.push(t); } });
    let loaded = false, cur = 0, last = -1, lit = -1;
    let vert = phoneUp(); // phones held upright get a native 9:16 film
    const endImg = frame.querySelector('.as-end');
    const setVert = () => { vert = phoneUp(); frame.classList.toggle('vert', vert); frame.querySelector('.as-poster').src = vert ? 'as-poster-v.jpg' : 'as-poster.jpg'; endImg.src = vert ? 'as-end-v.jpg' : 'as-end.jpg'; };
    setVert();
    const load = () => { if (loaded) return; loaded = true; setVert(); primeVideo(v); const src = vert ? 'assemble-v.mp4' : innerWidth < 700 ? 'assemble-960.mp4' : 'assemble.mp4';
      fetch(src).then(r => r.blob()).then(b => { v.src = URL.createObjectURL(b); }).catch(() => { v.src = src; });
      v.addEventListener('loadeddata', () => frame.classList.add('ready'), {once:true}); };
    new IntersectionObserver(es => es.forEach(e => e.isIntersecting && load()), {rootMargin:'150% 0px'}).observe(sec);
    const ease = t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
    (function tick(){
      requestAnimationFrame(tick);
      const r = sec.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      const p = reduce ? 1 : clamp(-r.top / Math.max(1, r.height - innerHeight));
      const tgt = ease(clamp((p - .04) / .74));
      cur += (tgt - cur) * (reduce ? 1 : .12);
      if (v.duration && !v.seeking && v.readyState >= 1 && Math.abs(cur - last) > .002) { v.currentTime = cur * (v.duration - .05); last = cur; }
      frame.style.setProperty('--s', (1.08 - cur * .08).toFixed(4));
      if (!frame.classList.contains('ready')) endImg.style.opacity = clamp((cur - .7) / .15); // video not decoded yet: still land on the card
      const la = clamp((p - .8) / .12); logo.style.opacity = la; logo.style.transform = `translate(-50%,-50%) scale(${(1.12 - la * .12).toFixed(3)})`; logo.style.filter = `blur(${((1 - la) * 10).toFixed(1)}px)`;
      const n = Math.round(clamp((p - .05) / .7) * ws.length); if (n !== lit) { ws.forEach((w, i) => w.classList.toggle('on', i < n)); lit = n; }
      hint.style.opacity = p > .85 ? 0 : 1;
    })();
  })();


  /* v6: hero pause + pointer parallax + Motion springs */
  const hp = $('#hPause');
  hp.addEventListener('click', () => { const paused = !hv.paused; paused ? hv.pause() : hv.play(); hp.textContent = paused ? 'Play' : 'Pause'; hp.setAttribute('aria-pressed', paused); hp.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video'); });
  new IntersectionObserver(([e]) => { if (hp.getAttribute('aria-pressed') === 'true') return; e.isIntersecting ? hv.play().catch(()=>{}) : hv.pause(); }).observe($('#hframe'));
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduce) {
    const hf = $('#hframe'), layers = [hv, hf.querySelector('.poster')]; let tx = 0, ty = 0, ax = 0, ay = 0;
    hf.closest('.hero').addEventListener('pointermove', e => { const r = hf.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - .5) * -18; ty = ((e.clientY - r.top) / r.height - .5) * -12; });
    (function par(){ ax += (tx - ax) * .06; ay += (ty - ay) * .06; layers.forEach(l => l && (l.style.transform = `translate3d(${ax}px,${ay}px,0) scale(1.05)`)); requestAnimationFrame(par); })();
  }
  if (window.Motion && !reduce) {
    const { animate, inView, stagger } = Motion;
    animate('.vf .c', { opacity: [0, 1], scale: [1.6, 1] }, { delay: stagger(.08, { startDelay: 1.6 }), type: 'spring', stiffness: 160, damping: 14 });
    inView('.reels', el => { animate(el.querySelectorAll('.reel-h'), { opacity: [0, 1], y: [36, 0] }, { delay: stagger(.08), type: 'spring', stiffness: 90, damping: 16 }); }, { amount: .1 });
    inView('.steps', el => { animate(el.querySelectorAll('.step'), { opacity: [0, 1], y: [60, 0], rotate: [-2, 0] }, { delay: stagger(.12), type: 'spring', stiffness: 80, damping: 14 }); }, { amount: .25 });
    inView('.svc-list', el => { animate(el.querySelectorAll('.svc'), { opacity: [0, 1], x: [-30, 0] }, { delay: stagger(.07), type: 'spring', stiffness: 100, damping: 18 }); }, { amount: .15 });
  }
  /* v6: chapter rail — active chapter + page progress */
  (function(){
    const links = $$('#rail a'), secs = links.map(a => document.getElementById(a.dataset.s)), fill = $('#railFill'), mobile = matchMedia('(max-width:900px)');
    const onScroll = () => {
      const mid = innerHeight * .45; let cur = 0;
      secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < mid) cur = i; });
      links.forEach((a, i) => a.classList.toggle('on', i === cur));
      const p = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
      if (mobile.matches) { fill.style.width = (p * 100) + '%'; fill.style.height = ''; } else { fill.style.height = (p * 100) + '%'; fill.style.width = ''; }
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  })();


  /* form: validation, honeypot, loading and success states */
  const f = $('#tearForm');
  const rules = { fBrand: v => v.length >= 2 || 'Add your brand name.', fLink: v => /^@?[\w.]{2,}$|\.[a-z]{2,}/i.test(v) || 'Add an Instagram handle like @yourbrand or a website.', fContact: v => /^\+?[\d\s-]{10,}$|^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Add a WhatsApp number or an email we can reply to.' };
  function check(id){ const el = $('#'+id), r = rules[id](el.value.trim()); const bad = r !== true; el.setAttribute('aria-invalid', bad); $('#e'+id.slice(1)).textContent = bad ? r : ''; return !bad; }
  Object.keys(rules).forEach(id => $('#'+id).addEventListener('blur', () => check(id)));
  f.addEventListener('submit', e => {
    e.preventDefault();
    const ok = Object.keys(rules).map(check).every(Boolean); if (!ok) { f.querySelector('[aria-invalid="true"]').focus(); return; }
    if ($('#fWeb').value) return; // bot
    const btn = $('#submitBtn'); btn.disabled = true; btn.textContent = 'Sending…';
    setBrand($('#fBrand').value);
    const done = () => { f.hidden = true; $('#ok').hidden = false; };
    const live = /payoffcreative\.com$|netlify\.app$/.test(location.hostname);
    if (!live) { $('#okNote').hidden = false; setTimeout(done, 900); return; } // preview: nothing is sent
    // live: Netlify Forms stores the request and emails it (Site settings → Forms → notifications)
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(f)).toString() })
      .then(r => { if (!r.ok) throw 0; done(); })
      .catch(() => { btn.disabled = false; btn.textContent = 'Get my free teardown'; $('#eContact').textContent = "That didn't send. Try again, or WhatsApp us on +91 88267 74234."; });
  });


  /* v11: mobile menu */
  (function(){
    const btn = $('#menuBtn'), sheet = $('#msheet');
    const set = on => { btn.setAttribute('aria-expanded', on); btn.setAttribute('aria-label', on ? 'Close menu' : 'Open menu'); document.body.classList.toggle('menu-on', on);
      if (on) { sheet.hidden = false; requestAnimationFrame(() => sheet.classList.add('open')); lenis && lenis.stop(); }
      else { sheet.classList.remove('open'); lenis && lenis.start(); setTimeout(() => { if (!sheet.classList.contains('open')) sheet.hidden = true; }, 700); } };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    sheet.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); set(false); const t = $(a.getAttribute('href')); setTimeout(() => lenis ? lenis.scrollTo(t, {offset: -70}) : t.scrollIntoView({behavior: 'smooth'}), 350); }));
    sheet.querySelector('.msheet-foot a[href="#teardown"]').addEventListener('click', () => set(false));
    addEventListener('keydown', e => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') set(false); });
  })();
  /* cookie consent: analytics only after yes */
  const ck = store.get('payoff-cookie');
  if (!ck) { $('#cookie').hidden = false; document.body.classList.add('cookie-on'); }
  function consent(v){ store.set('payoff-cookie', v); $('#cookie').hidden = true; document.body.classList.remove('cookie-on'); if (v === 'yes' && window.PAYOFF_GA_ID) { /* production: load GA4 with window.PAYOFF_GA_ID */ } }
  $('#ckYes').addEventListener('click', () => consent('yes')); $('#ckNo').addEventListener('click', () => consent('no'));

  /* captions: split into words that rise out of a mask, one after another */
  $$('.cap .big, .cap .mid').forEach(el => {
    let i = 0; const out = document.createDocumentFragment();
    const wrap = node => { const w = document.createElement('span'); w.className = 'wd'; const inner = document.createElement('span'); inner.style.setProperty('--i', i++); inner.appendChild(node); w.appendChild(inner); return w; };
    [...el.childNodes].forEach(n => {
      if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(part => { if (!part) return; out.appendChild(/^\s+$/.test(part) ? document.createTextNode(' ') : wrap(document.createTextNode(part))); });
      else out.appendChild(wrap(n));
    });
    el.textContent = ''; el.appendChild(out);
  });
  /* main loop — cached refs, writes only on change */
  const asSec = $('#assemble');
  const tdn = $('#teardown'), bars = $('#bars'), actEl = $('#act'), tcEl = $('#tc'), progEl = $('#prog'), heroTc = $('#heroTc'), heroSec = $('#intro');
  let docH = 0; const measure = () => { docH = Math.max(1, document.documentElement.scrollHeight - innerHeight); }; measure(); addEventListener('resize', measure); new ResizeObserver(measure).observe(document.body);
  let zS = 0, lastKey = -1, lastAct = '', lastTc = '';
  const strip = $('#strip');
  strip.innerHTML = ACTS.map((a, k) => `<button type="button" data-k="${k}" style="background-image:url(thumb-${k}.jpg)"><span class="vh">${a}</span></button>`).join('');
  const sBtns = $$('#strip button');
  sBtns.forEach(bn => bn.addEventListener('click', () => { const k = +bn.dataset.k, span = film.offsetHeight - innerHeight; const p = k >= N ? .99 : (k + HOLD * .5) / N; const y = film.offsetTop + span * p; lenis ? lenis.scrollTo(y, {duration: 1.6}) : scrollTo({top: y, behavior: 'smooth'}); }));
  function frame(){
    const y = scrollY, vh = innerHeight;
    nav.classList.toggle('solid', y > 40);
    meter.style.transform = 'scaleX(' + Math.min(1, y / docH) + ')';
    const tr = tdn.getBoundingClientRect(), fr = film.getBoundingClientRect();
    const ar = asSec.getBoundingClientRect();
    mcta.classList.toggle('hide', y < vh*.6 || (tr.top < vh && tr.bottom > 0) || (fr.top < 1 && fr.bottom > vh*.5) || (ar.top < vh*.5 && ar.bottom > vh*.5));
    // film
    if (fr.top < vh && fr.bottom > 0) {
      const st = filmState();
      cur += (st.t - cur) * (reduce ? 1 : .14);
      if (video.readyState >= 1 && video.duration && !video.seeking && Math.abs(cur - lastSet) > .012) { video.currentTime = Math.min(cur, video.duration - .05); lastSet = cur; }
      const si = Math.round(cur/5); if (si !== lastStill && !film.classList.contains('ready')) { still.src = 'still-' + (portrait ? 'v' : '') + Math.min(si,N) + '.jpg'; lastStill = si; }
      if (!reduce) { zS += (st.z - zS) * .08; film.style.setProperty('--z', (1 + zS * .045).toFixed(4)); }
      const capKey = st.holding ? st.key : -1;
      if (capKey !== lastKey) { caps.forEach(c => c.classList.toggle('on', +c.dataset.k === capKey)); fl.classList.toggle('on', capKey === 4); lastKey = capKey; }
      bars.classList.toggle('on', cur > 8.4 && cur < 11.5);
      const ai = Math.min(N, Math.round(cur/5)), act = ACTS[ai]; if (act !== lastAct) { actEl.textContent = act; sBtns.forEach((bn, k) => bn.classList.toggle('on', k === ai)); lastAct = act; }
      const tc = '00:' + String(Math.round(cur)).padStart(2,'0') + ' / 00:45'; if (tc !== lastTc) { tcEl.textContent = tc; lastTc = tc; }
      progEl.style.transform = 'scaleX(' + (cur/DUR).toFixed(4) + ')';
    }
    // hero viewfinder timecode (only while the hero is on screen)
    if (!hv.paused && y < vh) { const t = hv.currentTime + 12*60; const f = Math.floor((t%1)*24); heroTc.textContent = '00:' + String(Math.floor(t/60)).padStart(2,'0') + ':' + String(Math.floor(t%60)).padStart(2,'0') + ':' + String(f).padStart(2,'0'); }
    // cursor: dot is instant, ring lags and stretches along its motion
    cdot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
    vx = mx - cx; vy = my - cy; cx += vx * .18; cy += vy * .18;
    const sp = Math.min(Math.hypot(vx, vy) / 180, .45), ang = Math.atan2(vy, vx) * 180 / Math.PI;
    cursor.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%) rotate(${ang}deg) scale(${1 + sp},${1 - sp * .6})`;
    clabel.style.transform = `rotate(${-ang}deg)`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
