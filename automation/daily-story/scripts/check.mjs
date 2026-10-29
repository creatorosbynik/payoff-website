// Payoff Daily Story Engine — quality gate.
// Usage: node automation/daily-story/scripts/check.mjs <day-folder> [--json]
// Checks the day's blog post, story.json (video + social) and assets against engine.config.json.
// Exit code 1 = at least one FAIL. WARNs are listed in the PR for Nikunj but don't block.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const here = path.dirname(fileURLToPath(import.meta.url));
const engine = path.resolve(here, "..");
const repo = path.resolve(engine, "../..");
const cfg = JSON.parse(fs.readFileSync(path.join(engine, "engine.config.json"), "utf8"));
const dayDir = path.resolve(process.argv[2] || "");
const asJson = process.argv.includes("--json");
const results = [];
const fail = (area, msg) => results.push({ level: "FAIL", area, msg });
const warn = (area, msg) => results.push({ level: "WARN", area, msg });
const pass = (area, msg) => results.push({ level: "PASS", area, msg });

if (!fs.existsSync(path.join(dayDir, "story.json"))) {
  console.error("Usage: check.mjs <day-folder with story.json>");
  process.exit(2);
}
const story = JSON.parse(fs.readFileSync(path.join(dayDir, "story.json"), "utf8"));

// ---------- blocklists ----------
// Module A8 (vanr-content-engine) + Payoff brand rules. Whole words / phrases, case-insensitive.
const A8 = [
  "delve", "elevate", "elevates", "elevating", "unlock", "unlocks", "unleash", "harness", "leverage", "leverages", "leveraging",
  "seamless", "seamlessly", "robust", "game-changer", "game changer", "testament to", "tapestry", "realm", "embark",
  "foster", "empower", "empowers", "revolutionize", "revolutionise", "cutting-edge", "in today's fast-paced world",
  "ever-evolving", "look no further", "dive in", "let's dive", "deep dive", "buckle up", "that being said",
  "it's worth noting", "it is worth noting", "navigate the", "navigating the", "landscape of", "arguably", "essentially",
];
const A8_PATTERNS = [
  [/\bit'?s not just\b[^.]{0,60}\bit'?s\b/i, "\"It's not just X, it's Y\" construction"],
  [/\bever wondered\b/i, "\"Ever wondered…?\" opener"],
  [/\bwhether you'?re\b[^.]{0,40}\bor\b/i, "\"Whether you're X or Y\" construction"],
  [/—[^—\n]{1,80}—[^—\n]{1,80}—/, "em-dash chain"],
];
const BRAND_BANNED = cfg.brand_rules.never_say;

