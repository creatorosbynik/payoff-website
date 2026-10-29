// Payoff Daily Story Engine — opens the day's review PR.
// Usage: node automation/daily-story/scripts/open-pr.mjs <day-folder> [--dry-run] [--allow-fail]
// Commits the post, its graphics and story.json on branch story/<day-id>, pushes, and opens a PR
// against main. Netlify builds a deploy preview; merging the PR = the post goes live.
// Prints JSON: { pr, url, preview }.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const engine = path.resolve(here, "..");
const repo = path.resolve(engine, "../..");
const cfg = JSON.parse(fs.readFileSync(path.join(engine, "engine.config.json"), "utf8"));
const dayDir = path.resolve(process.argv[2] || "");
const story = JSON.parse(fs.readFileSync(path.join(dayDir, "story.json"), "utf8"));
const id = path.basename(dayDir);
const branch = `${cfg.github.branch_prefix}${id}`;
const git = (...a) => execFileSync("git", ["-C", repo, ...a], { encoding: "utf8" }).trim();
const gh = (...a) => execFileSync("gh", a, { encoding: "utf8" }).trim();

// Quality gate report (re-run so the PR shows the final state)
let gate = { ok: false, fails: [], warns: [] };
try {
  gate = JSON.parse(execFileSync("node", [path.join(here, "check.mjs"), dayDir, "--json"], { encoding: "utf8" }));
} catch (e) {
  gate = JSON.parse(e.stdout || "{}");
}
if (!gate.ok && !process.argv.includes("--allow-fail")) {
  console.error("Quality gate failed — fix before opening the PR:\n" + gate.fails.map((f) => `- [${f.area}] ${f.msg}`).join("\n"));
  process.exit(1);
}

// Files that belong to this story
const files = [
  story.post.file,
  ...(story.graphics || []).map((g) => `blog/uploads/${g.name}.webp`),
  ...(story.extra_files || []),
  path.relative(repo, path.join(dayDir, "story.json")),
].filter((f) => fs.existsSync(path.join(repo, f)));

const dry = process.argv.includes("--dry-run");
if (dry) {
  console.log(JSON.stringify({ dryRun: true, branch, files, gate: { ok: gate.ok, fails: gate.fails.length, warns: gate.warns.length } }, null, 2));
  process.exit(0);
}
git("fetch", "origin", cfg.github.base_branch, "--depth=1");
const current = git("rev-parse", "--abbrev-ref", "HEAD");
if (current !== branch) {
  // Story branches always start from main, so a story PR only ever carries that day's files.
  try { git("switch", "-c", branch, `origin/${cfg.github.base_branch}`); } catch { git("switch", branch); }
}
git("add", ...files);
const msg = `Story ${String(story.slate).padStart(3, "0")}: ${story.title}\n\n${story.pillar} · ${story.depth} · keyword "${story.keyword}"\nDaily story engine run ${story.date}.`;
try { git("commit", "-m", msg); } catch (e) { if (!/nothing to commit/.test(String(e.stdout))) throw e; }
git("push", "-u", "origin", branch);

const s = story.social || {};
const list = (arr) => (arr || []).map((x) => `- [${x.area}] ${x.msg}`).join("\n") || "- none";
const body = `## Slate ${String(story.slate).padStart(3, "0")} · ${story.pillar}

**${story.title}**
One idea: ${story.one_idea}

| | |
|---|---|
| Keyword | ${story.keyword} |
| Depth | ${story.depth} |
| Category | ${story.category} |
| Publish date | ${story.date} |
| Notion | ${story.notion_page || "—"} |

### How to approve
1. Open the Netlify deploy preview (link appears below in a minute) → \`/blog/${story.slug}/\`.
2. Watch the reel (attached to the Notion row).
3. Happy? **Merge** this PR. The post goes live about a minute later.
4. Post the reel with the caption below, then Request indexing in Search Console.
Want changes? Comment here or edit the post in /admin before merging.

### Quality gate: ${gate.ok ? "✅ passed" : "❌ failed"}
Warnings to eyeball:
${list(gate.warns)}

### Reel caption (Instagram)
\`\`\`
${s.ig_caption || ""}
\`\`\`

### LinkedIn
\`\`\`
${s.linkedin_post || ""}
\`\`\`

### Lead hook (for Signal Board outreach)
> ${story.lead_hook || ""}

### Sources
${(story.sources || []).map((x) => `- [${x.title}](${x.url})`).join("\n") || "- none"}

🤖 Generated with [Claude Code](https://claude.com/claude-code)
`;

let pr;
const existing = JSON.parse(gh("api", `repos/${cfg.github.repo}/pulls?head=${cfg.github.repo.split("/")[0]}:${branch}&state=open`));
if (existing.length) {
  pr = existing[0];
  gh("api", "-X", "PATCH", `repos/${cfg.github.repo}/pulls/${pr.number}`, "-f", `body=${body}`);
} else {
  pr = JSON.parse(gh("api", "-X", "POST", `repos/${cfg.github.repo}/pulls`,
    "-f", `title=Story ${String(story.slate).padStart(3, "0")} · ${story.title}`,
    "-f", `head=${branch}`, "-f", `base=${cfg.github.base_branch}`, "-f", `body=${body}`));
}
const preview = cfg.github.preview_url.replace("{pr}", pr.number).replace("{slug}", story.slug);
console.log(JSON.stringify({ pr: pr.number, url: pr.html_url, preview }));
