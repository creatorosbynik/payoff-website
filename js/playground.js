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
      card.setAttribute('aria-label', `${i + 1} of ${cards.length}: ${card.querySelector('strong').textContent}. View project`);
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