function scanText(area, text) {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const w of A8) {
    const re = new RegExp(`(^|[^a-z])${w.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}([^a-z]|$)`, "i");
    if (re.test(lower)) { fail(area, `A8 blocklist word: "${w}"`); hits++; }
  }
  for (const [re, label] of A8_PATTERNS) if (re.test(text)) { fail(area, `A8 pattern: ${label}`); hits++; }
  for (const b of BRAND_BANNED) {
    const re = new RegExp(`\\b${b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, b === b.toUpperCase() ? "" : "i");
    if (re.test(text)) { fail(area, `Brand rule: never say "${b}"`); hits++; }
  }
  if (!hits) pass(area, "A8 + brand blocklist clean");
}

const words = (s) => (s.match(/[A-Za-z0-9₹%'’-]+/g) || []).length;

// ---------- 1. blog post ----------
const postFile = path.join(repo, story.post?.file || "");
if (!story.post?.file || !fs.existsSync(postFile)) {
  fail("post", `Post file missing: ${story.post?.file}`);
} else {
  const raw = fs.readFileSync(postFile, "utf8");
  const { data: fm, content } = matter(raw);
  const depth = cfg.depth[story.depth];
  if (!depth) fail("story", `Unknown depth "${story.depth}"`);
  const body = content.replace(/```[\s\S]*?```/g, "");
  const wc = words(body.replace(/<[^>]+>/g, " ").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1"));

  for (const k of ["title", "description", "status", "date", "category", "cover", "cover_alt"]) if (!fm[k]) fail("front matter", `Missing ${k}`);
  if (!fm.seo?.slug || !fm.seo?.keyword || !fm.seo?.title) fail("front matter", "Missing seo.slug / seo.keyword / seo.title");
  if (fm.seo?.slug && fm.seo.slug !== story.slug) fail("front matter", `seo.slug "${fm.seo.slug}" ≠ story.slug "${story.slug}"`);
  const cats = ["Brand Story", "Ads & Performance", "Video & Content", "Teardowns", "Founder Notes"];
  if (fm.category && !cats.includes(fm.category)) fail("front matter", `Category "${fm.category}" is not one of the blog's categories`);
  if (fm.status !== "published") fail("front matter", `status must be "published" in the preview PR (merge = go live); got "${fm.status}"`);
  const dl = (fm.description || "").length;
  if (dl < 105 || dl > 160) warn("SEO", `Summary is ${dl} chars (aim 120–160)`);
  const tl = (fm.seo?.title || "").length;
  if (tl > 55) warn("SEO", `SEO title is ${tl} chars (max 55)`);
  if (Array.isArray(fm.tags) && fm.tags.some((t) => !/\s/.test(t) && t.length > 18)) fail("front matter", "A tag looks like several tags glued together");
  if (!Array.isArray(fm.tags) || fm.tags.length < 3) warn("SEO", "Use 3–7 tags from the Blog SEO Strategy tag list");
  const faqs = Array.isArray(fm.faqs) ? fm.faqs.length : 0;
  if (depth && (faqs < depth.faqs[0] || faqs > depth.faqs[1])) fail("SEO", `${faqs} FAQs; ${story.depth} needs ${depth.faqs.join("–")}`);

  if (depth && (wc < depth.words[0] || wc > depth.words[1])) fail("length", `${wc} words; ${story.depth} needs ${depth.words.join("–")}`);
  else pass("length", `${wc} words`);

  // keyword placement
  const kw = (fm.seo?.keyword || "").toLowerCase();
  if (kw) {
    const first100 = body.split(/\s+/).slice(0, 100).join(" ").toLowerCase();
    const kwRoot = kw.split(" ").filter((w) => w.length > 3);
    const has = (s) => kwRoot.every((w) => s.toLowerCase().includes(w));
    if (!has(fm.title || "") && !has(fm.seo?.title || "")) warn("SEO", `Keyword "${kw}" not in headline or SEO title`);
    if (!has(first100)) warn("SEO", `Keyword "${kw}" not in the first 100 words`);
    if (!(body.match(/^##\s.+$/gm) || []).some(has)) warn("SEO", `Keyword "${kw}" not in any H2`);
  }
  const h2 = (body.match(/^##\s/gm) || []).length;
  if (h2 < 3) warn("structure", `Only ${h2} H2s (table of contents needs 3+)`);

  // links
  const links = [...body.matchAll(/\]\(([^)\s]+)/g)].map((m) => m[1]);
  const internal = links.filter((l) => l.startsWith("/") || l.includes("payoffcreative.com"));
  const external = links.filter((l) => /^https?:\/\//.test(l) && !l.includes("payoffcreative.com"));
  if (depth && internal.length < depth.internal_links_min) fail("links", `${internal.length} internal links; need ${depth.internal_links_min}+`);
  if (depth && external.length < depth.external_links_min) fail("links", `${external.length} source links; need ${depth.external_links_min}+`);
  for (const l of internal) {
    const m = l.match(/^\/blog\/([^/#]+)\/?/);
    if (m) {
      const slugs = fs.readdirSync(path.join(repo, "blog/posts")).filter((f) => f.endsWith(".md")).map((f) => {
        const d = matter(fs.readFileSync(path.join(repo, "blog/posts", f), "utf8")).data;
        return d.status === "published" || f === path.basename(postFile) ? (d.seo?.slug || f.replace(/\.md$/, "")) : null;
      });
      if (!slugs.includes(m[1])) fail("links", `Internal link to a post that isn't published: ${l}`);
    }
  }

  // numbers need sources: a paragraph with ₹ / % / a 2+ digit stat should carry a link
  for (const para of body.split(/\n\s*\n/)) {
    if (/^(#|\||!|<|-\s*\[)/.test(para.trim())) continue;
    if (/(₹\s?\d|\d+(\.\d+)?\s?%|\b\d{2,}\s?(lakh|crore|million|billion|x)\b)/i.test(para) && !/\]\(https?:/.test(para) && !/\[\^/.test(para)) {
      warn("facts", `Number without a source link in: "${para.trim().slice(0, 90)}…"`);
    }
  }

  // images
  const imgs = [fm.cover, ...[...body.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)].map((m) => m[1]), ...[...body.matchAll(/src="([^"]+)"/g)].map((m) => m[1])].filter(Boolean);
  for (const src of imgs) {
    if (/^https?:/.test(src)) { fail("images", `Hotlinked image (host it in /blog/uploads): ${src}`); continue; }
    if (!fs.existsSync(path.join(repo, src.replace(/^\//, "")))) fail("images", `Image file missing: ${src}`);
  }
  const altless = (body.match(/!\[\s*\]\(/g) || []).length;
  if (altless) fail("images", `${altless} image(s) without alt text`);
  if (depth && (imgs.length < depth.images[0])) warn("images", `${imgs.length} images; ${story.depth} aims for ${depth.images.join("–")}`);

  scanText("post", raw);
  if (!/teardown/i.test(raw) && !fm.cta) warn("CTA", "No teardown CTA and no custom cta set (default CTA will show)");
}

// ---------- 2. story.json essentials ----------
for (const k of ["date", "slug", "topic", "one_idea", "firsthand", "pillar", "depth", "keyword"]) if (!story[k]) fail("story", `story.json missing "${k}"`);
if (story.firsthand && words(story.firsthand) < 8) warn("story", "First-hand element is thin; every post needs something only Payoff could say");
if (story.pillar?.includes("Teardown") && !story.checks?.ad_signals_done) warn("teardown", "Teardown: run the Ad Signals (Meta Ad Library) pass before merging");

// ---------- 3. reel ----------
const v = story.video;
if (!v) fail("reel", "story.json has no video block");
else {
  const vc = cfg.video;
  const plain = (s) => (s || "").replace(/\*/g, "");
  if (!v.beats || v.beats.length < vc.beats[0] || v.beats.length > vc.beats[1]) fail("reel", `Reel needs ${vc.beats.join("–")} beats`);
  if (words(plain(v.hook)) > vc.hook_max_words) fail("reel", `Hook is ${words(plain(v.hook))} words (max ${vc.hook_max_words})`);
  (v.beats || []).forEach((b, i) => {
    if (words(plain(b.text)) > vc.beat_max_words) fail("reel", `Beat ${i + 1} is ${words(plain(b.text))} words (max ${vc.beat_max_words})`);
    if (!/\*[^*]+\*/.test(b.text)) warn("reel", `Beat ${i + 1} has no *highlight* word`);
    if (b.image && b.image.startsWith("day/") && !fs.existsSync(path.join(dayDir, b.image.slice(4)))) fail("reel", `Beat ${i + 1} image missing: ${b.image}`);
  });
  if (words(plain(v.move)) > vc.move_max_words) fail("reel", `Move is ${words(plain(v.move))} words (max ${vc.move_max_words})`);
  scanText("reel", [v.hook, ...(v.beats || []).map((b) => b.text), v.move, v.cta].join("\n"));
  if (fs.existsSync(path.join(dayDir, "reel.mp4"))) pass("reel", "reel.mp4 rendered");
  else warn("reel", "reel.mp4 not rendered yet");
}

// ---------- 4. social + lead ----------
const s = story.social || {};
if (!s.ig_caption) fail("social", "Missing Instagram caption");
if (!s.linkedin_post) warn("social", "Missing LinkedIn post");
if (s.ig_caption && !new RegExp(cfg.video.comment_keyword).test(s.ig_caption)) warn("social", `Caption doesn't ask people to comment ${cfg.video.comment_keyword}`);
if (!story.lead_hook) fail("lead", "Missing lead_hook (DM/email opener for the Signal Board)");
scanText("social", [s.ig_caption, s.linkedin_post, story.lead_hook].filter(Boolean).join("\n"));

// ---------- report ----------
const fails = results.filter((r) => r.level === "FAIL");
const warns = results.filter((r) => r.level === "WARN");
if (asJson) {
  console.log(JSON.stringify({ ok: !fails.length, fails, warns, passes: results.filter((r) => r.level === "PASS") }, null, 2));
} else {
  for (const r of results) console.log(`${r.level.padEnd(4)}  [${r.area}] ${r.msg}`);
  console.log(`\n${fails.length ? "✗ BLOCKED" : "✓ READY FOR REVIEW"} — ${fails.length} fail, ${warns.length} warn`);
}
process.exit(fails.length ? 1 : 0);
