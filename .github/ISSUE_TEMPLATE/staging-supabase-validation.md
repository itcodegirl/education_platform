---
name: Staging Supabase Validation
about: Track live Supabase validation before enabling production reward or cross-device trust claims
title: "Staging Supabase validation: "
labels: ["supabase", "release", "trust"]
assignees: []
---

## Goal

Validate authenticated Supabase behavior in staging before enabling production-grade reward sync or cross-device claims.

## Required Access

- [ ] Staging Supabase URL available.
- [ ] Staging anon key available.
- [ ] Dedicated test learner exists.
- [ ] SQL editor or CLI access available.
- [ ] Netlify or preview deploy points to staging values.

## Migration Readiness

- [ ] `supabase-schema.sql` applied.
- [ ] Additive migrations in `supabase/migrations/` applied.
- [ ] `npm run check:supabase-readiness` passes.
- [ ] `VITE_REWARD_BACKEND_SYNC_ENABLED=true` only in staging during validation.

## Browser Validation

- [ ] Lesson completion persists after reload.
- [ ] Duplicate reward does not inflate XP.
- [ ] Quiz reward is awarded once per stable event key.
- [ ] Offline/online replay awards queued events once.
- [ ] Account switching does not leak learner state.

## SQL Validation

- [ ] Reward event idempotency query returns zero duplicates.
- [ ] RPC derives ownership from `auth.uid()`.
- [ ] RLS blocks another learner's protected rows.
- [ ] Rollback plan is documented.

## Decision

- [ ] Keep staging only.
- [ ] Enable beyond staging.
- [ ] Block release.

Reference: [`docs/staging-supabase-validation.md`](../../docs/staging-supabase-validation.md)
