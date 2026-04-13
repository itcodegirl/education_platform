# Post-deploy setup checklist

Everything in the repo builds and tests green, but a handful of
operational steps require a human with the right credentials. This
doc is a single copy-paste guide for all of them.

> **Estimated time:** ~10 minutes total if you have Supabase, Netlify,
> and GitHub tabs open.

---

## 1. Run the Supabase migration

The `supabase-schema.sql` file is idempotent — you can paste the
**entire file** into the Supabase SQL Editor and hit Run. Or, if you
only want the additions that landed during the portfolio-polish
branch, here's the minimal delta you need to apply:

```sql
-- ═══════════════════════════════════════════════
-- PORTFOLIO-POLISH MIGRATION DELTA
-- Safe to re-run. Installs:
--   - ai_rate_limits table + consume_ai_quota() RPC
--   - admin_audit_log + escalation guard + set_user_admin() RPC
--   - public profile opt-in (is_public, public_handle, view, policies)
-- ═══════════════════════════════════════════════

-- ── AI rate limit ────────────────────────────
create table if not exists public.ai_rate_limits (
  user_id uuid references auth.users on delete cascade primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);
alter table public.ai_rate_limits enable row level security;

create or replace function public.consume_ai_quota()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_max constant integer := 10;
  v_window constant integer := 60;
  v_now timestamptz := now();
  v_count integer;
begin
  if v_user is null then return false; end if;
  insert into public.ai_rate_limits (user_id, window_start, count)
  values (v_user, v_now, 1)
  on conflict (user_id) do update
    set window_start = case
          when public.ai_rate_limits.window_start < v_now - make_interval(secs => v_window)
            then v_now
          else public.ai_rate_limits.window_start
        end,
        count = case
          when public.ai_rate_limits.window_start < v_now - make_interval(secs => v_window)
            then 1
          else public.ai_rate_limits.count + 1
        end
  returning count into v_count;
  return v_count <= v_max;
end;
$$;
revoke all on function public.consume_ai_quota() from public;
grant execute on function public.consume_ai_quota() to authenticated;

-- ── Admin escalation guard ───────────────────
create table if not exists public.admin_audit_log (
  id uuid default gen_random_uuid() primary key,
  actor_id uuid not null,
  target_id uuid not null,
  action text not null,
  details jsonb,
  created_at timestamptz default now()
);
alter table public.admin_audit_log enable row level security;
drop policy if exists "Admins read audit log" on public.admin_audit_log;
create policy "Admins read audit log" on public.admin_audit_log
  for select using (is_admin());

create or replace function public.guard_profile_admin_changes()
returns trigger language plpgsql as $$
begin
  if new.is_admin is distinct from old.is_admin then
    if coalesce(current_setting('app.bypass_admin_guard', true), 'false') = 'true' then
      return new;
    end if;
    if current_user in ('postgres', 'supabase_admin') then
      return new;
    end if;
    raise exception 'is_admin can only be changed via public.set_user_admin()';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_guard_profile_admin_changes on public.profiles;
create trigger trg_guard_profile_admin_changes
  before update of is_admin on public.profiles
  for each row execute function public.guard_profile_admin_changes();

create or replace function public.set_user_admin(target_user_id uuid, make_admin boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_caller uuid := auth.uid();
begin
  if v_caller is null then raise exception 'Authentication required'; end if;
  if not public.is_admin() then raise exception 'Admin privileges required'; end if;
  if v_caller = target_user_id then
    raise exception 'Admins cannot change their own is_admin flag';
  end if;
  perform set_config('app.bypass_admin_guard', 'true', true);
  update public.profiles set is_admin = make_admin where id = target_user_id;
  perform set_config('app.bypass_admin_guard', 'false', true);
  insert into public.admin_audit_log (actor_id, target_id, action, details)
  values (v_caller, target_user_id,
    case when make_admin then 'grant_admin' else 'revoke_admin' end,
    jsonb_build_object('make_admin', make_admin));
end;
$$;
revoke all on function public.set_user_admin(uuid, boolean) from public;
grant execute on function public.set_user_admin(uuid, boolean) to authenticated;

-- ── Public profile opt-in ────────────────────
alter table public.profiles
  add column if not exists is_public boolean default false;
alter table public.profiles
  add column if not exists public_handle text unique;

create index if not exists idx_profiles_public_handle_lower
  on public.profiles (lower(public_handle))
  where is_public = true;

create or replace view public.public_profiles as
select
  p.id, p.display_name, p.avatar_url, p.public_handle as handle,
  coalesce(x.total, 0)    as xp_total,
  coalesce(s.days, 0)     as streak_days,
  coalesce(lc.n, 0)       as lessons_completed,
  coalesce(bc.n, 0)       as badges_earned
from public.profiles p
left join public.xp x on x.user_id = p.id
left join public.streaks s on s.user_id = p.id
left join (select user_id, count(*)::int n from public.progress group by user_id) lc on lc.user_id = p.id
left join (select user_id, count(*)::int n from public.badges group by user_id) bc on bc.user_id = p.id
where p.is_public = true and coalesce(p.is_disabled, false) = false;

grant select on public.public_profiles to anon, authenticated;

drop policy if exists "Public profiles readable by anyone" on public.profiles;
create policy "Public profiles readable by anyone" on public.profiles
  for select using (is_public = true and coalesce(is_disabled, false) = false);

drop policy if exists "Public xp readable" on public.xp;
create policy "Public xp readable" on public.xp for select using (
  exists (select 1 from public.profiles
    where profiles.id = xp.user_id
      and profiles.is_public = true
      and coalesce(profiles.is_disabled, false) = false));

drop policy if exists "Public streaks readable" on public.streaks;
create policy "Public streaks readable" on public.streaks for select using (
  exists (select 1 from public.profiles
    where profiles.id = streaks.user_id
      and profiles.is_public = true
      and coalesce(profiles.is_disabled, false) = false));

drop policy if exists "Public progress count readable" on public.progress;
create policy "Public progress count readable" on public.progress for select using (
  exists (select 1 from public.profiles
    where profiles.id = progress.user_id
      and profiles.is_public = true
      and coalesce(profiles.is_disabled, false) = false));

drop policy if exists "Public badges count readable" on public.badges;
create policy "Public badges count readable" on public.badges for select using (
  exists (select 1 from public.profiles
    where profiles.id = badges.user_id
      and profiles.is_public = true
      and coalesce(profiles.is_disabled, false) = false));
```

