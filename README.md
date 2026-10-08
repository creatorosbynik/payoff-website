# Payoff website — payoffcreative.com

Eleventy builds commercial pages, the blog, RSS, sitemap and shortlinks into `_site`. The cinematic homepage and its assets are copied into the same output.

## Develop and verify

Use Node 22, matching Netlify and GitHub Actions.

```sh
npm ci
npm start
# Preview at http://localhost:8080
npm run build
npm test
```

Deploy `_site`, not the repository root. GitHub Actions verifies builds on pull requests. Netlify retains the existing deployment workflow.

## Where to edit

- `index.html`, `css/site.css`, `js/site.js`, `js/premium.js`: homepage, story film, teardown and creator flows.
- `index.html` → `workData`: curated portfolio with media, partner credits and spec labels. Both homepage reels and generated proof modules reuse it.
- `_blog/data/agency.mjs`: commercial copy, FAQs, related links and proof selections.
- `_blog/pages/core.njk`, `_blog/includes/base.njk`: page template and shared navigation/footer.
- `css/agency.css`, `js/agency.js`: new page styles, media previews and brief form.
- `blog/posts/`, `_blog/layouts/`, `admin/`: blog/CMS. See [BLOG-GUIDE.md](BLOG-GUIDE.md).
- `_blog/pages/sitemap.njk`, `robots.txt`, `netlify.toml`: SEO and deployment policies.

Keep the supplied logo and brand assets. Do not invent project results, prices or credits. FAQs must match schema. New pages need a distinct intent, sitemap entry and contextual internal links.

## Forms and SEO

Netlify Forms processes `teardown`, `creator` and `brief`. Configure detection and notifications in Netlify; verify a deployed submission reaches the intended recipient. Local brief previews never claim to submit data. The brief confirmation route is noindex.

Preserve existing domain, mail and Search Console verification settings. Submit the generated `/sitemap.xml` after deployment.

See [the architecture audit and rollout notes](docs/SEO-IMPLEMENTATION.md) for route intent, launch checks, limitations and recommended content clusters.

