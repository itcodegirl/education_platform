---
name: Authenticated E2E Secrets
about: Track GitHub Actions secret setup for signed-in learner smoke coverage
title: "Authenticated E2E secrets: "
labels: ["testing", "ci", "auth"]
assignees: []
---

## Goal

Enable signed-in learner Playwright coverage in CI without exposing credentials in source or logs.

## Required Secrets

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `E2E_EMAIL`
- [ ] `E2E_PASSWORD`

## Dedicated Test Learner

- [ ] Uses a dedicated learner account, not a real learner.
- [ ] Learner profile is enabled.
- [ ] Learner can reach the authenticated app shell.
- [ ] Test data is safe to reset.

## Validation

- [ ] `npm run test:e2e:auth:preflight` passes in CI.
- [ ] `npm run test:e2e:smoke:authenticated` passes in CI.
- [ ] Authenticated mobile smoke is not skipped when secrets are present.
- [ ] Failed runs upload Playwright artifacts.

## Notes

Reference: [`docs/authenticated-e2e-ci.md`](../../docs/authenticated-e2e-ci.md)
