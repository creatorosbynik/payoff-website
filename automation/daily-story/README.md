# Payoff Daily Story Engine

One topic a day becomes **a blog post, a 30-second reel and the social copy**, all telling the same story. It runs on its own every morning and stops at one gate: **you**. Nothing goes live until you merge the preview.

This folder is tooling only. The site build ignores it (`eleventy.config.mjs`), so nothing here is ever published.

## Your part (5 minutes a day)

1. **Morning:** you get a notification with today's story, a preview link and the reel.
2. **Review:** open the preview (`deploy-preview-N--payoffcreative.netlify.app/blog/<slug>/`) and watch the reel (attached to the row in Notion → PAYOFF → Payoff Website → Blog Queue).
3. **Approve:** merge the pull request on GitHub. The post is live about a minute later.
4. **Post:** upload the reel to Instagram with the caption from the PR, and post the LinkedIn version.
5. **Optional:** Request indexing in Search Console.

To change something: comment on the PR, edit the post in `/admin` before merging, or ask Claude "fix story NNN: …".

**Sunday evening** the planner fills next week. Edit any row in the Blog Queue before its day and the engine writes what you changed.

## The week

| Day | Pillar | Depth | Job |
|---|---|---|---|
| Mon | Teardown | Deep post | A real brand taken apart; ends on what it does right. Run Ad Signals before merging |
| Tue | Story Rules | Field note | One storytelling rule on a D2C example |
| Wed | Ad Lab | Field note | One Meta-ads creative problem and the fix |
| Thu | Cost & Choice | Deep post | What things cost in India / X vs Y (highest buying intent) |
| Fri | Craft Cut | Field note | One shot, edit, light or sound decision from the set |
| Sat | Founder Notes | Field note | An honest lesson from running Payoff |
| Sun | Culture Watch | Field note | One platform change and what Indian brands should do |

Deep post = 1,200–2,200 words. Field note = 600–1,100 words. Both carry at least one first-hand element and one CTA: the free 60-second teardown.

## The reel format

Every reel uses the same shape, so people learn to recognise it:

- Opens on a numbered **Payoff slate** (the clapper snaps shut).
- Then the hook and 3–4 beats.
- Then **The move**.
- Closes with the logo and *"That's the payoff."*

Beats without an image become type-led frames: the key word, oversized, on film-strip black. When credits exist, AI images can replace them.

## What runs, in order (`SKILL.md` has the full detail)

```
PLAN (Sun)   Blog SEO Strategy + Blog Queue  →  7 rows for next week
DAILY        close yesterday's loop (merged PRs → Published, change log)
             pick today's row → brief (cmo-brain) → research + sources
             write post (payoff-blog-writer + vanr-content-engine)
             story.json: graphics + reel + caption + LinkedIn + lead hook
             render/make-assets.mjs   → blog graphics (webp) + reel.mp4
             scripts/check.mjs        → quality gate (blocks on FAIL)
             scripts/open-pr.mjs      → branch story/<date-slug> + PR + preview
             Notion row + reel upload + change log + notification
```

## Files

| Path | What |
|---|---|
| `engine.config.json` | Pillars, lengths, brand rules, Notion/GitHub IDs, schedule |
| `SKILL.md` | The run book Claude follows for PLAN and DAILY |
| `templates/` | `story.example.json` (one day's story) and `post.md` (front matter) |
| `render/` | Remotion project: `DailyStory` reel (1080×1920), `Cover` (1600×680) and `Card` (1600×900) graphics |
| `scripts/check.mjs` | Quality gate: A8 blocklist, brand rules, length, FAQs, links, sources, images, reel limits |
| `scripts/open-pr.mjs` | Commits the day's files to `story/<id>`, opens the PR (`--dry-run` to test) |
| `days/<date-slug>/` | One folder per day. `story.json` is committed; the reel and media are not |

## Run it by hand

```bash
npm ci                                   # repo root
cd automation/daily-story/render && npm install
node make-assets.mjs ../days/<id>        # graphics + reel
cd ../../.. && node automation/daily-story/scripts/check.mjs automation/daily-story/days/<id>
node automation/daily-story/scripts/open-pr.mjs automation/daily-story/days/<id>
```

On your PC (`H:\Payoff`), the same commands work in a clone of the repo. Remotion downloads its own Chrome the first time. Use `npx remotion studio src/index.ts` in `render/` to preview the templates live.

## Rules the gate enforces

- **Fails (blocks the PR):** an A8 blocklist word, "film studio" / TNP / BMW, a post outside its length band, too few FAQs or links, missing or hotlinked images, glued tags, reel lines over their word limits, no caption, no lead hook.
- **Warns (listed in the PR for you):** an unsourced number, keyword placement, summary length, a teardown waiting on its Ad Signals pass.
