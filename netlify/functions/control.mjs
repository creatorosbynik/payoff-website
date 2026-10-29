// Payoff Control — private API for the /control/ app.
// Every request must carry a Netlify Identity login (same login as /admin). Tokens live in
// Netlify environment variables and never reach the browser:
//   NOTION_TOKEN    Notion internal integration secret (PAYOFF page shared with the integration)
//   GITHUB_TOKEN    fine-grained token: creatorosbynik/payoff-website · Contents + Pull requests: read & write
//   CONTROL_ALLOWED_EMAILS (optional) comma-separated logins allowed in; default = Identity role "editor"/"admin"
//
// Routes (all under /api/control/):
//   GET  me                      who is logged in + which tokens are configured
//   GET  stories                 open story PRs with preview, reel, captions, lead hook
//   POST stories/:pr/approve     merge the PR (= post goes live) + mark the Blog Queue row Published
//   POST stories/:pr/changes     leave a "changes wanted" comment on the PR
//   GET  calendar                Blog Queue rows (scheduled + unscheduled ideas)
//   PATCH calendar/:id           edit title / keyword / publish date / status / notes / pillar
//   GET  leads                   open Signal Board leads, tier then fit score
//   GET  leads/:id               one lead + its dossier / drafts (page text)
//   PATCH leads/:id              update status, next action, mark contacted
//   GET  runs                    latest Automation Runs

const REPO = "creatorosbynik/payoff-website";
const DB = {
  calendar: "2a7574da66cf45c9a5d4b72ccc774606", // Blog Queue
  leads: "f2bd63d521604896aefa5508697c346d", // Signal Board
  runs: "13fa28a07287457b8071848d85e24c4f", // Automation Runs
};
const SITE = "https://payoffcreative.com";
const PREVIEW = (pr, slug) => `https://deploy-preview-${pr}--payoffcreative.netlify.app/blog/${slug}/`;
const IST = "Asia/Kolkata";

/* ---------------- helpers ---------------- */

const json = (statusCode, body) => ({
  statusCode,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  body: JSON.stringify(body),
});

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const todayIST = () => new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(new Date());

