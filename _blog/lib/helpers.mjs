// Small helpers used by the blog build. No dependencies.

export function slugify(s = "") {
  return String(s)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function readingMinutes(html = "") {
  const words = String(html).replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

// Table of contents from the h2s in a post (only when there are 3 or more)
export function buildToc(html = "") {
  const out = [];
  const re = /<h2[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g;
  let m;
  while ((m = re.exec(html))) out.push({ id: m[1], text: m[2].replace(/<[^>]+>/g, "").trim() });
  return out.length >= 3 ? out : [];
}

export function absoluteUrl(path = "", base = "https://payoffcreative.com") {
  if (!path) return base + "/";
  if (/^https?:\/\//.test(path)) return path;
  return base.replace(/\/$/, "") + (path.startsWith("/") ? path : "/" + path);
}

export function withUtm(url = "", utm = {}) {
  if (!url) return url;
  const map = { utm_source: utm.source, utm_medium: utm.medium, utm_campaign: utm.campaign, utm_content: utm.content, utm_term: utm.term };
  const params = Object.entries(map).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(String(v).trim())}`);
  if (!params.length) return url;
  const [base, hash] = url.split("#");
  const joined = base + (base.includes("?") ? "&" : "?") + params.join("&");
  return hash ? `${joined}#${hash}` : joined;
}

function toDate(d) {
  if (!d) return null;
  const x = d instanceof Date ? d : new Date(d);
  return isNaN(x) ? null : x;
}
export function isoDate(d) {
  const x = toDate(d);
  return x ? x.toISOString() : "";
}
export function prettyDate(d) {
  const x = toDate(d);
  if (!x) return "";
  return x.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

// ---------- Video embeds ----------
const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const unesc = (s = "") => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

export function parseVideo(url = "") {
  url = unesc(url).trim();
  let m;
  if ((m = url.match(/(?:youtube\.com\/shorts\/)([\w-]{11})/))) return { kind: "yt", id: m[1], vertical: true, watch: `https://www.youtube.com/shorts/${m[1]}` };
  if ((m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/)|youtu\.be\/)([\w-]{11})/))) return { kind: "yt", id: m[1], vertical: false, watch: `https://www.youtube.com/watch?v=${m[1]}` };
  if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/))) return { kind: "vimeo", id: m[1], hash: m[2], watch: `https://vimeo.com/${m[1]}` };
  if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) return { kind: "file", src: url };
  return null;
}

export function videoHtml(url, caption = "", poster = "", shape = "") {
  const v = parseVideo(url);
  if (!v) return "";
  const cap = caption ? `<figcaption>${esc(caption)}</figcaption>` : "";
  const vertical = shape === "vertical" || (shape !== "wide" && v.vertical);
  const cls = `pv-video${vertical ? " is-vertical" : ""}`;
  const label = esc(caption ? `Play video: ${caption}` : "Play video");
  if (v.kind === "file") {
    return `<figure class="${cls}"><div class="pv-frame"><video controls playsinline preload="metadata"${poster ? ` poster="${esc(poster)}"` : ""}><source src="${esc(v.src)}"></video></div>${cap}</figure>`;
  }
  let embed, thumb;
  if (v.kind === "yt") {
    embed = `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    thumb = poster || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
  } else {
    embed = `https://player.vimeo.com/video/${v.id}?autoplay=1&dnt=1${v.hash ? `&h=${v.hash}` : ""}`;
    thumb = poster || "";
  }
  const img = thumb ? `<img src="${esc(thumb)}" alt="" loading="lazy" decoding="async">` : "";
  return `<figure class="${cls}"><div class="pv-frame"><a class="pv-play" href="${esc(v.watch)}" data-embed="${esc(embed)}" aria-label="${label}" target="_blank" rel="noopener">${img}<span class="pv-btn" aria-hidden="true"></span></a></div>${cap}</figure>`;
}

// Turns the editor's video blocks, and any paragraph that is only a YouTube/Vimeo link, into fast click-to-play players.
export function videoEmbeds(html = "") {
  const attr = (tag, name) => {
    const m = tag.match(new RegExp(`${name}="([^"]*)"`));
    return m ? unesc(m[1]) : "";
  };
  html = html.replace(/<div[^>]*\sdata-video="[^"]*"[^>]*>\s*<\/div>/g, (tag) =>
    videoHtml(attr(tag, "data-video"), attr(tag, "data-caption"), attr(tag, "data-poster"), attr(tag, "data-shape")) || tag
  );
  html = html.replace(/<p>\s*(?:<a [^>]*href="([^"]+)"[^>]*>[^<]*<\/a>|(https?:\/\/\S+))\s*<\/p>/g, (whole, a, b) => {
    const url = a || b;
    const v = parseVideo(url || "");
    return v && v.kind !== "file" ? videoHtml(url) : whole;
  });
  return html;
}
