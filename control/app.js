// Payoff Control — one place for daily stories, the content calendar, leads and automations.
// Plain ES module, no build step. Talks only to /api/control/* (Netlify function) with the
// Netlify Identity login token. Demo mode (?demo on previews/localhost) uses fake data.

const DEMO =
  new URLSearchParams(location.search).has("demo") &&
  (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) || location.hostname.startsWith("deploy-preview-"));

const SCHEDULES = [
  { task: "Daily story", when: "Every day · 06:41 IST", what: "Writes today's post + reel, opens the preview for you." },
  { task: "Weekly plan", when: "Sundays · 18:37 IST", what: "Fills next Monday to Sunday in the calendar." },
  { task: "Lead run", when: "Paused since 23 Sep", what: "Finds and researches new leads into the Signal Board." },
];
const STATUSES = ["Idea", "Queued", "Writing", "Ready to paste", "Published", "Hidden (ad landing)"];
const PILLARS = ["Mon · Teardown", "Tue · Story Rules", "Wed · Ad Lab", "Thu · Cost & Choice", "Fri · Craft Cut", "Sat · Founder Notes", "Sun · Culture Watch"];
const LEAD_STATUSES = ["New", "Researching", "Contacted", "Replied", "Call booked", "Proposal sent", "Won", "Lost", "Dead"];
const LOST_REASONS = ["Price", "Timing", "Went with another agency", "No reply", "Not a fit"];