async function notion(path, { method = "GET", body } = {}) {
  if (!process.env.NOTION_TOKEN) throw new HttpError(503, "NOTION_TOKEN is not set in Netlify environment variables.");
  const res = await fetch(`https://api.notion.com/v1/${path}`, {
    method,
    headers: {
      authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      "notion-version": "2022-06-28",
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const hint = res.status === 404 ? " (share the PAYOFF page with your Notion integration)" : "";
    throw new HttpError(res.status === 404 ? 502 : res.status, `Notion: ${data.message || res.statusText}${hint}`);
  }
  return data;
}

async function github(path, { method = "GET", body, raw = false } = {}) {
  if (!process.env.GITHUB_TOKEN) throw new HttpError(503, "GITHUB_TOKEN is not set in Netlify environment variables.");
  const res = await fetch(`https://api.github.com/${path}`, {
    method,
    headers: {
      authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      accept: raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "payoff-control",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (raw) {
    if (!res.ok) return null;
    return res.text();
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(res.status === 404 ? 502 : res.status, `GitHub: ${data.message || res.statusText}`);
  return data;
}

async function queryAll(db, body) {
  const rows = [];
  let cursor;
  for (let i = 0; i < 5; i++) {
    const data = await notion(`databases/${db}/query`, { method: "POST", body: { page_size: 100, ...body, ...(cursor ? { start_cursor: cursor } : {}) } });
    rows.push(...data.results);
    if (!data.has_more) break;
    cursor = data.next_cursor;
  }
  return rows;
}

// Read any Notion property as a plain value
function val(p) {
  if (!p) return null;
  switch (p.type) {
    case "title": return p.title.map((t) => t.plain_text).join("");
    case "rich_text": return p.rich_text.map((t) => t.plain_text).join("");
    case "select": return p.select?.name ?? null;
    case "status": return p.status?.name ?? null;
    case "multi_select": return p.multi_select.map((o) => o.name);
    case "date": return p.date?.start ?? null;
    case "number": return p.number;
    case "url": return p.url;
    case "email": return p.email;
    case "checkbox": return p.checkbox;
    case "created_time": return p.created_time;
    default: return null;
  }
}
const props = (page) => Object.fromEntries(Object.entries(page.properties).map(([k, v]) => [k, val(v)]));

const text = (s) => ({ rich_text: s ? [{ type: "text", text: { content: String(s).slice(0, 2000) } }] : [] });
const title = (s) => ({ title: [{ type: "text", text: { content: String(s).slice(0, 2000) } }] });
const select = (s) => ({ select: s ? { name: s } : null });
const date = (s) => ({ date: s ? { start: s } : null });

// Plain-text body of a page (dossier, drafts) + any uploaded files (the reel)
async function pageBody(id, limit = 200) {
  const data = await notion(`blocks/${id}/children?page_size=${limit}`);
  const lines = [];
  const files = [];
  for (const b of data.results) {
    const t = b.type;
    const rt = b[t]?.rich_text;
    const plain = rt ? rt.map((r) => r.plain_text).join("") : "";
    if (["file", "video", "image"].includes(t)) {
      const f = b[t];
      const url = f?.file?.url || f?.external?.url;
      const name = f?.name || (url ? decodeURIComponent(url.split("?")[0].split("/").pop()) : t);
      if (url) files.push({ type: t, name, url });
      continue;
    }
    if (!plain && t !== "divider") continue;
    const prefix = t.startsWith("heading") ? "## " : t === "bulleted_list_item" ? "• " : t === "numbered_list_item" ? "– " : t === "to_do" ? (b.to_do.checked ? "☑ " : "☐ ") : t === "quote" ? "> " : "";
    lines.push(t === "divider" ? "—" : prefix + plain);
  }
  return { text: lines.join("\n"), files };
}

/* ---------------- auth ---------------- */

function authorise(context) {
  const user = context.clientContext?.user;
  if (!user) throw new HttpError(401, "Log in to use Payoff Control.");
  const allowed = (process.env.CONTROL_ALLOWED_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const roles = user.app_metadata?.roles || [];
  if (allowed.length ? !allowed.includes(String(user.email).toLowerCase()) : !roles.some((r) => ["editor", "admin"].includes(r))) {
    throw new HttpError(403, "This login isn't allowed into Payoff Control.");
  }
  return user;
}

/* ---------------- stories ---------------- */

async function findCalendarRow(slug) {
  if (!slug) return null;
  const rows = await notion(`databases/${DB.calendar}/query`, {
    method: "POST",
    body: { filter: { property: "Slug", rich_text: { equals: slug } }, page_size: 1 },
  });
  return rows.results[0] || null;
}

async function listStories() {
  const prs = await github(`repos/${REPO}/pulls?state=open&per_page=30`);
  const stories = prs.filter((p) => p.head.ref.startsWith("story/"));
  return Promise.all(
    stories.map(async (p) => {
      const id = p.head.ref.slice("story/".length);
      const raw = await github(`repos/${REPO}/contents/automation/daily-story/days/${id}/story.json?ref=${encodeURIComponent(p.head.ref)}`, { raw: true });
      let story = {};
      try { story = raw ? JSON.parse(raw) : {}; } catch { story = {}; }
      let reel = null;
      let notionUrl = story.notion_page || null;
      try {
        const row = await findCalendarRow(story.slug);
        if (row) {
          notionUrl = row.url;
          const body = await pageBody(row.id, 100);
          reel = body.files.find((f) => /\.mp4($|\?)/i.test(f.url) || f.type === "video") || null;
        }
      } catch { /* reel is optional */ }
      const failed = /❌ failed/.test(p.body || "");
      const warnings = ((p.body || "").split("Warnings to eyeball:")[1] || "").split("###")[0].split("\n").filter((l) => l.startsWith("- [")).map((l) => l.slice(2));
      return {
        pr: p.number,
        url: p.html_url,
        title: story.title || p.title,
        slug: story.slug,
        slate: story.slate,
        pillar: story.pillar,
        depth: story.depth,
        date: story.date,
        oneIdea: story.one_idea,
        keyword: story.keyword,
        preview: story.slug ? PREVIEW(p.number, story.slug) : null,
        reel,
        cover: story.graphics?.[0] ? `https://deploy-preview-${p.number}--payoffcreative.netlify.app/blog/uploads/${story.graphics[0].name}.webp` : null,
        igCaption: story.social?.ig_caption || "",
        linkedin: story.social?.linkedin_post || "",
        leadHook: story.lead_hook || "",
        video: story.video ? { hook: story.video.hook, move: story.video.move } : null,
        teardownCheck: story.pillar?.includes("Teardown") && !story.checks?.ad_signals_done,
        gateFailed: failed,
        warnings,
        opened: p.created_at,
        notion: notionUrl,
      };
    }),
  );
}

async function approveStory(pr) {
  const p = await github(`repos/${REPO}/pulls/${pr}`);
  if (!p.head.ref.startsWith("story/")) throw new HttpError(400, "Only story PRs can be approved here.");
  if (p.state !== "open") throw new HttpError(409, "This story is already closed.");
  const id = p.head.ref.slice("story/".length);
  const raw = await github(`repos/${REPO}/contents/automation/daily-story/days/${id}/story.json?ref=${encodeURIComponent(p.head.ref)}`, { raw: true });
  const story = raw ? JSON.parse(raw) : {};
  const merged = await github(`repos/${REPO}/pulls/${pr}/merge`, {
    method: "PUT",
    body: { merge_method: "squash", commit_title: `${p.title} (#${pr})`, commit_message: "Approved in Payoff Control." },
  });
  const live = story.slug ? `${SITE}/blog/${story.slug}/` : null;
  let notionUpdated = false;
  try {
    const row = await findCalendarRow(story.slug);
    if (row) {
      await notion(`pages/${row.id}`, {
        method: "PATCH",
        body: { properties: { Status: select("Published"), Published: date(todayIST()), "Live URL": { url: live }, Video: select("Approved") } },
      });
      notionUpdated = true;
    }
  } catch { /* the daily run's close-the-loop step will catch it */ }
  return { merged: merged.merged, sha: merged.sha, live, notionUpdated };
}

async function requestChanges(pr, note) {
  if (!note || note.trim().length < 3) throw new HttpError(400, "Write what should change.");
  await github(`repos/${REPO}/issues/${pr}/comments`, { method: "POST", body: { body: `**Changes wanted (from Payoff Control):**\n\n${note.trim()}` } });
  return { ok: true };
}

/* ---------------- calendar ---------------- */

const CAL_FIELDS = ["Title", "Status", "Publish date", "Pillar", "Category", "Depth", "Primary keyword", "Slug", "Slate", "Video", "Preview / PR", "Live URL", "Notes", "Priority", "Video hook", "Lead hook"];

async function listCalendar() {
  const rows = await queryAll(DB.calendar, { sorts: [{ property: "Publish date", direction: "ascending" }] });
  return rows.map((r) => {
    const p = props(r);
    return { id: r.id, url: r.url, ...Object.fromEntries(CAL_FIELDS.map((f) => [f, p[f] ?? null])) };
  });
}

async function editCalendar(id, b) {
  const properties = {};
  if ("title" in b) properties.Title = title(b.title);
  if ("keyword" in b) properties["Primary keyword"] = text(b.keyword);
  if ("notes" in b) properties.Notes = text(b.notes);
  if ("publishDate" in b) properties["Publish date"] = date(b.publishDate || null);
  if ("status" in b) properties.Status = select(b.status);
  if ("pillar" in b) properties.Pillar = select(b.pillar);
  if (!Object.keys(properties).length) throw new HttpError(400, "Nothing to change.");
  const page = await notion(`pages/${id}`, { method: "PATCH", body: { properties } });
  return { id: page.id, ...props(page) };
}

/* ---------------- leads ---------------- */

const LEAD_FIELDS = ["Signal", "Company", "Status", "Tier", "Fit score", "Signal type", "Need", "Source", "Route", "Contact", "Contact detail", "Role", "City", "Market", "Website", "Instagram", "Link", "Ad Library link", "Meta ads active", "What they want", "Story gap", "Pitch angle", "Next action", "Next action by", "Last contacted", "Touches", "Draft status", "Date added", "Posted", "Deadline", "Budget stated", "Lost reason"];
const CLOSED = ["Won", "Lost", "Dead"];
const TIER_ORDER = { "Tier 1 - act today": 0, "Tier 2 - this week": 1, "Tier 3 - watch": 2, Dead: 3 };

function leadOut(r) {
  const p = props(r);
  return { id: r.id, url: r.url, ...Object.fromEntries(LEAD_FIELDS.map((f) => [f, p[f] ?? null])) };
}

async function listLeads(all) {
  const filter = all ? undefined : { and: CLOSED.map((s) => ({ property: "Status", select: { does_not_equal: s } })) };
  const rows = await queryAll(DB.leads, { ...(filter ? { filter } : {}), sorts: [{ property: "Fit score", direction: "descending" }] });
  return rows.map(leadOut).sort((a, b) => (TIER_ORDER[a.Tier] ?? 9) - (TIER_ORDER[b.Tier] ?? 9) || (b["Fit score"] ?? 0) - (a["Fit score"] ?? 0));
}

async function getLead(id) {
  const page = await notion(`pages/${id}`);
  const body = await pageBody(id, 200);
  return { ...leadOut(page), body: body.text };
}

async function editLead(id, b) {
  const properties = {};
  if ("status" in b) properties.Status = select(b.status);
  if ("tier" in b) properties.Tier = select(b.tier);
  if ("draftStatus" in b) properties["Draft status"] = select(b.draftStatus);
  if ("nextAction" in b) properties["Next action"] = text(b.nextAction);
  if ("nextActionBy" in b) properties["Next action by"] = date(b.nextActionBy || null);
  if ("lostReason" in b) properties["Lost reason"] = select(b.lostReason);
  if (b.contacted) {
    const page = await notion(`pages/${id}`);
    const touches = val(page.properties.Touches) || 0;
    properties["Last contacted"] = date(todayIST());
    properties.Touches = { number: touches + 1 };
    if (!("status" in b) && ["New", "Researching"].includes(val(page.properties.Status))) properties.Status = select("Contacted");
    if (!("draftStatus" in b)) properties["Draft status"] = select("Sent");
  }
  if (!Object.keys(properties).length) throw new HttpError(400, "Nothing to change.");
  const page = await notion(`pages/${id}`, { method: "PATCH", body: { properties } });
  return leadOut(page);
}

/* ---------------- runs ---------------- */

async function listRuns() {
  const data = await notion(`databases/${DB.runs}/query`, { method: "POST", body: { page_size: 40, sorts: [{ property: "Started", direction: "descending" }] } });
  return data.results.map((r) => ({ id: r.id, url: r.url, ...props(r) }));
}

/* ---------------- router ---------------- */

export const handler = async (event, context) => {
  try {
    const user = authorise(context);
    const path = event.path.replace(/^.*\/(api\/control|\.netlify\/functions\/control)\/?/, "").replace(/\/$/, "");
    const [res, id, action] = path.split("/");
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, "base64").toString() : event.body) : {};
    if ((method === "POST" || method === "PATCH") && !/application\/json/.test(event.headers["content-type"] || "")) {
      throw new HttpError(415, "Send JSON.");
    }

    if (res === "me" && method === "GET") return json(200, { email: user.email, notion: !!process.env.NOTION_TOKEN, github: !!process.env.GITHUB_TOKEN, today: todayIST() });
    if (res === "stories" && !id && method === "GET") return json(200, await listStories());
    if (res === "stories" && /^\d+$/.test(id || "") && action === "approve" && method === "POST") return json(200, await approveStory(Number(id)));
    if (res === "stories" && /^\d+$/.test(id || "") && action === "changes" && method === "POST") return json(200, await requestChanges(Number(id), body.note));
    if (res === "calendar" && !id && method === "GET") return json(200, await listCalendar());
    if (res === "calendar" && id && method === "PATCH") return json(200, await editCalendar(id, body));
    if (res === "leads" && !id && method === "GET") return json(200, await listLeads(event.queryStringParameters?.all === "1"));
    if (res === "leads" && id && method === "GET") return json(200, await getLead(id));
    if (res === "leads" && id && method === "PATCH") return json(200, await editLead(id, body));
    if (res === "runs" && method === "GET") return json(200, await listRuns());
    throw new HttpError(404, "Unknown route.");
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    return json(status, { error: e instanceof HttpError ? e.message : "Something went wrong on the server." });
  }
};
