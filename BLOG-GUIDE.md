# Payoff blog + dashboard: how it works

- **Blog:** payoffcreative.com/blog/
- **Your dashboard (only you can log in):** payoffcreative.com/admin/
- **Ad link + QR builder:** payoffcreative.com/admin/links.html

When you press **Publish** in the dashboard, it saves the post to GitHub (`creatorosbynik/payoff-website`). Netlify sees the change and rebuilds the site, and the post goes live about a minute later. Nothing on your homepage changes.

---

## One-time setup (about 10 minutes)

### 1. Push these files to GitHub
In this `site` folder (GitHub Desktop or a terminal):

```
git add -A
git commit -m "Add blog + dashboard"
git push
```

Netlify now runs `npm run build` and publishes the `_site` folder (this is set in `netlify.toml`, so you don't need to change anything in Netlify). Check the next deploy in Netlify → Deploys; it should say **Published**.

### 2. Let the dashboard log you in with GitHub
**a) Create a GitHub "OAuth app"**
1. github.com → your photo → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**.
2. Application name: `Payoff Dashboard`
3. Homepage URL: `https://payoffcreative.com`
4. Authorization callback URL: `https://api.netlify.com/auth/done`
5. Click **Register application**. Copy the **Client ID**, then click **Generate a new client secret** and copy that too.

**b) Give the keys to Netlify**
1. Netlify → your Payoff site → **Site configuration** → **Access & security** → **OAuth**.
2. Under **Authentication providers**, click **Install provider** → **GitHub** → paste the Client ID and the secret → **Install**.

**c) Log in**
Go to payoffcreative.com/admin/ → **Login with GitHub**. Only GitHub accounts that can edit the `payoff-website` repo get in, which means only you.

### 3. Add "Blog" to the homepage menu
Your homepage files were being edited when the blog was built, so they weren't touched. When you're ready, open `index.html` and add the link in two places.

In the top menu (`<nav class="links" aria-label="Main">`), after the FAQ link:
```html
<a href="/blog/">Blog</a>
```
In the phone menu (`<nav aria-label="Mobile">`), after the FAQ link:
```html
<a href="/blog/"><span class="mono">08</span>Blog</a>
```

### 4. Tell Google
Google Search Console → Sitemaps → submit `https://payoffcreative.com/sitemap.xml`. The sitemap now updates itself every time you publish.

---

## Writing a post

1. Dashboard → **Blog posts** → **New Post**.
2. Fill in **Headline**, **Short summary**, **Category** and **Cover photo**. The preview on the right shows exactly how the post will look.
3. Write the post. Use **Heading 2** for each main section. The table of contents builds itself once you have 3 or more.
4. Click **+** in the toolbar to add:
   - **Photo**: upload, describe it, add a caption, and choose Normal, Wide or Full width. Photos are resized and compressed automatically, so upload the best quality you have.
   - **Video**: paste a YouTube, YouTube Shorts or Vimeo link, or upload a short MP4 (under 20 MB). Choose *Vertical* for reels and Shorts. Videos only load when someone presses play, so pages stay fast.
   - **Note box**: a highlighted "Quick takeaway" or tip.
   - **Button**: a call-to-action button anywhere in the post.
5. Set **Status**, then press **Publish** (top left).

### Status decides who sees the post
| Status | On the website? | On the blog page + Google? |
|---|---|---|
| **Draft** | No | No |
| **Published** | Yes | Yes |
| **Hidden link for ads** | Yes, if you have the link | No, it's hidden from the blog, the sitemap and Google |

**The Publish button just means Save.** A post set to *Draft* stays off the website even after you press Publish.

### Posts for ads
- Set Status to **Hidden link for ads** and turn on **Ad landing mode**. The menu and "Keep reading" links disappear, so visitors only see the story and the offer.
- Change **Call to action at the end** to whatever this ad sells. Leave it empty to use the free teardown.
- Every post also shows a sticky button on phones and a WhatsApp link that tells you which post the lead read.

### SEO checklist for every post (Google does the rest)
- [ ] One main keyword (write it in *Google settings → Main keyword* so you remember it).
- [ ] Keyword in the headline, the summary, the first paragraph and one Heading 2.
- [ ] Summary is 120–160 characters and makes someone want to click.
- [ ] Cover photo has a description.
- [ ] 2–5 **Quick answers** (FAQ) using questions people really type into Google.
- [ ] Link to 1–2 of your other posts or to /#work.

These are already handled for you: page titles, share previews for WhatsApp/LinkedIn/X, Google article + FAQ + breadcrumb data, the sitemap, the RSS feed, fast responsive images, canonical links, and "noindex" for hidden and draft pages.

---

## Links for ads, bios and QR codes

**Quick link or QR code:** open **payoffcreative.com/admin/links.html** → pick the page → pick where it will be placed (Meta ad, IG bio, WhatsApp, QR/print…) → name the campaign and creative → copy the link or download the QR code.

- **Meta Ads:** put the plain page link in *Website URL*, then copy **URL parameters** into Ads Manager → Tracking → *URL parameters*. Tick "let Meta fill names automatically" and every ad gets tagged with its own campaign and ad name.

**Short link (payoffcreative.com/go/…):** Dashboard → **Settings & ad links** → **Ad links** → add a code (e.g. `diwali`), pick the post, the source and the campaign → Publish. About a minute later, `payoffcreative.com/go/diwali` works. It's easy to say out loud, fits on a poster and looks clean in a bio.

The tags (`utm_source`, `utm_campaign`…) show up in Google Analytics once GA4 is connected. That's still an open item on the site.

---

## Settings you can change without code
Dashboard → **Settings & ad links** → **Blog settings**: blog name, heading, intro, categories, author bio and photo, the default call to action, and the sticky button words.

## Preview on your computer (optional)
```
npm install
npm start
```
Then open http://localhost:8080/blog/. Drafts don't show here either, so set a post to Published to see it.

## Where things live
- Posts: `blog/posts/*.md` · Uploaded photos/videos: `blog/uploads/`
- Blog design: `blog/assets/blog.css` · Page templates: `_blog/layouts/`, `_blog/includes/`
- Blog settings: `_blog/data/settings.json` · Short links: `_blog/data/shortlinks.json`
- Dashboard setup: `admin/config.yml`
- Build: `eleventy.config.mjs` copies every homepage file and folder unchanged into `_site/` and builds the blog around it. New files and folders you add for the homepage are picked up automatically.
