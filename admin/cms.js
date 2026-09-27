/* Payoff dashboard: custom blocks for the post editor + a live preview that looks like the real blog. */
(function () {
  var CMS = window.CMS;
  if (!CMS) return;
  var h = window.h;

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };
  var unesc = function (s) {
    return String(s == null ? "" : s).replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  };
  var ytId = function (u) {
    var m = String(u || "").match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : "";
  };

  CMS.registerPreviewStyle("https://fonts.googleapis.com/css2?family=Unbounded:wght@400..800&family=Fraunces:ital,opsz,wght@1,9..144,300..500&family=Manrope:wght@400..700&family=JetBrains+Mono:wght@500&display=swap");
  CMS.registerPreviewStyle("/blog/assets/blog.css");
  CMS.registerPreviewStyle("/admin/preview.css");

  // ---------- Photo (with caption and size) ----------
  var SIZES = { "is-wide": "(min-width: 1060px) 1040px, 100vw", "is-full": "100vw" };
  CMS.registerEditorComponent({
    id: "photo",
    label: "Photo",
    fields: [
      { name: "src", label: "Photo", widget: "image", choose_url: true },
      { name: "alt", label: "What's in the photo (for Google + blind readers)", widget: "string" },
      { name: "caption", label: "Caption", widget: "string", required: false },
      { name: "size", label: "Size", widget: "select", default: "is-normal", options: [
        { label: "Normal (text width)", value: "is-normal" },
        { label: "Wide", value: "is-wide" },
        { label: "Full screen width", value: "is-full" }
      ] }
    ],
    pattern: /^<figure class="(is-normal|is-wide|is-full)"><img src="([^"]*)" alt="([^"]*)"(?: sizes="[^"]*")?><figcaption>(.*?)<\/figcaption><\/figure>$/m,
    fromBlock: function (m) {
      return { size: m[1], src: unesc(m[2]), alt: unesc(m[3]), caption: unesc(m[4]) };
    },
    toBlock: function (d) {
      var size = d.size || "is-normal";
      var sizes = SIZES[size] ? ' sizes="' + SIZES[size] + '"' : "";
      return '<figure class="' + size + '"><img src="' + esc(d.src) + '" alt="' + esc(d.alt) + '"' + sizes + "><figcaption>" + esc(d.caption) + "</figcaption></figure>";
    },
    toPreview: function (d) {
      return '<figure class="' + esc(d.size || "is-normal") + '"><img src="' + esc(d.src) + '" alt="' + esc(d.alt) + '">' + (d.caption ? "<figcaption>" + esc(d.caption) + "</figcaption>" : "") + "</figure>";
    }
  });

  // ---------- Video (YouTube / Shorts / Vimeo link, or an uploaded MP4) ----------
  CMS.registerEditorComponent({
    id: "video",
    label: "Video",
    fields: [
      { name: "url", label: "YouTube, Shorts or Vimeo link", widget: "string", required: false, hint: "Paste the link from the browser or the Share button." },
      { name: "file", label: "…or upload a short MP4 (under 20 MB)", widget: "file", required: false },
      { name: "caption", label: "Caption", widget: "string", required: false },
      { name: "shape", label: "Shape", widget: "select", default: "auto", options: [
        { label: "Automatic", value: "auto" },
        { label: "Wide (16:9)", value: "wide" },
        { label: "Vertical (9:16 reel / short)", value: "vertical" }
      ] },
      { name: "poster", label: "Cover image before play", widget: "image", required: false }
    ],
    pattern: /^<div data-video="([^"]*)" data-caption="([^"]*)" data-shape="([^"]*)" data-poster="([^"]*)"><\/div>$/m,
    fromBlock: function (m) {
      var src = unesc(m[1]);
      var isFile = /^\/|\.(mp4|webm|mov)(\?|$)/i.test(src) && !/youtu|vimeo/.test(src);
      return { url: isFile ? "" : src, file: isFile ? src : "", caption: unesc(m[2]), shape: m[3] || "auto", poster: unesc(m[4]) };
    },
    toBlock: function (d) {
      var src = (d.url || "").trim() || d.file || "";
      return '<div data-video="' + esc(src) + '" data-caption="' + esc(d.caption) + '" data-shape="' + esc(d.shape || "auto") + '" data-poster="' + esc(d.poster) + '"></div>';
    },
    toPreview: function (d) {
      var src = (d.url || "").trim() || d.file || "";
      var id = ytId(src);
      var vertical = d.shape === "vertical" || (d.shape !== "wide" && /shorts\//.test(src));
      var cls = "pv-video" + (vertical ? " is-vertical" : "");
      var cap = d.caption ? "<figcaption>" + esc(d.caption) + "</figcaption>" : "";
      if (!src) return '<figure class="' + cls + '"><div class="pv-frame pv-empty">Paste a YouTube or Vimeo link</div></figure>';
      if (d.file && !d.url) {
        return '<figure class="' + cls + '"><div class="pv-frame"><video controls playsinline preload="metadata" src="' + esc(d.file) + '"></video></div>' + cap + "</figure>";
      }
      var thumb = d.poster || (id ? "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg" : "");
      return '<figure class="' + cls + '"><div class="pv-frame"><span class="pv-play">' + (thumb ? '<img src="' + esc(thumb) + '" alt="">' : "") + '<span class="pv-btn"></span></span></div>' + cap + "</figure>";
    }
  });

  // ---------- Note box (key takeaway, tip, warning) ----------
  CMS.registerEditorComponent({
    id: "note",
    label: "Note box",
    fields: [
      { name: "title", label: "Small label", widget: "string", default: "Quick takeaway" },
      { name: "text", label: "Text", widget: "text" }
    ],
    pattern: /^<aside class="note"><span class="note-t">(.*?)<\/span>\n\n([\s\S]*?)\n\n<\/aside>$/m,
    fromBlock: function (m) {
      return { title: unesc(m[1]), text: m[2] };
    },
    toBlock: function (d) {
      var text = String(d.text || "").replace(/\n{3,}/g, "\n\n").trim();
      return '<aside class="note"><span class="note-t">' + esc(d.title || "Quick takeaway") + "</span>\n\n" + text + "\n\n</aside>";
    },
    toPreview: function (d) {
      var paras = String(d.text || "").split(/\n{2,}/).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
      return '<aside class="note"><span class="note-t">' + esc(d.title) + "</span>" + paras + "</aside>";
    }
  });

  // ---------- Button (inline call to action) ----------
  CMS.registerEditorComponent({
    id: "button",
    label: "Button",
    fields: [
      { name: "label", label: "Button words", widget: "string", default: "Get my free teardown" },
      { name: "link", label: "Link", widget: "string", default: "/#teardown", hint: "A page on the site (/#teardown), a WhatsApp link (https://wa.me/918826774234?text=Hi) or any web address." }
    ],
    pattern: /^<p class="btnrow"><a href="([^"]*)">(.*?)<\/a><\/p>$/m,
    fromBlock: function (m) {
      return { link: unesc(m[1]), label: unesc(m[2]) };
    },
    toBlock: function (d) {
      return '<p class="btnrow"><a href="' + esc(d.link) + '">' + esc(d.label) + "</a></p>";
    },
    toPreview: function (d) {
      return '<p class="btnrow"><a href="' + esc(d.link) + '">' + esc(d.label) + "</a></p>";
    }
  });

  // ---------- Live preview that looks like the real post ----------
  var PostPreview = window.createClass({
    render: function () {
      var entry = this.props.entry;
      var get = function (k) { return entry.getIn(["data", k]); };
      var cover = get("cover");
      var coverAsset = cover ? this.props.getAsset(cover) : null;
      var status = get("status") || "draft";
      var date = get("date");
      var dateText = "";
      try { dateText = date ? new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""; } catch (e) {}
      var badge = { draft: "Draft · not on the website", published: "Published", hidden: "Hidden link for ads" }[status];
      return h("div", { className: "is-post pv-preview" },
        h("div", { className: "pv-status pv-" + status }, badge),
        h("article", { className: "post" },
          h("header", { className: "post-hero wrap" },
            h("nav", { className: "crumbs mono" }, h("a", null, "Blog"), get("category") ? h("span", null, "/") : null, get("category") ? h("a", null, get("category")) : null),
            h("h1", { className: "post-title" }, get("title") || "Your headline"),
            get("description") ? h("p", { className: "post-dek" }, get("description")) : null,
            h("div", { className: "post-meta" }, h("div", null, h("span", { className: "by" }, "By Nikunj"), h("span", { className: "mono sub" }, dateText)))
          ),
          coverAsset ? h("figure", { className: "post-cover wrap" }, h("img", { src: coverAsset.toString(), alt: get("cover_alt") || "" })) : null,
          h("div", { className: "paper" },
            h("div", { className: "post-body-wrap" },
              h("div", { className: "post-body" }, this.props.widgetFor("body"))
            )
          )
        )
      );
    }
  });
  CMS.registerPreviewTemplate("posts", PostPreview);
})();
