/* No scroll hijacking. Media loads only after intentional desktop interaction. */
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const players = new Set();
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (!motion.matches) entry.target.classList.add('studio-reveal');
      reveal.unobserve(entry.target);
    }), {threshold:.12});
    document.querySelectorAll('.studio-reel,.home-path-grid>div,.core-slate,.core-proof .core-work').forEach(el => reveal.observe(el));
  }
  const stopAll = () => players.forEach(video => {video.pause();video.classList.remove('is-playing');});
  document.querySelectorAll('[data-preview]').forEach(card => {
    let video, timer;
    const stop = () => {clearTimeout(timer);if(video){video.pause();video.classList.remove('is-playing');}};
    card.addEventListener('pointerenter', () => {
      if(motion.matches || !fine.matches || navigator.connection?.saveData || !/\.mp4$/.test(card.dataset.preview)) return;
      timer = setTimeout(() => {
        stopAll();
        if(!video){video=document.createElement('video');video.className='studio-preview-video';video.muted=true;video.loop=true;video.playsInline=true;video.preload='none';video.setAttribute('aria-hidden','true');video.src=card.dataset.preview;card.prepend(video);players.add(video);}
        video.play().then(()=>{if(card.matches(':hover')&&!motion.matches)video.classList.add('is-playing');else stop();}).catch(stop);
      },250);
    });
    card.addEventListener('pointerleave',stop);
    card.addEventListener('blur',stop,true);
    if('IntersectionObserver' in window)new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)stop();}).observe(card);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAll();});
  motion.addEventListener('change',stopAll);
})();
