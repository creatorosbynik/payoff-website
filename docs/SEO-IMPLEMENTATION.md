# Payoff: architecture and launch notes

## Starting point (inspected 6 October 2026)

- Static, cinematic homepage copied by Eleventy; blog generated from Markdown and Nunjucks. Existing README incorrectly described the whole site as build-free.
- Main navigation and service cards pointed to homepage fragments. Work was injected from the homepage's workData JSON; the full archive CTA left the domain. About was a footer paragraph; there was no dedicated brief route.
- Three published blog posts, generated categories/RSS/shortlinks, Decap CMS and Netlify Forms. Existing teardown and creator forms retained.
- Homepage canonical, Open Graph, WebSite, ProfessionalService and FAQ schema already existed. Blog had canonical, article and breadcrumb markup.
- Existing homepage positioning, Director assets, story sequence, reels, logo, typefaces, colours and motion retained. Portfolio claims and partner credits come from existing source.
- robots.txt advertised the generated sitemap, but blocked crawling of noindex utility pages. Sitemap used build time as homepage lastmod and included every category regardless of depth.
- `/work/*` had a one-year immutable cache rule. That would incorrectly cache the new HTML work index. The rule now targets MP4 files; work images and HTML have separate policies.
- Search Console verification is not present as an HTML token in source. DNS verification or account status cannot be inferred from that. External settings remain untouched.

## Routes and search intent

| Route | Buyer decision |
|---|---|
| `/` | Understand Payoff and choose direction or execution |
| `/work/` | Assess real films, ads, motion, creator work and stills |
| `/about/` | Understand founder, philosophy and agency model |
| `/contact/` | Send an existing brief directly |
| `/services/video-production/` | Commission a film, from concept to production |
| `/services/post-production/` | Finish footage/a cut across picture, sound and delivery |
| `/services/video-editing/` | Shape raw footage into narrative, ads and variations |
| `/services/motion-graphics/` | Animate graphics, identity, ads and explainers |
| `/services/advertising/` | Build campaign ideas and creative test batches |
| `/services/content-strategy/` | Find content direction, pillars and formats |
| `/remote-creative-services/` | Evaluate a remote execution partner and workflow |
| `/d2c-creative-agency/` | Find a creative agency for a D2C brand's story |

The blog, legal routes, shortlinks, CMS and homepage teardown anchor remain. `/brief-received/` is a noindex form confirmation, excluded from the sitemap. No duplicate remote-editing or city variants were added. Work uses the original homepage dataset and preserves partner/spec labels. Case-study pages are deferred until project roles and narrative can be documented.

## Editing and implementation

- `_blog/data/agency.mjs`: original page copy, related links, proof selections and archive grouping. Add legitimate projects to the existing `index.html` workData dataset; all proof modules reuse it at build time.
- `_blog/pages/core.njk`, `_blog/includes/work-card.njk`, `two-paths.njk`: commercial pages and shared proof/CTA modules.
- `_blog/lib/agency-schema.mjs`: page, breadcrumb, provider, Service and visible FAQ schema. No reviews, ratings, prices or fabricated VideoObject dates/durations. FAQ markup does not promise Google FAQ rich results.
- `css/agency.css` and `js/agency.js`: responsive pages, native mobile navigation, on-demand video and brief-form enhancement. Content and native POST remain available without JS.
- Sitemap includes canonical core routes and indexable published posts. Sparse categories remain usable but are noindex and omitted until three posts exist. Do not generate lastmod from deployment time.
- Netlify deploy-preview/branch-deploy builds receive a noindex response header through `_headers`. Production self canonicals are retained on previews; preview URLs never enter the sitemap.
- Inline Netlify Identity redirect listener moved into an external file so the existing homepage script policy can allow it.

## Before merging / after deploying

### Current handoff status

Prepared against main commit `cdf102b94b600df157797c9d4a3b0b5253027d39`. This workspace is a text-source snapshot, not a complete Git checkout; original binary media remains in the GitHub repository. Apply the accompanying patch to a full checkout, not as a replacement site upload.

Passed: source-data/schema validation; JavaScript syntax checks; offline rendering of all 11 new core pages, confirmation, sitemap and blog-layout fixture; desktop/mobile visual spot checks; contact service-prefill and safe local submission handling. The offline renderer uses Nunjucks 3.2.2 and is not the locked production build.

Not yet verified: full Eleventy build (dependency installation unavailable in this environment), production media performance, deployed redirects/headers, Netlify form delivery and Search Console account settings. GitHub branch creation returned `403 Resource not accessible by integration`; no branch, commit, pull request or deployment has been created. The included GitHub Actions workflow has not run.

1. Run `npm ci`, `npm run build`, `npm test`; review desktop/mobile pages and homepage animation. GitHub Actions runs the same build checks on pull requests.
2. Verify Netlify detects `brief`. Configure its notification recipient as needed. Test a real brief and teardown submission on the deployed site and confirm storage plus delivery. Code-level checks cannot prove email delivery.
3. Inspect `/`, new routes, `/robots.txt`, `/sitemap.xml` and a real 404 over HTTP. Check status codes, canonical hosts, www redirects and noindex response headers on previews. Confirm noindex utilities remain crawlable.
4. In Search Console retain the existing domain verification; submit `/sitemap.xml`, inspect representative core URLs, then monitor indexing and canonical selection. Do not replace DNS records or invent a verification token.
5. Review Core Web Vitals and mobile/4G loading with real media. New pages use lazy posters, deferred scripts and video loaded on request. Homepage video remains comparatively heavy; measure before a deeper motion rewrite.
6. Keep analytics consent-aware. The brief script emits only a local `payoff:conversion` event after success, with no form values. Connect it to consent-controlled analytics after its IDs and ownership are confirmed. No third-party tracking was added.
7. Confirm Netlify Identity registration is invite-only and notification settings are correct in the hosting dashboard; neither setting is visible in source.

## Next content, in order

1. Document 3–5 real projects: brief, exact contribution, idea, process, delivered formats, partner credits and approved assets. Add measured outcomes only when supplied and defensible. Link to relevant commercial pages.
2. Editing/post: footage-handoff checklist; editing vs post-production; giving time-coded feedback; planning aspect ratios/cutdowns. Link to editing/post and remote services.
3. Motion: when motion helps explain a product; animation brief checklist; style-frame and storyboard approvals. Use actual approved examples.
4. D2C/advertising: customer language as ad angles; planning a creative test; connecting UGC to a brand story. Link to advertising/content strategy and existing articles.
5. Production: shot planning for multi-format campaigns; writing a production brief. Substantiate the existing blog's cost claims before extending price content.

Expand industry or regional pages only when Search Console shows distinct demand and enough specific work and insight exists to justify each page.

References: [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [FAQ rich-result eligibility](https://developers.google.com/search/blog/2023/08/howto-faq-changes).
