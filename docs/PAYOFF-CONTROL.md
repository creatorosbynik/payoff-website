# Payoff Control — your app for stories, calendar, leads and automations

**Address:** `payoffcreative.com/control`. It's private: same login as `/admin`, hidden from Google.
**Works on:** PC (installs as an app with its own window and taskbar icon) and phone (installs on the home screen). One app, both screens.

## What it does

| Tab | You can |
|---|---|
| **Today** | See the stories waiting for you. Preview the post, watch and download the reel, copy the caption / LinkedIn post / lead hook, then **Approve & publish** (the post goes live in about a minute) or **Ask for changes**. Also shows today's slot, Tier 1 leads and how the last runs went. |
| **Calendar** | Every planned topic. Tap a day to change its title, keyword, date, pillar, status or notes. The morning run writes whatever is there. |
| **Leads** | Signal Board leads, Tier first then fit score. Filters: Act today, This week, Follow-up due, In talks, All. A lead page shows the dossier and drafts with copy buttons, plus one-tap updates: contacted, replied, call booked, won, lost, next action. |
| **Runs** | Each scheduled task (daily story, weekly plan, lead run) and how every run went. Runs log themselves to the Notion "Automation Runs" table. |

Everything reads and writes your existing Notion databases and the GitHub repo, so Notion stays the record. Nothing is copied anywhere else.

## One-time setup (about 10 minutes)

### 1. Notion key
1. Go to notion.so/profile/integrations → **New integration** → name it `Payoff Control`, pick your workspace, type **Internal** → Save.
2. Copy the **Internal Integration Secret**.
3. Open the **PAYOFF** page in Notion → `•••` (top right) → **Connections** → add **Payoff Control**. This covers the Blog Queue, Signal Board and Automation Runs, since they all sit under PAYOFF.

### 2. GitHub key
1. github.com → your photo → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. Name `Payoff Control`. Expiration: 1 year. Repository access: **Only select repositories** → `payoff-website`.
3. Permissions: **Contents** Read and write · **Pull requests** Read and write. Metadata is read-only and selected automatically.
4. Generate, then copy the token.

### 3. Put both keys in Netlify
Netlify → the Payoff site → **Site configuration** → **Environment variables** → **Add a variable**:
- `NOTION_TOKEN` = the Notion secret
- `GITHUB_TOKEN` = the GitHub token
- Optional: `CONTROL_ALLOWED_EMAILS` = your login email. Without it, any Identity user with the *editor* role gets in, which today means only you.

Then **Deploys** → **Trigger deploy** → **Deploy site**, so the function picks up the keys.

### 4. Log in and install
1. Open `payoffcreative.com/control` and log in. It's the same login as `/admin`. If it says your login isn't allowed, log out of `/admin` and back in once to refresh your role.
2. **PC (Chrome or Edge):** click the install icon at the right end of the address bar, or ⋮ → *Cast, save and share* → *Install page as app*. Then pin it to the taskbar.
3. **Android:** Chrome ⋮ → *Install app* (or *Add to Home screen*).
4. **iPhone:** Safari → Share → *Add to Home Screen*.

## How it's built (for later changes, in Claude Code or Antigravity)

- `control/`: the app. Plain HTML, CSS and JS with no build step. The brand fonts are self-hosted, it has an install manifest, and a service worker opens it instantly.
- `netlify/functions/control.mjs`: the private API. It checks the Identity login, then calls Notion and GitHub with the keys above. The keys never reach the browser.
- `netlify.toml`: routes `/api/control/*` to the function, and sets a strict security policy plus `noindex` on `/control/`.
- **Demo mode:** add `?demo` to the address on a Netlify deploy preview or on localhost. It shows fake data and saves nothing, which is useful for checking design changes.

To change it from your PC, open the repo folder in Antigravity or Claude Code, edit `control/`, then push. Netlify redeploys in about a minute.
