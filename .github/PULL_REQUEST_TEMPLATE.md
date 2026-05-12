## Summary

<!-- 1-2 sentences. What does this PR do and why? -->

## What Changed

<!-- Bullet list of the user-visible and engineer-visible changes. -->

-

## Verification

- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] `npm audit --audit-level=high` - no new findings
- [ ] `npm run audit:performance` passes if this PR touches routing, Vite chunking, global CSS, Monaco/editor, export tools, course data, service worker behavior, or public/auth entry points
- [ ] Relevant flows tested locally (mark which):
  - [ ] Auth (sign in / sign up / OAuth / sign out)
  - [ ] AI tutor (`/.netlify/functions/ai`)
  - [ ] AI practice generator (`/.netlify/functions/practice-generate`)
  - [ ] Lesson view + code preview sandbox
  - [ ] Sidebar nav + lesson nav
  - [ ] Gamification (XP popup, badge unlock, streaks)
  - [ ] Mobile layout (< 768px)
  - [ ] `/styleguide` design preview
  - [ ] `/u/:handle` public profile

## Security Checklist

- [ ] No secrets committed (`.env`, API keys, service role keys)
- [ ] No new `dangerouslySetInnerHTML` sinks with unescaped input
- [ ] Any new API route requires a valid Supabase session
- [ ] Any new user-generated content is HTML-escaped before render
- [ ] Any new Supabase table has RLS enabled + appropriate policies
- [ ] Any new third-party script / font / image origin is reflected
      in `netlify.toml` CSP

## Performance Checklist

- [ ] Lighthouse mobile + desktop artifacts reviewed if UI, routing, CSS, service worker, or entry-loading behavior changed
- [ ] Bundle budget changes are intentional and documented in [`docs/performance-budget.md`](docs/performance-budget.md)
- [ ] Monaco/editor, jsPDF, html2canvas, Supabase, and course data remain lazy and user-triggered
- [ ] No protected app styles or heavy lazy chunks are preloaded from the public entry HTML
- [ ] React Profiler reviewed for authenticated lesson navigation, panel switching, quiz submission, or challenge editor changes

## Release Checklist

Use [`RELEASE_CHECKLIST.md`](../RELEASE_CHECKLIST.md) for final deploy validation.

- [ ] Netlify deploy reviewed
- [ ] Auth flow checked if auth-related code changed
- [ ] AI flow checked if AI-related code changed
- [ ] Mobile/sidebar flow checked if layout or navigation changed
- [ ] Mobile release gates checked with [`docs/mobile-release-checklist.md`](../docs/mobile-release-checklist.md) if mobile layout, navigation, keyboard, modal, or performance behavior changed
- [ ] PWA/cache recovery checked if routing, chunks, or service worker behavior changed

## Notes

<!-- Screenshots, open questions, links to issues, anything else. -->