Verify the migration:

```sql
-- Trigger installed?
select tgname from pg_trigger where tgrelid = 'public.profiles'::regclass;

-- Functions exist?
select proname from pg_proc where proname in ('consume_ai_quota', 'set_user_admin');

-- Public view exists?
select * from public.public_profiles limit 1;
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

> Free, browser-based coding bootcamp for women learning to ship. React + Vite + Supabase + a server-side AI tutor.

### Repository topics

```
react  vite  supabase  education  coding-bootcamp  women-in-tech
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
npm test
npm audit --audit-level=high

# 2. Try the live site
open https://mellow-sunflower-9c92cd.netlify.app/
# expected: landing hero loads, auth card scrolls into view

# 3. Try the design system
open https://mellow-sunflower-9c92cd.netlify.app/#styleguide
# expected: full token preview, no login required

# 4. Try an invalid public profile
open https://mellow-sunflower-9c92cd.netlify.app/#u/nobody
# expected: "Profile not found" card

# 5. Sign up, opt in to public profile, share the link
# expected: visiting /#u/your-handle in an incognito window works

# 6. Check the AI function returns 401 with no auth
curl -i -X POST https://mellow-sunflower-9c92cd.netlify.app/.netlify/functions/ai \
  -H "Content-Type: application/json" -d '{}'
# expected: HTTP/1.1 401 Unauthorized + {"error":"Authentication required"}

# 7. Verify CSP is live
curl -sI https://mellow-sunflower-9c92cd.netlify.app/ | grep -i content-security-policy
# expected: a single CSP header with no fonts.googleapis.com
```

If any of the above fails, check the Netlify deploy log and the
Supabase logs first — 90% of the time it's an unset env var or a
migration that hasn't been run yet.
