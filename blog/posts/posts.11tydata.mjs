// Settings shared by every blog post.
// status: "published" = live and listed · "hidden" = live link for ads only (not listed, not in Google) · "draft" = not on the website
import Image from "@11ty/eleventy-img";
import { slugify } from "../../_blog/lib/helpers.mjs";

// 1200px JPEG of the cover for WhatsApp / LinkedIn / Facebook previews
async function ogImage(src) {
  if (!src) return "";
  if (/^https?:\/\//.test(src)) return src;
  try {
    const stats = await Image("." + src, {
      widths: [1200],
      formats: ["jpeg"],
      outputDir: "./_site/img/og/",
      urlPath: "/img/og/",
      sharpJpegOptions: { quality: 82 },
    });
    return stats.jpeg[0].url;
  } catch (e) {
    return src;
  }
}

export default {
  layout: "post.njk",
  status: "draft",
  eleventyComputed: {
    permalink: (data) => {
      if (data.status !== "published" && data.status !== "hidden") return false;
      const slug = slugify((data.seo && data.seo.slug) || data.page.fileSlug);
      return `/blog/${slug}/`;
    },
    categorySlug: (data) => slugify(data.category || ""),
    ogImageUrl: (data) => ogImage(data.cover),
  },
};
