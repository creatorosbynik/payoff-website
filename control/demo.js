// Demo data for previews (?demo on localhost / deploy previews only). Fictional brands, nothing saved.
const iso = (n) => {
  const d = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()) + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const stories = [
  {
    pr: 14, url: "#", title: "Your Meta Ads Aren't Tired. Your Story Is.", slug: "meta-ads-tired-story", slate: 3, pillar: "Wed · Ad Lab", depth: "Field note", date: iso(0),
    oneIdea: "Swapping creators without one fixed story line resets learning instead of refreshing it.", keyword: "ad creative fatigue",
    preview: "#", reel: null, cover: null,
    igCaption: "Your ads aren't tired. Your story is.\n\nNew creator every week. Same product. CTR still sliding.\n\nComment STORY and I'll send the one-line brief we use.",
    linkedin: "Most D2C brands fight ad fatigue by buying more faces…", leadHook: "Saw six new creator ads from you this month. Quick thought on why CTR keeps sliding.",
    video: { hook: "Your ads aren't *tired.* Your story is.", move: "One story. Many *faces.*" }, teardownCheck: false, gateFailed: false,
    warnings: ["[SEO] Summary is 104 chars (aim 120–160)"], opened: iso(0), notion: "#",
  },
];

const calendar = [
  ["Your Meta Ads Aren't Tired. Your Story Is.", 0, "Wed · Ad Lab", "Ready to paste", "ad creative fatigue", 3],
  ["UGC video cost in India (2026): rates, usage rights and hidden fees", 1, "Thu · Cost & Choice", "Queued", "UGC video cost India", 4],
  ["The one light I set before every product shot", 2, "Fri · Craft Cut", "Queued", "product video lighting", 5],
  ["What a free teardown taught me about my own pitch", 3, "Sat · Founder Notes", "Queued", "agency pitch lessons", 6],
  ["Instagram's new long-form test: what Indian D2C should do", 4, "Sun · Culture Watch", "Queued", "Instagram long videos India", 7],
  ["Teardown: a skincare brand burying its best line", 5, "Mon · Teardown", "Queued", "skincare brand story", 8],
  ["Why your D2C ads look good but don't sell", -1, "Tue · Story Rules", "Published", "D2C ads not converting", 2],
  ["How to write a creative brief for a D2C ad", null, null, "Idea", "creative brief template for ads", null],
].map(([Title, d, Pillar, Status, kw, Slate], i) => ({
  id: "cal" + i, url: "#", Title, "Publish date": d === null ? null : iso(d), Pillar, Status, "Primary keyword": kw, Slate,
  Notes: "One idea: … · CEP: … · First-hand angle: …", Category: null, Depth: null, Video: null,
}));

const leads = [
  { id: "l1", Company: "Haldi & Co. (demo)", Signal: "Haldi & Co. - hiring a content lead for weekly reels", Tier: "Tier 1 - act today", "Fit score": 9, Status: "New", "Signal type": "Hiring", Source: "LinkedIn", Route: "Email", Contact: "Founder", City: "Gurugram", Market: "India", Need: ["Performance ads / Reels"], "Next action": "Send the teardown opener", "Next action by": iso(0), Touches: 0, "What they want": "Weekly reels that sell the turmeric story, not discounts.", "Story gap": "Grandmother recipe buried on the About page.", "Pitch angle": "Your best ad is a 1987 kitchen photo you're not using." },
  { id: "l2", Company: "Kettle Theory (demo)", Signal: "Kettle Theory - launching a cold-brew line", Tier: "Tier 1 - act today", "Fit score": 8, Status: "Contacted", "Signal type": "Launch", Source: "News / funding", Route: "LinkedIn DM", Contact: "Head of Marketing", City: "Bengaluru", Market: "India", Need: ["Brand film"], "Next action": "Follow up with the 3-shot idea", "Next action by": iso(-1), Touches: 1 },
  { id: "l3", Company: "Loomline (demo)", Signal: "Loomline - weak ads, 40 live, one angle", Tier: "Tier 2 - this week", "Fit score": 7, Status: "Researching", "Signal type": "Weak ads", Source: "Other", Route: "Email", City: "Jaipur", Market: "India", Need: ["UGC"], "Next action": "Ad Signals pass", "Next action by": iso(2), Touches: 0 },
  { id: "l4", Company: "Northpaw (demo)", Signal: "Northpaw - founder asking for a video partner", Tier: "Tier 2 - this week", "Fit score": 6, Status: "Replied", "Signal type": "Direct ask", Source: "LinkedIn", Route: "Email", City: "Noida", Market: "India", Need: ["Performance ads / Reels"], "Next action": "Book a call", "Next action by": iso(1), Touches: 2 },
].map((l) => ({ url: "#", ...l }));

const runs = [
  { id: "r1", Run: `Daily story ${iso(0)}`, Task: "Daily story", Status: "Succeeded", Started: iso(0) + "T06:41:00+05:30", Summary: "Story 003 · PR #14 opened · 2 warnings", Link: "#" },
  { id: "r2", Run: "First plan", Task: "Weekly plan", Status: "Succeeded", Started: iso(-1) + "T21:00:00+05:30", Summary: "10 days planned" },
  { id: "r3", Run: `Daily story ${iso(-1)}`, Task: "Daily story", Status: "Needs attention", Started: iso(-1) + "T06:41:00+05:30", Summary: "Gate warning: unsourced number" },
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function handle(path, method, body) {
  await wait(180);
  const [res, id, action] = path.split("?")[0].split("/");
  if (res === "stories" && !id) return structuredClone(stories);
  if (res === "stories" && action === "approve") { stories.splice(stories.findIndex((s) => s.pr === Number(id)), 1); return { merged: true, live: "#" }; }
  if (res === "stories" && action === "changes") return { ok: true };
  if (res === "calendar" && !id) return structuredClone(calendar);
  if (res === "calendar" && method === "PATCH") {
    const r = calendar.find((x) => x.id === id);
    if (body.title !== undefined) r.Title = body.title;
    if (body.keyword !== undefined) r["Primary keyword"] = body.keyword;
    if (body.publishDate !== undefined) r["Publish date"] = body.publishDate || null;
    if (body.status !== undefined) r.Status = body.status;
    if (body.pillar !== undefined) r.Pillar = body.pillar;
    if (body.notes !== undefined) r.Notes = body.notes;
    return r;
  }
  if (res === "leads" && !id) return structuredClone(leads);
  if (res === "leads" && method === "GET") {
    const l = leads.find((x) => x.id === id);
    return { ...l, body: "## Dossier\nFounder-led, 40 live Meta ads, all discount-led.\n\n## Draft — email\nSubject: the photo you're not using\n\nHi — your About page has a 1987 kitchen photo that tells your whole story in one frame…" };
  }
  if (res === "leads" && method === "PATCH") {
    const l = leads.find((x) => x.id === id);
    if (body.status) l.Status = body.status;
    if (body.contacted) { l.Touches = (l.Touches || 0) + 1; l["Last contacted"] = iso(0); if (["New", "Researching"].includes(l.Status)) l.Status = "Contacted"; }
    if (body.nextAction !== undefined) l["Next action"] = body.nextAction;
    if (body.nextActionBy !== undefined) l["Next action by"] = body.nextActionBy;
    return l;
  }
  if (res === "runs") return structuredClone(runs);
  if (res === "me") return { email: "demo@payoffcreative.com", notion: true, github: true };
  throw new Error("Demo: unknown route " + path);
}
