/* Native controls remain usable without JavaScript. Never start audio automatically. */
(() => {
  const feature = document.querySelector('.featured-cut-video');
  if (feature) {
    document.addEventListener('play', event => {
      if (!(event.target instanceof HTMLVideoElement)) return;
      document.querySelectorAll('video').forEach(video => {
        if (video !== event.target) video.pause();
      });
    }, true);
    if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) feature.pause();
    }).observe(feature);
    document.addEventListener('visibilitychange', () => { if (document.hidden) feature.pause(); });
  }
  const menu = document.querySelector('.explore-menu');
  menu?.addEventListener('keydown', event => {
    if (event.key === 'Escape') { menu.open = false; menu.querySelector('summary').focus(); }
  });
})();