/* ---------------- tiny helpers ---------------- */
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const IST = "Asia/Kolkata";
const todayISO = () => new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(new Date());
const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const fmt = (iso, opts) => iso ? new Date(iso.length === 10 ? iso + "T12:00:00Z" : iso).toLocaleDateString("en-GB", { timeZone: IST, ...opts }) : "";
const fmtTime = (iso) => iso && iso.length > 10 ? new Date(iso).toLocaleString("en-GB", { timeZone: IST, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : fmt(iso, { day: "numeric", month: "short" });
const pad3 = (n) => String(n ?? "").padStart(3, "0");
const plain = (s) => String(s ?? "").replace(/\*/g, "");

const ICON = {
  today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/><path d="M8 14l2.5 2.5L16 12"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
  leads: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.8" fill="currentColor"/></svg>',
  runs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v4h4"/><path d="M12 8v4l3 2"/></svg>',
  ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>',
};

/* ---------------- auth + api ---------------- */
let identity = null;
const state = { me: null, stories: null, calendar: null, leads: null, runs: null, loadedAt: {} };
const copyStore = new Map();
let copyId = 0;
const stash = (text) => { const id = "c" + ++copyId; copyStore.set(id, text); return id; };

async function token() {
  const user = identity?.currentUser();
  if (!user) return null;
  return user.jwt();
}

async function api(path, { method = "GET", body } = {}) {
  if (DEMO) {
    const { handle } = await import("./demo.js");
    return handle(path, method, body);
  }
  const t = await token();
  if (!t) { showLogin(); throw new Error("Please log in."); }
  const res = await fetch(`/api/control/${path}`, {
    method,
    headers: { authorization: `Bearer ${t}`, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { showLogin(); throw new Error(data.error || "Please log in."); }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

async function load(key, path, maxAgeMs = 60000, force = false) {
  if (!force && state[key] && Date.now() - (state.loadedAt[key] || 0) < maxAgeMs) return state[key];
  state[key] = await api(path);
  state.loadedAt[key] = Date.now();
  updateBadges();
  return state[key];
}

function loadIdentityWidget() {
  return new Promise((resolve, reject) => {
    if (window.netlifyIdentity) return resolve(window.netlifyIdentity);
    const s = document.createElement("script");
    s.src = "https://identity.netlify.com/v1/netlify-identity-widget.js";
    s.onload = () => resolve(window.netlifyIdentity);
    s.onerror = () => reject(new Error("Couldn't load the login. Check your connection."));
    document.head.appendChild(s);
  });
}

/* ---------------- shell ---------------- */
const NAV = [
  { id: "today", label: "Today" },
  { id: "calendar", label: "Calendar" },
  { id: "leads", label: "Leads" },
  { id: "runs", label: "Runs" },
];

function shell() {
  const app = $("#app");
  app.innerHTML = `
    ${DEMO ? '<div class="demo-flag">Demo mode · fake data · nothing is saved</div>' : ""}
    <div class="shell">
      <aside class="side">
        <a class="brand-tab" href="#/today" aria-label="Payoff Control home"><img src="/control/icons/logo-cream.png" alt="Payoff" width="140" height="32"></a>
        <nav aria-label="Main">${NAV.map((n) => `<a href="#/${n.id}" data-nav="${n.id}">${ICON[n.id]}<span>${n.label}</span><span class="badge" data-badge="${n.id}" hidden></span></a>`).join("")}</nav>
        <div class="foot">
          <div>Payoff Control</div>
          <div data-who></div>
          <button class="btn small" data-act="install" hidden>Install app</button>
          <button class="btn small" data-act="logout" ${DEMO ? "hidden" : ""}>Log out</button>
        </div>
      </aside>
      <div>
        <header class="topbar">
          <a class="brand-tab" href="#/today" aria-label="Payoff Control home"><img src="/control/icons/logo-cream.png" alt="Payoff" width="100" height="23"></a>
          <div class="who"><span data-today></span><br><button class="btn small" data-act="install" hidden style="margin-top:6px">Install</button></div>
        </header>
        <main id="view" tabindex="-1"></main>
      </div>
    </div>
    <nav class="tabbar" aria-label="Main">${NAV.map((n) => `<a href="#/${n.id}" data-nav="${n.id}">${ICON[n.id]}<span>${n.label}</span><span class="badge" data-badge="${n.id}" hidden></span></a>`).join("")}</nav>
    <div class="toast" role="status" aria-live="polite"></div>
    <dialog id="dlg"></dialog>`;
  document.querySelectorAll("[data-today]").forEach((el) => (el.textContent = fmt(todayISO(), { weekday: "short", day: "numeric", month: "short" })));
  if (deferredInstall) document.querySelectorAll('[data-act="install"]').forEach((b) => (b.hidden = false));
}

function setNav(id) {
  document.querySelectorAll("[data-nav]").forEach((a) => (a.dataset.nav === id ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
}

function updateBadges() {
  const set = (id, n) => document.querySelectorAll(`[data-badge="${id}"]`).forEach((b) => { b.hidden = !n; b.textContent = n; });
  if (state.stories) set("today", state.stories.length);
  if (state.leads) set("leads", state.leads.filter((l) => l.Tier === "Tier 1 - act today").length);
}

function toast(msg) {
  const t = $(".toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove("show"), 2600);
}

function errorBox(e) {
  return `<div class="card"><div class="empty"><b>Couldn't load</b>${esc(e.message)}<div style="margin-top:14px"><button class="btn small" data-act="reload">${ICON.refresh} Try again</button></div></div></div>`;
}

/* ---------------- dialog ---------------- */
function openDialog({ title, text = "", fields = [], submit = "Save", tone = "primary" }) {
  const dlg = $("#dlg");
  dlg.innerHTML = `
    <div class="dh"><h3>${esc(title)}</h3>${text ? `<p>${text}</p>` : ""}</div>
    <form method="dialog">
      ${fields.map((f) => fieldHtml(f)).join("")}
      <div class="actions">
        <button class="btn" value="cancel" formnovalidate>Cancel</button>
        <button class="btn ${tone}" value="ok">${esc(submit)}</button>
      </div>
    </form>`;
  dlg.showModal();
  const first = dlg.querySelector("input, select, textarea");
  if (first) first.focus();
  return new Promise((resolve) => {
    dlg.addEventListener("close", () => {
      if (dlg.returnValue !== "ok") return resolve(null);
      const out = {};
      for (const f of fields) out[f.name] = dlg.querySelector(`[name="${f.name}"]`).value;
      resolve(out);
    }, { once: true });
  });
}

function fieldHtml(f) {
  const id = `f_${f.name}`;
  if (f.type === "select") {
    return `<label class="f" for="${id}">${esc(f.label)}<select id="${id}" name="${f.name}">${f.options.map((o) => `<option ${o === f.value ? "selected" : ""}>${esc(o)}</option>`).join("")}</select></label>`;
  }
  if (f.type === "textarea") return `<label class="f" for="${id}">${esc(f.label)}<textarea id="${id}" name="${f.name}" ${f.required ? "required" : ""}>${esc(f.value || "")}</textarea></label>`;
  return `<label class="f" for="${id}">${esc(f.label)}<input id="${id}" name="${f.name}" type="${f.type || "text"}" value="${esc(f.value || "")}" ${f.required ? "required" : ""}></label>`;
}

/* ---------------- views ---------------- */
const views = { today: viewToday, calendar: viewCalendar, leads: viewLeads, runs: viewRuns };

async function route() {
  const [, page = "today", id] = location.hash.split("/");
  const name = views[page] ? page : "today";
  setNav(name);
  const view = $("#view");
  view.innerHTML = `<div class="skeleton"></div>`;
  try {
    if (name === "leads" && id) await viewLead(view, decodeURIComponent(id));
    else await views[name](view);
  } catch (e) {
    view.innerHTML = errorBox(e);
  }
  view.focus({ preventScroll: true });
}

/* ---- Today ---- */
async function viewToday(view, force = false) {
  const [stories, calendar, leads, runs] = await Promise.all([
    load("stories", "stories", 60000, force),
    load("calendar", "calendar", 60000, force).catch(() => []),
    load("leads", "leads", 60000, force).catch(() => []),
    load("runs", "runs", 60000, force).catch(() => []),
  ]);
  const today = todayISO();
  const slot = calendar.find((r) => r["Publish date"] === today);
  const nextSlot = calendar.find((r) => r["Publish date"] > today);
  const act = leads.filter((l) => l.Tier === "Tier 1 - act today");
  const due = leads.filter((l) => l["Next action by"] && l["Next action by"] <= today);
  const lastStory = runs.find((r) => r.Task === "Daily story");
  view.innerHTML = `
    <p class="eyebrow">${esc(fmt(today, { weekday: "long", day: "numeric", month: "long" }))}</p>
    <div class="actions split" style="align-items:end"><h1 class="page">Today</h1><button class="btn small" data-act="refresh">${ICON.refresh} Refresh</button></div>
    <p class="lede">Approve the story, post the reel, work the leads. Everything else runs on its own.</p>
    <div class="stats">
      <div class="stat ${stories.length ? "red" : ""}"><div class="n">${stories.length}</div><div class="l">Stories to approve</div></div>
      <div class="stat"><div class="n">${act.length}</div><div class="l">Leads to act on today</div></div>
      <div class="stat"><div class="n">${due.length}</div><div class="l">Follow-ups due</div></div>
    </div>
    <div class="grid-2" style="margin-top:16px">
      <section aria-labelledby="h-wait">
        <h2 class="sec" id="h-wait">Waiting for you <span class="count">${stories.length}</span></h2>
        <div class="stack">${stories.length ? stories.map(storyCard).join("") : `<div class="card"><div class="empty"><b>Nothing to approve</b>The next story lands at 06:41 IST${nextSlot ? `: “${esc(nextSlot.Title)}”` : ""}.</div></div>`}</div>
      </section>
      <aside class="stack" aria-label="Today at a glance">
        <h2 class="sec">Today's slot</h2>
        ${slot ? `<div class="card">${calRow(slot)}</div>` : `<div class="card"><div class="empty">Nothing scheduled for today. <a href="#/calendar">Open the calendar</a></div></div>`}
        <h2 class="sec">Act today <span class="count">${act.length}</span></h2>
        <div class="card list">${act.slice(0, 4).map(leadRow).join("") || '<div class="empty">No Tier 1 leads right now.</div>'}</div>
        ${act.length > 4 ? `<a class="btn small" href="#/leads">All ${act.length} leads</a>` : ""}
        <h2 class="sec">Automations</h2>
        <div class="card list">${SCHEDULES.map((s) => { const r = runs.find((x) => x.Task === s.task); return runRow(r, s); }).join("")}</div>
        ${lastStory?.Status === "Failed" ? `<div class="alert"><b>The last daily run failed.</b> ${esc(lastStory.Summary || "")}</div>` : ""}
      </aside>
    </div>`;
}

function storyCard(s) {
  const cap = stash(s.igCaption);
  const li = stash(s.linkedin);
  const hook = stash(s.leadHook);
  return `
  <article class="card story">
    ${s.cover ? `<div class="cover" style="background-image:url('${esc(s.cover)}')" role="img" aria-label="Cover for ${esc(s.title)}"></div>` : ""}
    <div class="card-pad">
      <div class="head"><span>Slate ${pad3(s.slate)} · ${esc(s.pillar || "")}</span><span>PR #${s.pr}</span></div>
      <h3>${esc(s.title)}</h3>
      ${s.oneIdea ? `<p class="idea"><b>One idea:</b> ${esc(s.oneIdea)}</p>` : ""}
      <div class="chips">
        ${s.keyword ? `<span class="chip">${esc(s.keyword)}</span>` : ""}
        ${s.depth ? `<span class="chip ghost">${esc(s.depth)}</span>` : ""}
        ${s.date ? `<span class="chip ghost">${esc(fmt(s.date, { day: "numeric", month: "short" }))}</span>` : ""}
      </div>
      ${s.gateFailed ? `<div class="alert"><b>Quality gate failed.</b> Open the PR before approving.</div>` : ""}
      ${s.teardownCheck ? `<div class="alert"><b>Teardown:</b> run your Ad Signals check on this brand before approving.</div>` : ""}
      ${s.reel ? `<div class="reel"><video src="${esc(s.reel.url)}" controls playsinline preload="metadata"></video><div class="reel-copy"><strong>${esc(plain(s.video?.hook || "The reel"))}</strong>The move: ${esc(plain(s.video?.move || ""))}<div class="actions" style="margin-top:12px"><a class="btn small" href="${esc(s.reel.url)}" download>Download reel</a></div></div></div>` : `<p class="idea" style="color:var(--muted)">Reel: open the row in Notion${s.notion ? ` (<a href="${esc(s.notion)}" target="_blank" rel="noopener">link</a>)` : ""}.</p>`}
      ${s.warnings?.length ? `<details class="warns"><summary>${s.warnings.length} things to eyeball</summary><ul>${s.warnings.map((w) => `<li>${esc(w)}</li>`).join("")}</ul></details>` : ""}
      <div class="actions" style="margin-bottom:10px">
        ${s.preview ? `<a class="btn small" href="${esc(s.preview)}" target="_blank" rel="noopener">${ICON.ext} Preview post</a>` : ""}
        <button class="btn small" data-act="copy" data-copy="${cap}" ${s.igCaption ? "" : "disabled"}>${ICON.copy} Caption</button>
        <button class="btn small" data-act="copy" data-copy="${li}" ${s.linkedin ? "" : "disabled"}>${ICON.copy} LinkedIn</button>
        <button class="btn small" data-act="copy" data-copy="${hook}" ${s.leadHook ? "" : "disabled"}>${ICON.copy} Lead hook</button>
        <a class="btn small" href="${esc(s.url)}" target="_blank" rel="noopener">${ICON.ext} PR</a>
      </div>
      <div class="actions">
        <button class="btn primary" data-act="approve" data-pr="${s.pr}" data-title="${esc(s.title)}">Approve &amp; publish</button>
        <button class="btn" data-act="changes" data-pr="${s.pr}">Ask for changes</button>
      </div>
    </div>
  </article>`;
}

/* ---- Calendar ---- */
function pillarDot(p) {
  if (!p) return '<span class="dot"></span>';
  return p.includes("Teardown") || p.includes("Cost") ? '<span class="dot red"></span>' : p.includes("Founder") || p.includes("Culture") ? '<span class="dot hollow"></span>' : '<span class="dot cream"></span>';
}
function statusChip(s) {
  const cls = s === "Published" ? "solid" : s === "Ready to paste" ? "red" : s === "Writing" ? "" : "ghost";
  const label = s === "Ready to paste" ? "In review" : s;
  return s ? `<span class="chip ${cls}">${esc(label)}</span>` : "";
}
function calRow(r) {
  const d = r["Publish date"];
  const isToday = d === todayISO();
  return `
  <button class="row ${isToday ? "today" : ""}" data-act="cal-edit" data-id="${esc(r.id)}">
    <div class="datebox">${d ? `<div class="d">${esc(fmt(d, { day: "numeric" }))}</div><div class="w">${esc(fmt(d, { weekday: "short" }))}</div>` : `<div class="w">No date</div>`}</div>
    <div>
      <div class="t">${esc(r.Title || "Untitled")}</div>
      <div class="s">${pillarDot(r.Pillar)} ${esc(r.Pillar || r.Category || "")}${r["Primary keyword"] ? ` · ${esc(r["Primary keyword"])}` : ""}${r.Slate ? ` · Slate ${pad3(r.Slate)}` : ""}</div>
    </div>
    <div class="r">${statusChip(r.Status)}</div>
  </button>`;
}

async function viewCalendar(view, force = false) {
  const rows = await load("calendar", "calendar", 60000, force);
  const today = todayISO();
  const upcoming = rows.filter((r) => r["Publish date"] && r["Publish date"] >= today);
  const recent = rows.filter((r) => r["Publish date"] && r["Publish date"] < today && r["Publish date"] >= addDays(today, -14)).reverse();
  const ideas = rows.filter((r) => !r["Publish date"] && ["Idea", "Queued"].includes(r.Status));
  view.innerHTML = `
    <p class="eyebrow">Blog Queue · one topic a day</p>
    <div class="actions split" style="align-items:end"><h1 class="page">Calendar</h1><button class="btn small" data-act="refresh">${ICON.refresh} Refresh</button></div>
    <p class="lede">Tap a day to change its topic, keyword or date. The morning run writes whatever is here.</p>
    <h2 class="sec">Coming up <span class="count">${upcoming.length}</span></h2>
    <div class="card list">${upcoming.map(calRow).join("") || '<div class="empty"><b>Nothing planned</b>The Sunday planner fills next week at 18:37.</div>'}</div>
    <h2 class="sec">Ideas, not scheduled <span class="count">${ideas.length}</span></h2>
    <div class="card list">${ideas.map(calRow).join("") || '<div class="empty">No loose ideas.</div>'}</div>
    <h2 class="sec">Last two weeks <span class="count">${recent.length}</span></h2>
    <div class="card list">${recent.map(calRow).join("") || '<div class="empty">Nothing yet.</div>'}</div>`;
}

async function editCalendar(id) {
  const r = state.calendar.find((x) => x.id === id);
  if (!r) return;
  const out = await openDialog({
    title: r.Title || "Edit story",
    text: r.Notes ? esc(r.Notes) : "",
    fields: [
      { name: "title", label: "Title", value: r.Title },
      { name: "keyword", label: "Primary keyword", value: r["Primary keyword"] },
      { name: "publishDate", label: "Publish date", type: "date", value: r["Publish date"] },
      { name: "pillar", label: "Pillar", type: "select", options: ["", ...PILLARS], value: r.Pillar || "" },
      { name: "status", label: "Status", type: "select", options: STATUSES, value: r.Status },
      { name: "notes", label: "Notes (one idea · CEP · first-hand angle)", type: "textarea", value: r.Notes },
    ],
  });
  if (!out) return;
  const changes = {};
  if (out.title !== (r.Title || "")) changes.title = out.title;
  if (out.keyword !== (r["Primary keyword"] || "")) changes.keyword = out.keyword;
  if (out.publishDate !== (r["Publish date"] || "")) changes.publishDate = out.publishDate;
  if (out.pillar !== (r.Pillar || "")) changes.pillar = out.pillar || null;
  if (out.status !== r.Status) changes.status = out.status;
  if (out.notes !== (r.Notes || "")) changes.notes = out.notes;
  if (!Object.keys(changes).length) return;
  await api(`calendar/${encodeURIComponent(id)}`, { method: "PATCH", body: changes });
  toast("Saved to Notion");
  await viewCalendar($("#view"), true);
}

/* ---- Leads ---- */
let leadFilter = "act";
let leadQuery = "";
const LEAD_FILTERS = [
  { id: "act", label: "Act today", test: (l) => l.Tier === "Tier 1 - act today" },
  { id: "week", label: "This week", test: (l) => l.Tier === "Tier 2 - this week" },
  { id: "due", label: "Follow-up due", test: (l) => l["Next action by"] && l["Next action by"] <= todayISO() },
  { id: "talking", label: "In talks", test: (l) => ["Replied", "Call booked", "Proposal sent"].includes(l.Status) },
  { id: "all", label: "All open", test: () => true },
];

function leadRow(l) {
  const score = l["Fit score"];
  const cls = score >= 8 ? "hot" : score >= 6 ? "warm" : "";
  const due = l["Next action by"];
  return `
  <a class="row" href="#/leads/${encodeURIComponent(l.id)}">
    <div class="score ${cls}" aria-label="Fit score ${score ?? "unknown"}">${score ?? "–"}</div>
    <div>
      <div class="t">${esc(l.Company || (l.Signal || "").split(" - ")[0] || "Lead")}</div>
      <div class="s">${esc(l["Next action"] || l.Signal || "")}</div>
    </div>
    <div class="r">${esc(l.Status || "")}${due ? `<br>${due <= todayISO() ? "<b style=\"color:var(--cream)\">due</b> " : ""}${esc(fmt(due, { day: "numeric", month: "short" }))}` : ""}</div>
  </a>`;
}

async function viewLeads(view, force = false) {
  const leads = await load("leads", "leads", 60000, force);
  const f = LEAD_FILTERS.find((x) => x.id === leadFilter) || LEAD_FILTERS[0];
  const q = leadQuery.trim().toLowerCase();
  const list = leads.filter(f.test).filter((l) => !q || [l.Company, l.Signal, l.Contact, l.City, l["What they want"]].join(" ").toLowerCase().includes(q));
  view.innerHTML = `
    <p class="eyebrow">Signal Board · open leads</p>
    <div class="actions split" style="align-items:end"><h1 class="page">Leads</h1><button class="btn small" data-act="refresh">${ICON.refresh} Refresh</button></div>
    <p class="lede">Tier first, then fit score. Open a lead for the dossier, the drafted message and quick updates.</p>
    <div class="seg" role="group" aria-label="Filter leads">${LEAD_FILTERS.map((x) => `<button data-act="lead-filter" data-f="${x.id}" aria-pressed="${x.id === f.id}">${x.label} · ${leads.filter(x.test).length}</button>`).join("")}</div>
    <input class="search" type="search" placeholder="Search brand, contact, city…" value="${esc(leadQuery)}" data-act="lead-search" aria-label="Search leads">
    <div class="card list">${list.map(leadRow).join("") || '<div class="empty"><b>Nothing here</b>Try another filter.</div>'}</div>`;
}

async function viewLead(view, id) {
  const l = await api(`leads/${encodeURIComponent(id)}`);
  const body = stash(l.body || "");
  const pitch = stash(l["Pitch angle"] || "");
  const links = [["Website", l.Website], ["Instagram", l.Instagram], ["Signal post", l.Link], ["Ad Library", l["Ad Library link"]], ["Notion", l.url]].filter(([, u]) => u);
  view.innerHTML = `
    <a class="back" href="#/leads">← Leads</a>
    <p class="eyebrow">${esc(l.Tier || "")} · ${esc(l["Signal type"] || "")} · ${esc(l.Source || "")}</p>
    <h1 class="page" style="font-size:clamp(34px,6vw,52px)">${esc(l.Company || l.Signal)}</h1>
    <p class="lede">${esc(l.Signal || "")}</p>
    <div class="facts">
      <div class="fact"><div class="k">Fit</div><div class="v">${esc(l["Fit score"] ?? "–")}/10</div></div>
      <div class="fact"><div class="k">Status</div><div class="v">${esc(l.Status || "–")}</div></div>
      <div class="fact"><div class="k">Contact</div><div class="v">${esc([l.Contact, l.Role].filter(Boolean).join(", ") || "–")}</div></div>
      <div class="fact"><div class="k">Reach via</div><div class="v">${esc(l.Route || "–")}${l["Contact detail"] ? `<br><span style="color:var(--muted)">${esc(l["Contact detail"])}</span>` : ""}</div></div>
      <div class="fact"><div class="k">Need</div><div class="v">${esc((l.Need || []).join(", ") || "–")}</div></div>
      <div class="fact"><div class="k">City · market</div><div class="v">${esc([l.City, l.Market].filter(Boolean).join(" · ") || "–")}</div></div>
      <div class="fact"><div class="k">Touches</div><div class="v">${esc(l.Touches ?? 0)}${l["Last contacted"] ? ` · last ${esc(fmt(l["Last contacted"], { day: "numeric", month: "short" }))}` : ""}</div></div>
      <div class="fact"><div class="k">Meta ads live</div><div class="v">${esc(l["Meta ads active"] ?? "–")}</div></div>
    </div>
    <div class="actions" style="margin-bottom:18px">${links.map(([n, u]) => `<a class="btn small" href="${esc(u)}" target="_blank" rel="noopener">${ICON.ext} ${n}</a>`).join("")}</div>
    <div class="grid-2">
      <div>
        ${l["What they want"] ? `<div class="block"><h4>What they want</h4><p>${esc(l["What they want"])}</p></div>` : ""}
        ${l["Story gap"] ? `<div class="block"><h4>Story gap</h4><p>${esc(l["Story gap"])}</p></div>` : ""}
        ${l["Pitch angle"] ? `<div class="block"><h4>Pitch angle</h4><p>${esc(l["Pitch angle"])}</p><div class="actions" style="margin-top:8px"><button class="btn small" data-act="copy" data-copy="${pitch}">${ICON.copy} Copy</button></div></div>` : ""}
        <div class="block"><h4>Dossier + drafts</h4><div class="doc">${esc(l.body || "No notes on this lead yet.")}</div><div class="actions" style="margin-top:8px"><button class="btn small" data-act="copy" data-copy="${body}">${ICON.copy} Copy all</button></div></div>
      </div>
      <div class="stack">
        <div class="card card-pad">
          <h4 class="eyebrow">Update</h4>
          <div class="actions" style="margin-bottom:12px">
            <button class="btn primary" data-act="lead-contacted" data-id="${esc(l.id)}">I contacted them</button>
            <button class="btn" data-act="lead-status" data-id="${esc(l.id)}" data-s="Replied">They replied</button>
            <button class="btn" data-act="lead-status" data-id="${esc(l.id)}" data-s="Call booked">Call booked</button>
            <button class="btn" data-act="lead-status" data-id="${esc(l.id)}" data-s="Won">Won</button>
            <button class="btn" data-act="lead-lost" data-id="${esc(l.id)}">Lost</button>
          </div>
          <form class="inline-form" data-form="next" data-id="${esc(l.id)}">
            <label class="f">Next action<input name="nextAction" value="${esc(l["Next action"] || "")}"></label>
            <label class="f">By<input name="nextActionBy" type="date" value="${esc(l["Next action by"] || "")}"></label>
            <button class="btn" type="submit">Save</button>
          </form>
          <label class="f" style="margin-top:12px">Status
            <select data-act="lead-status-select" data-id="${esc(l.id)}">${LEAD_STATUSES.map((s) => `<option ${s === l.Status ? "selected" : ""}>${s}</option>`).join("")}</select>
          </label>
        </div>
      </div>
    </div>`;
}

async function patchLead(id, body, msg) {
  await api(`leads/${encodeURIComponent(id)}`, { method: "PATCH", body });
  state.leads = null;
  toast(msg);
  await viewLead($("#view"), id);
}

/* ---- Runs ---- */
function runRow(r, sched) {
  const s = r?.Status;
  const cls = s === "Failed" ? "red" : s === "Succeeded" ? "solid" : s ? "" : "ghost";
  return `
  <div class="row" style="cursor:default">
    <span class="dot ${s === "Failed" ? "red" : s === "Succeeded" ? "cream" : "hollow"}"></span>
    <div>
      <div class="t">${esc(sched?.task || r?.Task || r?.Run)}</div>
      <div class="s">${r ? `${esc(fmtTime(r.Started))}${r.Summary ? ` · ${esc(r.Summary)}` : ""}` : esc(sched?.when || "")}</div>
    </div>
    <div class="r"><span class="chip ${cls}">${esc(s || "No runs yet")}</span></div>
  </div>`;
}

async function viewRuns(view, force = false) {
  const runs = await load("runs", "runs", 30000, force);
  view.innerHTML = `
    <p class="eyebrow">Scheduled tasks</p>
    <div class="actions split" style="align-items:end"><h1 class="page">Automations</h1><button class="btn small" data-act="refresh">${ICON.refresh} Refresh</button></div>
    <p class="lede">What runs on its own, and how each run went. Every run writes a line here.</p>
    <div class="sched">${SCHEDULES.map((s) => `<div class="card card-pad"><span class="chip ${s.when.startsWith("Paused") ? "ghost" : "red"}">${s.when.startsWith("Paused") ? "Paused" : "On"}</span><h4>${esc(s.task)}</h4><div class="when">${esc(s.when)}</div><p style="margin:8px 0 0;color:var(--muted);font-size:14px">${esc(s.what)}</p></div>`).join("")}</div>
    <h2 class="sec">Recent runs <span class="count">${runs.length}</span></h2>
    <div class="card list">${runs.map((r) => `
      <div class="row" style="cursor:default">
        <span class="dot ${r.Status === "Failed" ? "red" : r.Status === "Succeeded" ? "cream" : "hollow"}"></span>
        <div><div class="t">${esc(r.Run)}</div><div class="s">${esc(fmtTime(r.Started))}${r.Summary ? ` · ${esc(r.Summary)}` : ""}</div></div>
        <div class="r"><span class="chip ${r.Status === "Failed" ? "red" : r.Status === "Succeeded" ? "solid" : ""}">${esc(r.Status || "")}</span>${r.Link ? `<br><a href="${esc(r.Link)}" target="_blank" rel="noopener">Open</a>` : ""}</div>
      </div>`).join("") || '<div class="empty"><b>No runs logged yet</b>The first one appears after tonight\'s planner.</div>'}</div>`;
}

/* ---------------- events ---------------- */
document.addEventListener("click", async (ev) => {
  const el = ev.target.closest("[data-act]");
  if (!el || el.tagName === "INPUT" || el.tagName === "SELECT") return;
  const act = el.dataset.act;
  try {
    if (act === "copy") {
      await navigator.clipboard.writeText(copyStore.get(el.dataset.copy) || "");
      toast("Copied");
    } else if (act === "refresh" || act === "reload") {
      Object.keys(state.loadedAt).forEach((k) => (state.loadedAt[k] = 0));
      await route();
      toast("Up to date");
    } else if (act === "approve") {
      const ok = await openDialog({
        title: "Publish this story?",
        text: `<b>${esc(el.dataset.title)}</b> goes live on payoffcreative.com about a minute after you approve. You can still edit it in /admin afterwards.`,
        submit: "Approve & publish",
      });
      if (!ok) return;
      el.disabled = true;
      const r = await api(`stories/${el.dataset.pr}/approve`, { method: "POST", body: {} });
      toast(r.live ? "Published · going live now" : "Approved");
      state.stories = null;
      await viewToday($("#view"), true);
    } else if (act === "changes") {
      const out = await openDialog({ title: "What should change?", text: "This goes on the pull request. Ask Claude to “fix story” with the same note, or edit it in /admin.", fields: [{ name: "note", label: "Your note", type: "textarea", required: true }], submit: "Send note" });
      if (!out?.note) return;
      await api(`stories/${el.dataset.pr}/changes`, { method: "POST", body: { note: out.note } });
      toast("Note added to the PR");
    } else if (act === "cal-edit") {
      await editCalendar(el.dataset.id);
    } else if (act === "lead-filter") {
      leadFilter = el.dataset.f;
      await viewLeads($("#view"));
    } else if (act === "lead-contacted") {
      el.disabled = true;
      await patchLead(el.dataset.id, { contacted: true }, "Logged: contacted today");
    } else if (act === "lead-status") {
      el.disabled = true;
      await patchLead(el.dataset.id, { status: el.dataset.s }, `Status: ${el.dataset.s}`);
    } else if (act === "lead-lost") {
      const out = await openDialog({ title: "Why was it lost?", fields: [{ name: "lostReason", label: "Reason", type: "select", options: LOST_REASONS }], submit: "Mark lost" });
      if (!out) return;
      await patchLead(el.dataset.id, { status: "Lost", lostReason: out.lostReason }, "Marked lost");
    } else if (act === "install" && deferredInstall) {
      deferredInstall.prompt();
      deferredInstall = null;
      document.querySelectorAll('[data-act="install"]').forEach((b) => (b.hidden = true));
    } else if (act === "logout") {
      identity?.logout();
    }
  } catch (e) {
    toast(e.message);
    el.disabled = false;
  }
});

document.addEventListener("change", async (ev) => {
  const el = ev.target;
  if (el.dataset.act === "lead-status-select") {
    try { await patchLead(el.dataset.id, { status: el.value }, `Status: ${el.value}`); } catch (e) { toast(e.message); }
  }
});

document.addEventListener("input", (ev) => {
  const el = ev.target;
  if (el.dataset.act === "lead-search") {
    leadQuery = el.value;
    clearTimeout(document.searchT);
    document.searchT = setTimeout(async () => {
      await viewLeads($("#view"));
      const s = $(".search");
      s.focus();
      s.setSelectionRange(s.value.length, s.value.length);
    }, 250);
  }
});

document.addEventListener("submit", async (ev) => {
  const form = ev.target;
  if (form.dataset.form !== "next") return;
  ev.preventDefault();
  const fd = new FormData(form);
  try {
    await patchLead(form.dataset.id, { nextAction: fd.get("nextAction"), nextActionBy: fd.get("nextActionBy") }, "Next action saved");
  } catch (e) { toast(e.message); }
});

/* ---------------- install (PWA) ---------------- */
let deferredInstall = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstall = e;
  document.querySelectorAll('[data-act="install"]').forEach((b) => (b.hidden = false));
});
if ("serviceWorker" in navigator && !DEMO) navigator.serviceWorker.register("/control/sw.js", { scope: "/control/" }).catch(() => {});

/* ---------------- start ---------------- */
function showLogin(message) {
  $("#app").innerHTML = `
    <div class="login"><div class="box">
      <img src="/control/icons/logo-cream.png" alt="Payoff" width="220" height="50">
      <h1>Payoff Control</h1>
      <p>Stories, calendar, leads and automations in one place. Log in with your Payoff dashboard account.</p>
      <button class="btn" data-act="login">Log in</button>
      ${message ? `<p class="note">${esc(message)}</p>` : ""}
      <p class="note">Same login as payoffcreative.com/admin.</p>
    </div></div>`;
  $('[data-act="login"]').addEventListener("click", () => identity?.open("login"));
}

async function startApp() {
  shell();
  if (!DEMO) {
    try {
      state.me = await api("me");
      document.querySelectorAll("[data-who]").forEach((el) => (el.textContent = state.me.email));
      const missing = [!state.me.notion && "NOTION_TOKEN", !state.me.github && "GITHUB_TOKEN"].filter(Boolean);
      if (missing.length) setTimeout(() => toast(`Setup: add ${missing.join(" + ")} in Netlify`), 400);
    } catch (e) {
      if (/log in/i.test(e.message)) return;
      showLogin(e.message);
      return;
    }
  }
  if (!location.hash) location.hash = "#/today";
  await route();
}

window.addEventListener("hashchange", () => { if ($("#view")) route(); });

(async function boot() {
  if (DEMO) return startApp();
  try {
    identity = await loadIdentityWidget();
    identity.on("init", (user) => (user ? startApp() : showLogin()));
    identity.on("login", () => { identity.close(); startApp(); });
    identity.on("logout", () => { Object.assign(state, { me: null, stories: null, calendar: null, leads: null, runs: null }); showLogin(); });
    identity.init({ APIUrl: `${location.origin}/.netlify/identity` });
  } catch (e) {
    showLogin(e.message);
  }
})();
