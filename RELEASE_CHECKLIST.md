# Release Checklist

Use this checklist for Netlify releases and hotfix deploys.

## Before deploy

- Confirm the branch is correct and the working tree is clean.
- Run `npm run check` (lint + build + bundle gate + unit tests).
- Run `npm run check:ci` when Playwright environment variables are available.
- Confirm required Netlify env vars are present:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `OPENAI_API_KEY`
  - optional: `OPENAI_MODEL`
- Skim the changed areas and note anything that needs focused QA.

## Deploy validation

- Wait for the Netlify deploy to finish.
- Open the Netlify subdomain first, then the custom domain (`https://cinova.app/`) if configured.
- Hard refresh once with `Ctrl+Shift+R`.
- Confirm the app shell loads without the error boundary.
- Open DevTools console and confirm there are no new app errors.

## Smoke test

- Auth:
  - sign in with an existing account
  - if auth changed, also test a fresh sign-up
- Learning flow:
  - open a lesson
  - mark a lesson complete
  - move to another lesson
  - refresh and test Continue Learning
- Saved state:
  - bookmark a lesson and reopen it from Bookmarks
  - open the Review / spaced repetition panel
- AI:
  - open AI Tutor and ask a simple question
  - open a coding challenge and test AI help
- Mobile:
  - open the sidebar on a narrow viewport
  - confirm the sidebar scrolls
  - confirm the sidebar closes cleanly
- Optional QA:
  - run `npm run test:e2e` (or `npm run test:integration`) if environment variables for authenticated flows are available

## PWA and cache check

- If the release changed routing, lazy-loaded panels, or the service worker:
  - verify the app loads the newest bundle
  - verify glossary/search/panels open without chunk-load errors
- If the app looks stale:
  1. Open DevTools
  2. Go to Application
  3. Service Workers -> Unregister
  4. Storage / Clear storage -> Clear site data
  5. Reload with `Ctrl+Shift+R`

## Sign-off

- Record the deployed commit SHA.
- Save the Netlify deploy URL.
- Confirm both the Netlify subdomain and production domain behave correctly.
- Merge or announce the release only after the checklist passes.
