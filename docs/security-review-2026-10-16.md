# Security review — 16 October 2026

## Verified
- Live Netlify Identity settings report `disable_signup: true` and `autoconfirm: false`. Public self-registration is disabled; no signup was attempted.
- GitHub main reports `protected: false`.
- Public security headers include CSP on main commercial pages, HSTS, nosniff and frame protection.
- Netlify dashboard requires login in the available browser. MFA, users, team permissions and Git Gateway restrictions could not be verified.

## Changes
- Added CSP for extensionless privacy, terms and thank-you routes.
- Redirected `/admin/index.html` to `/admin/` to use the editor's intended CSP.
- Replaced automatic publication of arbitrary top-level directories with an explicit public-directory list.
- Added ignore rules for local environment files and private-key files. This does not remove previously tracked files or replace secret scanning.
- Added weekly Dependabot updates for npm dependencies and GitHub Actions.

## Remaining
- Sign in to Netlify and GitHub to verify MFA, recovery methods, collaborators and Identity users. Do not store recovery codes in the repository.
- Configure branch protection with a workflow compatible with Decap CMS publishing; requiring PRs without changing the CMS workflow could block publishing.
- Review GitHub secret-scanning/dependency alert settings and external app permissions.
- Build and site tests pass, but the local mirror excludes binary media (112 asset checks skipped). Full CI checks remain necessary.
- This is a targeted hardening review, not a penetration test or security certification.

