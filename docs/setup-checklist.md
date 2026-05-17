# Post-deploy setup checklist

Everything in the repo builds and tests green, but a handful of
operational steps require a human with the right credentials. This
doc is a single copy-paste guide for all of them.

> **Estimated time:** ~10 minutes total if you have Supabase, Netlify,
> and GitHub tabs open.

---

## 1. Run the Supabase migration

Before touching the live project, run the static repo gate:

```bash
npm run check:supabase-readiness
```

That command verifies the required stable resume, public profile privacy,
and reward ledger migration artifacts are present in source control. It
does not prove the live Supabase project has applied them. Use
[Supabase Production Readiness](./supabase-production-readiness.md) for
the exact migration order and SQL inspection queries.

The `supabase-schema.sql` file is idempotent — you can paste the
**entire file** into the Supabase SQL Editor and hit Run.

Reward backend note: if you plan to enable
`VITE_REWARD_BACKEND_SYNC_ENABLED=true`, also run the additive files in
`supabase/migrations/` after the base schema and verify the
`reward_events` table plus `award_reward_event()` RPC before release.

If you only need the additive hardening after an existing base schema,
apply the checked-in migration files in timestamp order instead of
copying older SQL snippets from prior portfolio branches:

1. `supabase/migrations/202604250001_create_reward_events.sql`
2. `supabase/migrations/202604250002_add_award_reward_event_rpc.sql`
3. `supabase/migrations/202605060001_guard_profile_disabled_updates.sql`
4. `supabase/migrations/202605060002_guard_reward_event_idempotency.sql`
5. `supabase/migrations/202605060003_harden_profile_updates.sql`
6. `supabase/migrations/202605070001_add_stable_last_position_columns.sql`
7. `supabase/migrations/202605070002_harden_public_profile_privacy.sql`
8. `supabase/migrations/202605110001_harden_reward_event_trust_boundaries.sql`
9. `supabase/migrations/202605110002_lock_admin_user_rollups.sql`

Public profile note: use `public.public_profiles` for aggregate
portfolio snapshots. Do not add public select policies on
`public.progress`, `public.bookmarks`, `public.notes`,
`public.sr_cards`, or other learner-owned row tables.

Verify the migration:

```sql
-- Trigger installed?
select tgname from pg_trigger where tgrelid = 'public.profiles'::regclass;

-- Functions exist?
select proname from pg_proc where proname in ('consume_ai_quota', 'set_user_admin');

-- Stable resume columns exist?
select course_id, module_id, lesson_id, is_module_quiz
from public.last_position
limit 1;

-- Public aggregate view exists?
select * from public.public_profiles limit 1;

-- Raw progress rows are not granted to anon?
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'progress'
  and grantee = 'anon';
```

---

## 2. Set Netlify environment variables

Netlify dashboard → **Site settings → Environment variables** → add:

| Name | Value | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | your OpenAI key | Required for AI tutor + practice generator |
| `OPENAI_MODEL` | `gpt-4o-mini` | Optional, defaults to this |
| `SUPABASE_URL` | your project URL | Same value as `VITE_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | your anon key | Same value as `VITE_SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_KEY` | your service role key | **Bypasses RLS — treat as password.** Required by `streak-reminder`. |
| `STREAK_REMINDER_SECRET` | **generate a new random string** | See below. Required to manually POST to the streak-reminder function. |

**Generate `STREAK_REMINDER_SECRET`:**

```bash
# macOS / Linux — built in
openssl rand -base64 48

# Node.js — alternative
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Copy the output and paste it as the value of `STREAK_REMINDER_SECRET`.
Do not commit this value.

---

## 3. Repo settings on GitHub

Go to **Settings** on the GitHub repo and fill in:

### Repository description

> Free, browser-based, self-paced coding course for women learning web development by building real projects. React + Vite + Supabase + a server-side AI tutor. Portfolio/demo posture, not production credentialing.

### Repository topics

```
react  vite  supabase  education  coding-course  women-in-tech
pwa    javascript  netlify-functions  ai-tutor  openai  monaco-editor
education-platform  security-hardened
```

