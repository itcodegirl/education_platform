# Release Notes Template

Use this template for Netlify deploys, portfolio-ready tags, or PRs that change learner trust, progress, rewards, routing, performance, or Supabase behavior.

## Summary

- Release:
- Date:
- Commit SHA:
- Deploy URL:
- Owner:

## Learner Impact

- What changed for learners:
- What becomes clearer, safer, or faster:
- Any behavior that may surprise returning learners:

## Product Trust Notes

- Progress persistence status:
- Reward/XP/streak trust boundary:
- Certificate or progress-summary wording:
- Authenticated E2E status:
- Supabase migration status:

## Checks Run

- `npm run build`:
- `npm run test`:
- `npm run lint`:
- `npm run typecheck`:
- `npm run audit:performance`:
- `npm run test:e2e` or scoped Playwright run:
- Lighthouse artifact:

## Evidence Links

- PR:
- Netlify deploy:
- Playwright artifact:
- Lighthouse artifact:
- Supabase staging validation ticket:

## Known Limits

- Missing credentials or secrets:
- Skipped tests:
- Local-only behavior:
- Deferred production hardening:

## Rollback Plan

- Last known stable SHA:
- Rollback command or Netlify deploy:
- Data/migration rollback required:
- User-facing note if rollback happens:
