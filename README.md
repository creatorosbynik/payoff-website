# Payoff website — payoffcreative.com

Static site. No build step. Everything the site needs is in this folder.

## Edit in VS Code
1. VS Code → File → Open Folder → `Documents/payoff-website/site`.
2. Install the **Live Server** extension (Ritwick Dey). Right-click `index.html` → **Open with Live Server** to preview at http://127.0.0.1:5500. Saving a file reloads the page.
3. Test phone layouts: in Chrome press F12 → toggle device toolbar (Ctrl+Shift+M) → pick an iPhone. Real phone check: open the Netlify URL on your phone.
4. Where things live inside `index.html`:
   - Copy: search the visible text (Ctrl+F).
   - Work pieces: the JSON inside `<script id="workData">` (title, client, video `v`, poster `p`, Drive `link`, `tab` = reel).
   - Reel titles: search `const REELS`.
   - Services: search `class="svc`.
   - Colours: `--red`, `--cream`, `--ink` at the top of the `<style>` block. Fonts: search `/* v9 — type system`.
   - Newer CSS is appended near the end of `<style>` (blocks marked v9 … v13) and overrides older rules.

## Take it live (Netlify, free)
1. Sign up at netlify.com (use GitHub login if you want auto-deploys).
2. Quick way: Sites → **Add new site → Deploy manually** → drag this `site` folder in. You get a `*.netlify.app` URL in about a minute.
   Better way: push this folder to a GitHub repo, then **Import from Git** — every save you push goes live automatically.
3. Forms: Site configuration → **Forms** → enable form detection, redeploy, then Forms → Notifications → email to hello@payoffcreative.com. The teardown form is already wired (`name="teardown"`, honeypot included). Free plan: 100 submissions/month.
4. Domain: Domain management → **Add a domain** → `payoffcreative.com`. At your domain registrar, add the DNS records Netlify shows (an A record for `@` and a CNAME for `www`).
   **Do not touch the Zoho mail records** (MX, SPF TXT, DKIM TXT) or email stops working.
5. HTTPS turns on by itself after DNS connects (can take up to 24 h).
6. Google Search Console → add payoffcreative.com → submit `https://payoffcreative.com/sitemap.xml`.
7. Optional analytics: set `window.PAYOFF_GA_ID = "G-XXXX"` and load GA4 inside `consent('yes')` — it only runs after a visitor clicks Allow.

## Files
- Story film: `film-1920-av1.mp4` (desktop), `film-m1280.mp4` (landscape phones/tablets), `film-v720.mp4` (upright phones) + `still-*.jpg`, `still-v*.jpg`, `thumb-*.jpg`.
- Method film: `assemble.mp4`, `assemble-960.mp4`, `assemble-v.mp4` + posters `as-*.jpg`.
- Hero loop: `director-loop-1920.mp4`, `director-loop-960.mp4`, `director-loop-v.mp4` + posters.
- Portfolio media: `work/`.
- Logo: `logo-cream.png` (never redraw it). Icons: `favicon-48.png`, `apple-touch-icon.png`, `icon-192/512.png`.
- Old unused files were moved to `../_archive` (not deployed).
