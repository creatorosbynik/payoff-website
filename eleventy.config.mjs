// Payoff website build.
// Preserve the cinematic homepage; generate commercial pages and the blog with Eleventy.
import fs from "node:fs";
import getAgency from "./_blog/data/agency.mjs";
import { agencySchema } from "./_blog/lib/agency-schema.mjs";
import { imageTransformPlugin } from "@11ty/eleventy-img";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import { videoEmbeds, slugify, readingMinutes, buildToc, absoluteUrl, withUtm, isoDate, prettyDate } from "./_blog/lib/helpers.mjs";

export default function (eleventyConfig) {
  // Register explicitly so pagination receives the resolved page model.
  eleventyConfig.addGlobalData("agency", getAgency);
  // ---------- 1. Copy the existing static site untouched ----------
  // Root-level files (index.html, videos, images, icons, robots.txt, etc.)
  eleventyConfig.addPassthroughCopy("*.{html,css,js,jpg,jpeg,png,webp,avif,gif,svg,ico,mp4,webm,txt,webmanifest,pdf}");
  // Every top-level folder (css, js, work, admin, and any you add later) except build/tooling folders
  const skip = new Set(["node_modules", "_site", "_blog", "blog", ".cache", "scripts", "docs"]);
  for (const d of fs.readdirSync(".", { withFileTypes: true })) {
    if (d.isDirectory() && !d.name.startsWith(".") && !skip.has(d.name)) eleventyConfig.addPassthroughCopy(d.name);
  }
  eleventyConfig.addPassthroughCopy("blog/uploads");
  eleventyConfig.addPassthroughCopy("blog/assets");
  // The old hand-written sitemap is replaced by the generated one
  eleventyConfig.ignores.add("sitemap.xml");
  eleventyConfig.ignores.add("README.md");
  eleventyConfig.ignores.add("BLOG-GUIDE.md");
  eleventyConfig.ignores.add("docs/**");
  eleventyConfig.ignores.add("scripts/**");
  eleventyConfig.addFilter("agencySchema", agencySchema);
  eleventyConfig.addWatchTarget("./index.html");
  // Preview deployments should not compete with the canonical production URLs.
  eleventyConfig.on("eleventy.after", async () => {
    if (["deploy-preview", "branch-deploy"].includes(process.env.CONTEXT)) {
      fs.writeFileSync("_site/_headers", "/*\n  X-Robots-Tag: noindex, nofollow\n");
    }
  });
  eleventyConfig.ignores.add("node_modules/**");
  eleventyConfig.ignores.add("_site/**");

  // ---------- 2. Markdown ----------
  const md = markdownIt({ html: true, linkify: true, typographer: true, breaks: false })
    .use(markdownItAnchor, { level: [2, 3], slugify, tabIndex: false });
  // External links open in a new tab; internal ones stay
  const defaultLink = md.renderer.rules.link_open || ((t, i, o, e, s) => s.renderToken(t, i, o));
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const href = tokens[idx].attrGet("href") || "";
    if (/^https?:\/\//.test(href) && !href.includes("payoffcreative.com")) {
      tokens[idx].attrSet("target", "_blank");
      tokens[idx].attrSet("rel", "noopener");
    }
    return defaultLink(tokens, idx, options, env, self);
  };
  eleventyConfig.setLibrary("md", md);
  eleventyConfig.addFilter("md", (s) => (s ? md.render(String(s)) : ""));
  eleventyConfig.addFilter("mdInline", (s) => (s ? md.renderInline(String(s)) : ""));
  eleventyConfig.addFilter("blogFaqSchema", (faqs = []) => ({
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faqs.map(f => ({"@type": "Question", name: f.q,
      acceptedAnswer: {"@type": "Answer", text: md.render(String(f.a || "")).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}}))
  }));

  // ---------- 3. Images: every photo in a post becomes a fast, responsive WebP ----------
  eleventyConfig.addPlugin(imageTransformPlugin, {
    formats: ["webp", "auto"],
    widths: [480, 960, 1600, "auto"],
    failOnError: false,
    htmlOptions: {
      imgAttributes: { loading: "lazy", decoding: "async", sizes: "(min-width: 780px) 720px, 92vw" },
      pictureAttributes: {},
    },
    sharpJpegOptions: { quality: 78, progressive: true },
    sharpWebpOptions: { quality: 76 },
  });

  // ---------- 4. Filters ----------
  eleventyConfig.addFilter("isoDate", isoDate);
  eleventyConfig.addFilter("prettyDate", prettyDate);
  eleventyConfig.addFilter("readingMinutes", readingMinutes);
  eleventyConfig.addFilter("absoluteUrl", absoluteUrl);
  eleventyConfig.addFilter("slugify", slugify);
  eleventyConfig.addFilter("withUtm", withUtm);
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v ?? null).replace(/</g, "\\u003c"));
  eleventyConfig.addFilter("toc", buildToc);
  eleventyConfig.addFilter("excerpt", (content = "", n = 160) => {
    const t = String(content).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, "") + "…" : t;
  });
  eleventyConfig.addFilter("categoryName", (slug, settings) => {
    const c = (settings.categories || []).find((c) => c.slug === slug || slugify(c.name) === slug);
    return c ? c.name : slug;
  });
  eleventyConfig.addFilter("postUrl", (posts = [], key = "") => {
    const hit = posts.find((p) => p.page.fileSlug === key || p.url === `/blog/${key}/`);
    return hit ? hit.url : `/blog/${slugify(key)}/`;
  });
  eleventyConfig.addFilter("where", (arr = [], key, val) => arr.filter((x) => x.data[key] === val));
  eleventyConfig.addFilter("limit", (arr = [], n) => arr.slice(0, n));
  eleventyConfig.addFilter("except", (arr = [], url) => arr.filter((x) => x.url !== url));
  eleventyConfig.addFilter("relatedPosts", (all = [], url, cat, n = 3) => {
    const others = all.filter((p) => p.url !== url);
    const same = others.filter((p) => p.data.category === cat);
    const rest = others.filter((p) => p.data.category !== cat);
    return [...same, ...rest].slice(0, n);
  });

  // ---------- 5. Collections ----------
  const isPost = (p) => p.inputPath.includes("/blog/posts/") && p.data.permalink !== false;
  const byDate = (a, b) => b.date - a.date;
  // Public posts: shown on the blog, in the sitemap and the RSS feed
  eleventyConfig.addCollection("posts", (api) =>
    api.getAll().filter((p) => isPost(p) && p.data.status === "published").sort(byDate)
  );
  // Everything live, including hidden ad landing pages (for the link builder)
  eleventyConfig.addCollection("livePosts", (api) =>
    api.getAll().filter((p) => isPost(p) && (p.data.status === "published" || p.data.status === "hidden")).sort(byDate)
  );
  // Categories that have at least one public post
  // Categories with 3+ published posts: used for the topic chips on /blog/
  eleventyConfig.addCollection("categoryChips", (api) => {
    const counts = new Map();
    for (const p of api.getAll().filter((p) => isPost(p) && p.data.status === "published")) {
      const slug = slugify(p.data.category || "");
      if (!slug) continue;
      const c = counts.get(slug) || { slug, name: p.data.category, count: 0 };
      c.count++;
      counts.set(slug, c);
    }
    return [...counts.values()].filter((c) => c.count >= 3);
  });

  eleventyConfig.addCollection("categoryPages", (api) => {
    const posts = api.getAll().filter((p) => isPost(p) && p.data.status === "published");
    const set = new Map();
    for (const p of posts) {
      const slug = slugify(p.data.category || "");
      if (!slug) continue;
      if (!set.has(slug)) set.set(slug, { slug, name: p.data.category, posts: [] });
      set.get(slug).posts.push(p);
    }
    for (const c of set.values()) c.posts.sort(byDate);
    return [...set.values()];
  });

  // ---------- 6. Post-processing: YouTube / Vimeo / MP4 blocks ----------
  eleventyConfig.addTransform("videoEmbeds", function (content) {
    const out = this.page.outputPath || "";
    if (out.endsWith(".html") && out.includes("/blog/")) return videoEmbeds(content);
    return content;
  });

  eleventyConfig.addWatchTarget("./_blog/");

  return {
    dir: {
      input: ".",
      includes: "_blog/includes",
      layouts: "_blog/layouts",
      data: "_blog/data",
      output: "_site",
    },
    templateFormats: ["md", "njk"],
    markdownTemplateEngine: false, // post text is never run as code, so typing {{ }} is safe
    htmlTemplateEngine: "njk",
  };
}

