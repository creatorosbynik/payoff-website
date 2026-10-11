/* Kinetic type: progressive enhancement, bounded motion, no scroll capture. */
(() => {
  const hero = document.querySelector('.hero');
  const heading = document.querySelector('#heroH1');
  const line = heading?.querySelector('.hero-line');
  const earns = heading?.querySelector('.it');
  if (!hero || !line || !earns || !Element.prototype.animate) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const letters = [];
  const original = line.textContent;
  heading.setAttribute('aria-label', 'Every story earns.');
  line.setAttribute('aria-hidden', 'true');
  earns.setAttribute('aria-hidden', 'true');
  line.textContent = '';
  for (const char of original) {
    if (char === ' ') { line.append(document.createTextNode(' ')); continue; }
    const letter = document.createElement('span');
    letter.className = 'kinetic-letter';
    letter.textContent = char;
    line.append(letter); letters.push(letter);
  }
  const controls = document.createElement('div');
  controls.className = 'type-controls';
  const replay = document.createElement('button');
  replay.type = 'button'; replay.textContent = '↻ Play with the type';
  replay.setAttribute('aria-label', 'Replay headline animation');
  const hint = document.createElement('span');
  hint.textContent = 'Move over the letters. Make a little noise.';
  controls.append(replay, hint);
  hero.querySelector('.hero-foot').append(controls);
  let animations = [], timer, frame = 0, pointer = null, visible = true;
  const cancel = () => {
    animations.forEach(a => a.cancel()); animations = [];
    clearTimeout(timer); cancelAnimationFrame(frame); frame = 0;
    letters.forEach(el => {el.style.removeProperty('transform'); el.style.removeProperty('color');});
    earns.style.removeProperty('transform');
  };
  const play = () => {
    cancel();
    if (reduce.matches || document.hidden) return;
    letters.forEach((el, i) => animations.push(el.animate([
      {transform:'translateY(90%) rotate(12deg) scale(.65)',opacity:0},
      {transform:'translateY(-12%) rotate(-3deg) scale(1.04)',opacity:1,offset:.7},
      {transform:'translateY(0) rotate(0) scale(1)',opacity:1}
    ], {duration:1050,delay:i*55,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'})));
    animations.push(earns.animate([
      {clipPath:'inset(0 100% 0 0)',transform:'translateX(-35px) skewX(-12deg)'},
      {clipPath:'inset(0 -5% -15% -5%)',transform:'translateX(0) skewX(0)'}
    ], {duration:1400,delay:350,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}));
    timer = setTimeout(() => {animations = [];}, 1900);
  };
  const update = () => {
    frame = 0;
    if (!pointer || reduce.matches || !visible) return;
    const bounds = line.getBoundingClientRect();
    letters.forEach(el => {
      const r = el.getBoundingClientRect();
      const distance = Math.abs(pointer.x - (r.left+r.width/2));
      const strength = Math.max(0,1-distance/150) * Math.max(0,1-Math.abs(pointer.y-(bounds.top+bounds.height/2))/180);
      el.style.transform = `translateY(${-strength*22}px) rotate(${strength*((pointer.x-r.left)>r.width/2?7:-7)}deg) scaleY(${1+strength*.13})`;
      el.style.color = strength > .45 ? 'var(--red)' : '';
    });
    const box = hero.getBoundingClientRect();
    const x = (pointer.x-box.left)/box.width-.5;
    earns.style.transform = `translateX(${x*14}px) skewX(${x*5}deg)`;
  };
  hero.addEventListener('pointermove', event => {
    if (!fine.matches || reduce.matches) return;
    pointer = {x:event.clientX,y:event.clientY};
    if (!frame) frame = requestAnimationFrame(update);
  }, {passive:true});
  hero.addEventListener('pointerleave', () => {pointer=null;cancel();});
  replay.addEventListener('click', play);
  const preference = () => {cancel();controls.hidden=reduce.matches;};
  reduce.addEventListener('change', preference); preference();
  document.addEventListener('visibilitychange', () => {if(document.hidden)cancel();});
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {visible=entries[0].isIntersecting;if(!visible)cancel();}).observe(hero);
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if(!entry.isIntersecting)return;
      observer.unobserve(entry.target);
      if(reduce.matches)return;
      entry.target.animate([{transform:'translateY(45px) skewY(3deg)',opacity:.15},{transform:'none',opacity:1}],{duration:850,easing:'cubic-bezier(.16,1,.3,1)'});
    }),{threshold:.35});
    document.querySelectorAll('.studio-section-head h2,.home-path-grid h3').forEach(el=>observer.observe(el));
  }
  play();
})();

/* An intentionally manual carousel: no autoplay, scroll capture or WebGL dependency. */
(() => {
  const deck = document.querySelector('.work-deck');
  if (!deck) return;
  const cards = [...deck.querySelectorAll('.deck-card')];
  const stage = deck.querySelector('.deck-stage');
  const status = deck.querySelector('[data-deck-status]');
  let current = 0, start = null, dragged = false;
  const render = () => {
    cards.forEach((card, i) => {
      let offset = (i - current + cards.length) % cards.length;
      if (offset > cards.length / 2) offset -= cards.length;
      const depth = Math.abs(offset);
      card.style.setProperty('--offset', offset);
      card.style.setProperty('--depth', depth);
      card.style.setProperty('--layer', 10 - depth);
      card.style.setProperty('--brightness', 1 - depth * .16);
      card.dataset.active = String(offset === 0);
      card.tabIndex = offset === 0 ? 0 : -1;
      const title = card.querySelector('strong').innerHTML.replace(/<br\s*\/?\s*>/gi, ' ').replace(/<[^>]+>/g, '');
      card.setAttribute('aria-label', `${i + 1} of ${cards.length}: ${title}. View project`);
    });
    status.textContent = `${String(current + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
  };
  const move = step => { current = (current + step + cards.length) % cards.length; render(); };
  render();
  deck.classList.add('deck-ready');
  deck.querySelector('.deck-controls').hidden = false;
  deck.querySelector('[data-deck-prev]').addEventListener('click', () => move(-1));
  deck.querySelector('[data-deck-next]').addEventListener('click', () => move(1));
  deck.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    move(event.key === 'ArrowRight' ? 1 : -1);
    cards[current].focus({preventScroll:true});
  });
  stage.addEventListener('dragstart', event => event.preventDefault());
  stage.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    start = {x:event.clientX, y:event.clientY}; dragged = false;
  });
  stage.addEventListener('pointerup', event => {
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) { dragged = true; move(dx < 0 ? 1 : -1); }
    start = null;
  });
  stage.addEventListener('pointercancel', () => {start = null;});
  stage.addEventListener('pointerleave', () => {start = null;});
  stage.addEventListener('click', event => {
    if (dragged) {event.preventDefault(); dragged = false; return;}
    const card = event.target.closest('.deck-card');
    if (card && card.dataset.active !== 'true') {event.preventDefault(); current = cards.indexOf(card); render();}
  });
})();
