// Payoff blog: header state, click-to-play videos, sticky CTA, copy link.
(function () {
  var bn = document.getElementById("bn");
  var sticky = document.getElementById("stickyCta");
  var endCta = document.querySelector(".cta-card");
  var ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY || 0;
    if (bn) bn.classList.toggle("scrolled", y > 8);
    if (sticky) {
      var doc = document.documentElement;
      var pastStart = y > window.innerHeight * 0.9;
      var nearEnd = false;
      if (endCta) {
        var r = endCta.getBoundingClientRect();
        nearEnd = r.top < window.innerHeight && r.bottom > 0;
      }
      var atBottom = y + window.innerHeight > doc.scrollHeight - 200;
      var show = pastStart && !nearEnd && !atBottom;
      if (show && sticky.hidden) sticky.hidden = false;
      sticky.classList.toggle("on", show);
    }
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  // Videos load only when someone presses play (keeps pages fast and Google happy)
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest(".pv-play");
    if (!a) return;
    var src = a.getAttribute("data-embed");
    if (!src) return;
    e.preventDefault();
    var f = document.createElement("iframe");
    f.src = src;
    f.title = a.getAttribute("aria-label") || "Video";
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.allowFullscreen = true;
    f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    a.replaceWith(f);
  });

  // Copy link
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-copy]");
    if (!b) return;
    var text = b.getAttribute("data-copy");
    var done = function () {
      var old = b.textContent;
      b.textContent = "Copied";
      b.classList.add("done");
      setTimeout(function () { b.textContent = old; b.classList.remove("done"); }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { window.prompt("Copy this link:", text); });
    } else {
      window.prompt("Copy this link:", text);
    }
  });

  // Keep UTM tags from an ad click on the teardown link, so the form knows where a lead came from
  try {
    var qs = window.location.search;
    if (/utm_/.test(qs)) {
      sessionStorage.setItem("payoff_utm", qs);
    }
  } catch (err) {}
})();
