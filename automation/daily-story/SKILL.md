---
name: payoff-daily-story
description: Run Payoff's daily story engine — one topic a day becomes a blog post, a 30-second reel and social copy, opened as a preview PR for Nikunj to approve; plus the weekly topic planner. Use for "daily story run", "plan next week's topics", "story engine", "aaj ka blog/reel", and every scheduled Payoff content run.
---

# Payoff Daily Story Engine

One topic a day. The same story told three ways: a blog post that ranks, a reel that stops the scroll, and a caption/DM line that opens conversations. Nothing goes live without Nikunj merging the preview.

Engine files live in the website repo: `creatorosbynik/payoff-website` → `automation/daily-story/`.
Config (pillars, lengths, brand rules, Notion IDs): `engine.config.json`. Read it first, every run.

## Two modes

| Mode | When | What it does |
|---|---|---|
| **PLAN** | Sunday evening (scheduled) or "plan next week" | Fills next Monday→Sunday in the calendar (Notion Blog Queue) |
| **DAILY** | Every morning (scheduled) or "run today's story" | Closes yesterday's loop, writes today's story, renders the reel, opens the preview PR, notifies |

Running unattended: never stop to ask. Take the most reasonable reading, write it in the PR and the Notion row, carry on.

## Skills this engine calls (route, don't freelance)
- `cmo-brain` — HOUSE mode. Sharp Question per story; weekly plan logic.
- `payoff-blog-writer` + `vanr-content-engine` (A, B, D; E as a second pass; G last) — the post.
- `vanr-content-engine` (A, B, F) — reel lines, IG caption, LinkedIn post.
- `creative-strategist` — hook options (write 5–10, pick 1).
- `payoff-frameworks` — Monday teardowns only.
- `payoff-visual-bible` / `editorial-ad-director` — only when AI images are used.

