## Summary

<!-- 1–2 sentences. What does this PR do and why? -->

## What changed

<!-- Bullet list of the user-visible and engineer-visible changes. -->

-

## Verification

- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] `npm audit --audit-level=high` — no new findings
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

## Security checklist

- [ ] No secrets committed (`.env`, API keys, service role keys)
- [ ] No new `dangerouslySetInnerHTML` sinks with unescaped input
- [ ] Any new API route requires a valid Supabase session
- [ ] Any new user-generated content is HTML-escaped before render
- [ ] Any new Supabase table has RLS enabled + appropriate policies
- [ ] Any new third-party script / font / image origin is reflected
      in `netlify.toml` CSP

## Release Checklist

Use [`RELEASE_CHECKLIST.md`](../RELEASE_CHECKLIST.md) for final deploy validation.

- [ ] Netlify deploy reviewed
- [ ] Auth flow checked if auth-related code changed
- [ ] AI flow checked if AI-related code changed
- [ ] Mobile/sidebar flow checked if layout or navigation changed
- [ ] PWA/cache recovery checked if routing, chunks, or service worker behavior changed

## Notes

<!-- Screenshots, open questions, links to issues, anything else. -->