### Social preview image

Upload `public/og-image.svg` (or a 1280×640 PNG render of it) under
**Settings → General → Social preview**.

### Branch protection (recommended)

**Settings → Branches → Branch protection rules → Add rule** for
`main`:

- ☑ Require a pull request before merging
- ☑ Require status checks to pass before merging
  - Required checks: `ci-smoke`, `security-audit`
- ☑ Require conversation resolution before merging
- ☑ Require signed commits *(optional, strong signal)*
- ☐ Do not allow bypassing the above settings

### Security features

**Settings → Code security and analysis:**

- ☑ Dependabot alerts
- ☑ Dependabot security updates
- ☑ Secret scanning
- ☑ Push protection *(blocks accidental secret commits at push time)*
- ☑ Private vulnerability reporting

---

## 4. Supabase Auth — URL allowlist

**Supabase Dashboard → Authentication → URL Configuration:**

- **Site URL:** your production Netlify URL (e.g., `https://codeherway.com`)
- **Redirect URLs:**
  - `https://codeherway.com/**` (production)
  - `http://localhost:5173/**` (local dev)

Why: the OAuth flow uses `window.location.origin` as the redirect
target. Pinning the allowlist stops an attacker from hijacking the
code exchange via a proxy or a subdomain typo.

---

## 5. Make yourself the first admin

Run this once in the Supabase SQL Editor (the `postgres` role
bypasses the `is_admin` escalation trigger, so this is the only way
to bootstrap):

```sql
-- Find your UUID:
select id, email from auth.users where email = 'you@example.com';

-- Promote yourself:
update public.profiles
set is_admin = true
where id = 'YOUR-UUID-HERE';
```

After this, every subsequent admin change **must** go through
`public.set_user_admin(target_id, true)`, which refuses self-edits.

---

## 6. Cosmetic nice-to-haves

| Item | Where | Why |
| --- | --- | --- |
| Pin the repo on your GitHub profile | GitHub profile → pinned repositories | Shows up first on your profile |
| Add a screenshot | `docs/screenshot.png` + uncomment the slot in `README.md` | Biggest first-impression upgrade |
| Add a Lighthouse screenshot | `docs/lighthouse.png` + reference in README | Proof of performance |
| Buy a custom domain | DNS + `netlify.toml` redirects | Drops the auto-Netlify subdomain tell |
| Record a 90-second Loom | Link in the README | Recruiters love walkthroughs |

---

## 7. Health check — does it all work?

Once all of the above is done, in order:

```bash
# 1. Build + tests
npm ci
npm run build
npm run typecheck
npm run audit:curriculum-coverage
npm test
npm audit --audit-level=high

# 2. Try the live site
open https://codeherway.com/
# expected: landing hero loads, auth card scrolls into view

# 3. Try the design system
open https://codeherway.com/styleguide
# expected: full token preview, no login required

# 4. Try an invalid public profile
open https://codeherway.com/u/nobody
# expected: "Profile not found" card

# 5. Sign up, opt in to public profile, share the link
# expected: visiting /u/your-handle in an incognito window works

# 6. Check the AI function returns 401 with no auth
curl -i -X POST https://codeherway.com/.netlify/functions/ai \
  -H "Content-Type: application/json" -d '{}'
# expected: HTTP/1.1 401 Unauthorized + {"error":"Authentication required"}

# 7. Verify CSP is live
curl -sI https://codeherway.com/ | grep -i content-security-policy
# expected: a single CSP header with no fonts.googleapis.com

# 8. Verify Netlify app shell, service worker, and cache headers
npm run check:production-deploy -- --url https://codeherway.com/
# expected: all checks pass, including current /sw.js version and immutable /assets/*
```

If any of the above fails, check the Netlify deploy log and the
Supabase logs first — 90% of the time it's an unset env var or a
migration that hasn't been run yet.

For service-worker-specific release checks, use
[Netlify Production Verification](./netlify-production-verification.md).