## Non-negotiables
- Payoff is a **story-led creative agency**. Never "film studio". Never mention TNP / The Nikunj Productions. BMW only as "bike videos".
- **No invented facts.** No made-up clients, results, testimonials or numbers. Every stat links to its original source (search and verify). If you can't source it, cut it.
- **First-hand element in every post** — something only Payoff could say: craft knowledge from 8+ years on set and in the edit, Payoff's method (story first, camera second, spend third), an honest founder lesson. Never fake a specific client story.
- Official logo only (`logo-cream.png` / `logo-white.png` / `logo-red.jpg`). The card and reel templates already use it — don't add others.
- Brand colours only: red #D52204, cream #FFD9A1, ink #241A15, white. Red text on cream = headlines only.
- One idea, one CTA (the free 60-second teardown, `/#teardown`) per post.
- Teardowns (Monday): brands with real budget only, end on what they do right but bury, mark `checks.ad_signals_done: false` so the PR tells Nikunj to run his Ad Signals pass before merging.
- Every website change is logged on the Notion **Payoff Website** page (dated Change log entry + What's left).

---

## MODE: PLAN (weekly)

1. Read `engine.config.json` → pillars by weekday, depth rules.
2. Read the Notion **Blog SEO Strategy** page (clusters, keyword map, tag rules) and query the **Blog Queue** (all rows: titles, keywords, slugs, status, Slate). Note every keyword already used — never target one twice.
3. Fill each of the 7 days (next Monday → Sunday). Per slot, run the solo Room fast: 3 candidate topics → pick 1 by (a) buyer intent for D2C founders in India, (b) a Category Entry Point it owns, (c) keyword gap, (d) a first-hand angle exists.
   - Thu · Cost & Choice and Mon · Teardown are **Deep posts**; others are **Field notes**.
   - Pull queued Ideas from the existing queue first (Priority order) when they fit the day's pillar.
   - Sun · Culture Watch: search the week's platform news (Meta, Instagram, YouTube, ASCI). Primary source required.
   - Mon · Teardown: one real D2C brand with visible ad spend. Not the same category two weeks running.
4. Create/update rows: Title, Primary keyword, Slug, Pillar, Category, Depth, Publish date, Status **Queued**, Priority (1 = Monday … 7 = Sunday), Slate (continue from the highest Slate + 1), Video **Not started**, Notes = "One idea: … · CEP: … · First-hand angle: …".
5. Notify Nikunj: the 7 titles with their one idea, one line each. He can edit any row before its day.

---

## MODE: DAILY

### 0. Set up (2 min)
- Repo at `/home/claude/payoff-website` (attach `creatorosbynik/payoff-website` with push access and clone `--depth 1` if missing). `git fetch origin main && git switch main && git pull`.
- If `automation/daily-story/` isn't on main yet (engine PR not merged), bring the engine files in untracked: `git fetch origin engine/daily-story-v1 --depth=1 && git checkout FETCH_HEAD -- automation/daily-story eleventy.config.mjs && git reset -q`. open-pr.mjs only commits the day's own files, so this is safe.
- `npm ci` in the repo root; `npm ci` (or `npm install`) in `automation/daily-story/render`.
- Today = Asia/Kolkata date.

### 1. Close the loop on earlier stories
- `gh api repos/creatorosbynik/payoff-website/pulls?state=closed&per_page=20` → for each `story/*` PR merged since the last run: Notion row → Status **Published**, Published = merge date, Live URL = `https://payoffcreative.com/blog/<slug>/`, Video **Approved**. Add a dated **Change log** entry on Payoff Website ("Story NNN published: <title>, PR #n") and a What's left item "Request indexing: <url>" + "Post reel NNN".
- Count open `story/*` PRs. If **5 or more** are waiting, don't write a new one: notify Nikunj that the review queue is full and list them. (Quality over volume.)

### 2. Pick today's story
- Blog Queue row with Publish date = today. Else the Queued row with the lowest Priority. Else run PLAN for today's slot only.
- Set the row Status **Writing**.

### 3. Brief (cmo-brain, HOUSE)
Write into `story.json`: `topic`, `one_idea` (one sentence), `reader`, `cep`, `firsthand`, `keyword`, `fanout` (3–8). Sharp Question: "How do we get [this founder] to [think/do X] instead of [Y], given [constraint]?" If it isn't sharp, fix it before writing.

### 4. Research
Search the keyword and fan-out queries. Read what ranks; match the intent and format. Collect 2+ real sources for a Deep post, 1+ for a Field note. Verify every number on its original page. Record them in `story.sources`.

### 5. Write the post
- Day folder: `automation/daily-story/days/<YYYY-MM-DD>-<slug>/` (copy `templates/story.example.json` → `story.json`, fill every field).
- Post: `blog/posts/<slug>.md` from `templates/post.md`. **status: published** (the PR is the gate; merge = live). Length/FAQs/links per `engine.config.json` → `depth`.
- payoff-blog-writer workflow (answer-first sections, short paragraphs, sourced stats, Ogilvy check). Link 2–3 published posts (only ones that exist in `blog/posts` with status published) + `/#teardown`.

### 6. Graphics (no credits needed)
Add 2–5 entries to `story.graphics` — always one `Cover` (`type: cover`), then `Card`s: `stat` (a sourced number), `list` (steps/checklist), `versus` (X vs Y), `quote` (the one line). Reference them in the post as `/blog/uploads/<name>.webp` with real alt text. Vary `tone` (red / ink / cream).
AI images are an optional upgrade: only if Payoff Studio (MuAPI) balance > $1 or Artlist credits > 2,000. Never spend the last credits. If an AI image can't be downloaded into the day folder, drop it and keep the designed card.

### 7. The reel (same story, 30 seconds)
`story.video`: hook (≤ 9 words, one `*highlight*`), 3–4 beats (≤ 18 words each, one `*highlight*` each, kicker "01 · The symptom" style), the move (≤ 14 words), CTA ("Comment STORY …" or "Full breakdown → payoffcreative.com/blog"). Write for the ear and the thumb: problem the reader recognises → the real cause → the move.
Beats without an image render as type-led frames (the highlighted word, oversized) — that's the house style, not a fallback to apologise for.
Music (optional): Artlist `search_music` instrumental 90–120 BPM, `download_track` only if the file can be saved into the day folder as `music.mp3`; set `video.music: "day/music.mp3"`.

### 8. Social + lead
`social.ig_caption` (hook line, 3–5 short lines, "Comment STORY…", "full post on the blog"), `social.linkedin_post` (founder voice, 120–220 words, no hashtag pile), `lead_hook` (one-line DM/email opener a prospect would answer — no pitch).

### 9. Build, gate, open the preview
```
cd automation/daily-story/render && node make-assets.mjs ../days/<id>
cd ../../.. && node automation/daily-story/scripts/check.mjs automation/daily-story/days/<id>
```
Fix every FAIL and re-run (max 3 loops). Re-read the warnings and fix the cheap ones. Then:
```
node automation/daily-story/scripts/open-pr.mjs automation/daily-story/days/<id>
```
It prints `{pr, url, preview}`.

### 10. Hand it over
- Upload `reel.mp4` (max 20 MB) and `reel-cover.jpg` to the Notion row: call Notion `create-file-upload` with the filename, then from the shell `curl -X POST <upload_url> -H "authorization: <header>" -F "file=@reel.mp4"`, then add `<file source="file-upload://<id>" />` to the row page with `update-page` (insert_content). Also send the reel in the run's chat (SendUserFile).
- Notion row: Status **Ready to paste** (= in review), Video **Rendered**, Preview / PR = PR url, Slate, Video hook, Lead hook, Notes += "Gate: N warnings".
- Payoff Website page: dated Change log entry "Story NNN preview opened: <title> — PR #n (not live until merged)" and What's left "Review + merge PR #n".
- Notify (SendUserMessage): title, one idea, PR link, preview link, reel attached, warnings worth a look. Three lines, no essay.

## Failure handling
- A tool or credit is unavailable → use the free path (designed cards, type-led beats, no music) and say so in the PR.
- Gate still failing after 3 loops → open the PR with `--allow-fail`, title it "NEEDS FIX", list the fails at the top, notify.
- GitHub push/PR fails → save the post + story.json to the Notion row page as text so nothing is lost, notify.
