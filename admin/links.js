// Payoff ad link builder: UTM links, Meta "URL parameters" and QR codes. Runs entirely in the browser.
(function () {
  var SITE = "https://payoffcreative.com";
  var $ = function (id) { return document.getElementById(id); };
  var PRESETS = [
    { label: "Meta ad (FB + IG)", source: "meta", medium: "paid_social", meta: true },
    { label: "Instagram bio", source: "instagram", medium: "bio" },
    { label: "Instagram story", source: "instagram", medium: "story" },
    { label: "Instagram post / reel", source: "instagram", medium: "social" },
    { label: "WhatsApp", source: "whatsapp", medium: "dm" },
    { label: "LinkedIn", source: "linkedin", medium: "social" },
    { label: "Google Ads", source: "google", medium: "cpc" },
    { label: "YouTube", source: "youtube", medium: "social" },
    { label: "Email", source: "email", medium: "email" },
    { label: "QR / print", source: "qr", medium: "print" }
  ];
  var current = PRESETS[0];

  var slug = function (s) {
    return String(s || "").trim().toLowerCase().replace(/[^a-z0-9_{}.\-]+/g, "-").replace(/^-+|-+$/g, "");
  };

  // Presets
  var wrap = $("presets");
  PRESETS.forEach(function (p, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = p.label;
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", i === 0 ? "true" : "false");
    b.addEventListener("click", function () {
      current = p;
      Array.prototype.forEach.call(wrap.children, function (c) { c.setAttribute("aria-checked", "false"); });
      b.setAttribute("aria-checked", "true");
      $("source").value = p.source;
      $("medium").value = p.medium;
      $("dynamic").closest("label").hidden = !p.meta;
      if (!p.meta) $("dynamic").checked = false;
      update();
    });
    wrap.appendChild(b);
  });

  // Posts
  fetch("/admin/posts.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (posts) {
      var sel = $("page");
      if (!posts.length) { $("postsNote").textContent = "No live posts yet. Publish one and it appears here."; return; }
      var g = document.createElement("optgroup");
      g.label = "Blog posts";
      posts.forEach(function (p) {
        var o = document.createElement("option");
        o.value = p.url;
        o.textContent = p.title + (p.status === "hidden" ? "  (hidden ad page)" : "");
        g.appendChild(o);
      });
      sel.appendChild(g);
      $("postsNote").textContent = posts.length + " live post" + (posts.length === 1 ? "" : "s") + " loaded.";
    })
    .catch(function () { $("postsNote").textContent = "Couldn't load posts. You can still paste a link."; });

  function params() {
    var dyn = $("dynamic").checked;
    var p = [
      ["utm_source", dyn ? "{{site_source_name}}" : slug($("source").value)],
      ["utm_medium", slug($("medium").value)],
      ["utm_campaign", dyn ? "{{campaign.name}}" : slug($("campaign").value)],
      ["utm_content", dyn ? "{{ad.name}}" : slug($("content").value)]
    ];
    if (dyn) p.push(["utm_term", "{{adset.name}}"]);
    return p.filter(function (x) { return x[1]; }).map(function (x) { return x[0] + "=" + (dyn ? x[1] : encodeURIComponent(x[1])); }).join("&");
  }

  function baseUrl() {
    var c = $("custom").value.trim();
    var u = c || $("page").value;
    if (!/^https?:\/\//.test(u)) u = SITE + (u.charAt(0) === "/" ? u : "/" + u);
    return u;
  }

  function build() {
    var u = baseUrl();
    var q = params();
    var parts = u.split("#");
    var base = parts[0], hash = parts[1];
    var full = q ? base + (base.indexOf("?") > -1 ? "&" : "?") + q : base;
    return hash ? full + "#" + hash : full;
  }

  function drawQr(text) {
    var c = $("qr"), ctx = c.getContext("2d");
    var qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    var n = qr.getModuleCount(), quiet = 4, size = c.width;
    var cell = size / (n + quiet * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#241A15";
    for (var r = 0; r < n; r++) for (var col = 0; col < n; col++) {
      if (qr.isDark(r, col)) ctx.fillRect(Math.floor((col + quiet) * cell), Math.floor((r + quiet) * cell), Math.ceil(cell), Math.ceil(cell));
    }
  }

  function update() {
    var url = build();
    $("url").textContent = url;
    $("open").href = url.replace(/\{\{[^}]+\}\}/g, "test");
    var isMeta = current.meta;
    $("metaBox").hidden = !isMeta;
    $("params").textContent = params();
    // QR codes use the plain tagged link (no Meta placeholders)
    var qrText = $("dynamic").checked ? url.replace(/\{\{[^}]+\}\}/g, "meta") : url;
    try { drawQr(qrText); } catch (e) {}
  }

  function copy(text, btn) {
    var done = function () { var t = btn.textContent; btn.textContent = "Copied"; setTimeout(function () { btn.textContent = t; }, 1400); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () { window.prompt("Copy:", text); });
    else window.prompt("Copy:", text);
  }

  $("f").addEventListener("submit", function (e) { e.preventDefault(); });
  ["page", "custom", "source", "medium", "campaign", "content", "dynamic"].forEach(function (id) {
    $(id).addEventListener("input", update);
    $(id).addEventListener("change", update);
  });
  $("copyUrl").addEventListener("click", function () { copy($("url").textContent, this); });
  $("copyParams").addEventListener("click", function () { copy($("params").textContent, this); });
  $("dlQr").addEventListener("click", function () {
    var a = document.createElement("a");
    var name = slug($("campaign").value || "payoff") + "-" + slug($("content").value || $("source").value || "qr");
    a.download = "qr-" + name + ".png";
    a.href = $("qr").toDataURL("image/png");
    a.click();
  });
  update();
})();
