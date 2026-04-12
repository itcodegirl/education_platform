# Release Checklist

Use this checklist for Netlify releases and hotfix deploys.

## Before Deploy

- Confirm the branch is correct and the working tree is clean.
- Run `npm test` — unit tests (Vitest) must be green.
- Run `npm run test:e2e` — Playwright smoke tests must be green against a local dev build.
- Run `npm run build`.
- Confirm required Netlify env vars are present:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `OPENAI_API_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (required by the AI rate limiter)
  - optional: `OPENAI_MODEL`
- Skim the changed areas and note anything that needs focused QA.

## Database & Security Gates

- If `supabase-schema.sql` changed:
  - apply the new migration in Supabase SQL editor
  - re-verify Row Level Security is enabled on every new table
  - confirm no new public-write policies were added by accident
- Spot-check a non-admin account against the admin routes and tables:
  - hitting `#admin` must not expose cross-user rows
  - direct REST queries to `profiles`, `progress`, `xp`, `ai_rate_limits` with a
    non-admin token must return only that user's own rows (or 401 for
    `ai_rate_limits`, which has no client policies)
- Confirm the Netlify function log shows the Supabase-backed rate limiter
  hitting the 10 req/min cap rather than falling back to the in-memory map
  (fallback implies `SUPABASE_SERVICE_ROLE_KEY` is missing).

## Performance Gate

- Run Lighthouse (mobile, slow 4G) against the Netlify preview URL.
- Budgets — release blocks on regression below:
  - Performance ≥ 90
  - Accessibility ≥ 95
  - Best Practices ≥ 95
  - SEO ≥ 90
- Check bundle sizes did not regress significantly from the previous build's
  `dist/assets/*` report. Investigate any new chunk over 250 kB gzipped.

## Deploy Validation

- Wait for the Netlify deploy to finish.
- Open the Netlify subdomain first, then the custom domain if one is configured.
- Hard refresh once with `Ctrl+Shift+R`.
- Confirm the app shell loads without the error boundary.
- Open DevTools console and confirm there are no new app errors.
- Verify the CSP header is present on the HTML response and no `Refused to
  load` / `Refused to execute` warnings appear in the console.

## Smoke Test

- Auth:
  - sign in with an existing account
  - if auth changed, also test a fresh sign-up
- Learning flow:
  - open a lesson
  - mark a lesson complete
  - move to another lesson
  - refresh and test `Continue Learning`
- Saved state:
  - bookmark a lesson and reopen it from Bookmarks
  - open the Review / spaced repetition panel
- AI:
  - open AI Tutor and ask a simple question
  - open a coding challenge and test AI help
  - trigger the 10 req/min limit and confirm the friendly 429 error
- Admin (if the release touched `src/components/admin/`):
  - open `#admin` as an admin account and walk every tab
  - confirm Lesson Builder preview + code generation still round-trip
- Mobile:
  - open the sidebar on a narrow viewport
  - confirm the sidebar scrolls
  - confirm the sidebar closes cleanly

## PWA / Cache Check

- If the release changed routing, lazy-loaded panels, or the service worker:
  - verify the app loads the newest bundle
  - verify glossary/search/panels open without chunk-load errors
- If the app looks stale:
  1. Open DevTools
  2. Go to `Application`
  3. `Service Workers` -> `Unregister`
  4. `Storage` / `Clear storage` -> `Clear site data`
  5. Reload with `Ctrl+Shift+R`

## Sign-Off

- Record the deployed commit SHA.
- Save the Netlify deploy URL.
- Record the Lighthouse report URL or screenshot.
- Confirm both the Netlify subdomain and production domain behave correctly.
- Merge or announce the release only after the checklist passes.
