# Security Policy

CodeHerWay is a student-facing coding education platform. We take the
security of learner accounts, progress data, and the AI tutor seriously.
This document describes the project's threat model, the controls in
place, and how to report a vulnerability.

## Reporting a Vulnerability

If you believe you've found a security issue, **please do not open a
public GitHub issue**. Instead, email the maintainer privately at the
address listed on the profile page of
[@itcodegirl](https://github.com/itcodegirl), or open a
[private security advisory](https://github.com/itcodegirl/codeherway-platform/security/advisories/new)
on this repository.

Please include:

- A description of the issue and the impact you believe it has.
- Steps to reproduce, or a proof-of-concept.
- Any suggested remediation.

We aim to acknowledge reports within 72 hours and to ship a fix for
confirmed high-severity issues within 14 days. Reporters who follow
coordinated disclosure will be credited in the release notes (unless
they prefer to remain anonymous).

## Supported Versions

Only the `main` branch deployed to production is supported. Older
commits and forks are out of scope.

## Threat Model

| Asset | Threats | Mitigations |
| --- | --- | --- |
| Learner accounts | Account takeover via XSS, session theft, OAuth redirect hijack | HTML-escaping in all `dangerouslySetInnerHTML` sinks, strict CSP, short-lived Supabase sessions, Supabase URL allowlist for OAuth |
| Learner data (progress, notes) | Cross-tenant read/write | Row-Level Security on every Supabase table (`auth.uid() = user_id`) |
| OpenAI API key | Exfiltration, free LLM abuse | Key is server-only, never shipped to the browser; Netlify Function gateway requires a valid Supabase session, applies per-user rate limiting, caps payload size, and prepends a mandatory server-side guardrail prompt |
| Admin surface | Privilege escalation | Admin flag stored in `profiles.is_admin`; enforced by RLS `is_admin()` function, not by the client; admin UI is a convenience layer, not a security boundary. Direct UPDATEs to `is_admin` are blocked by a Postgres trigger; promotions must go through the `set_user_admin()` SECURITY DEFINER RPC, which refuses self-edits and writes to `admin_audit_log` |
| Learner code playground | Escape from the code sandbox to the parent origin | `<iframe sandbox="allow-scripts">` with **no** `allow-same-origin`, so learner code cannot read the parent origin, cookies, or `localStorage` |
| Build pipeline | Malicious dependencies, supply-chain compromise | `package-lock.json` is committed; `npm audit` runs in CI; dependency updates go through PR review |

## Controls Summary

### Client-side

- All markdown/HTML sinks (`src/utils/markdown.jsx`,
  `src/components/panels/SearchPanel.jsx`) escape input **before** any
  string substitution, so user-supplied content cannot inject script or
  event handlers.
- DOMPurify is pinned via `package.json` `overrides`.
- The code-preview iframe uses `sandbox="allow-scripts"` only. Adding
  `allow-same-origin` to that iframe would be a breaking security
  change and must be reviewed.

### Transport & headers

Configured in `netlify.toml`:

- `Content-Security-Policy` — `default-src 'self'` with an explicit
  allowlist for Supabase, Google Fonts, and the Monaco editor's
  wasm-eval requirement. `frame-ancestors 'none'`.
- `Strict-Transport-Security` — 2-year HSTS with `includeSubDomains`
  and `preload`.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` disables camera, microphone, and geolocation.
- `Cross-Origin-Opener-Policy: same-origin` and
  `Cross-Origin-Resource-Policy: same-origin` to isolate the app from
  cross-origin windows.

### Authentication & authorization

- Authentication is handled by Supabase Auth (email/password, GitHub,
  Google OAuth).
- Session tokens are stored in `localStorage` by the Supabase client.
  The CSP + XSS fixes above are what keep those tokens safe.
- All row access is gated by Supabase RLS. Admin reads are gated by a
  `SECURITY DEFINER` SQL function (`is_admin()`) that reads from
  `profiles.is_admin`.

### AI proxy (`netlify/functions/ai.js`)

- Requires a valid Supabase bearer token (verified against
  `/auth/v1/user`).
- **Persistent per-user rate limit** enforced in Postgres via the
  `public.consume_ai_quota()` SECURITY DEFINER RPC. The RPC reads
  `auth.uid()` server-side so callers cannot spoof another user, and
  the limits (10 req / 60 s) are hardcoded inside the function so an
  authenticated caller cannot pass a higher cap. The function fails
  closed: if the rate-limit RPC is unreachable, the request is
  rejected with 503 rather than forwarded to OpenAI.
- A second, in-memory limit on the hot Netlify instance acts as
  defense-in-depth.
- Strict payload caps: system prompt ≤ 2000 chars, ≤ 20 messages,
  ≤ 4000 chars per message, ≤ 12000 chars total, ≤ 1024 output tokens.
- Mandatory server-side guardrail prefix prepended to every request so
  the endpoint cannot be repurposed as a general-purpose LLM under the
  CodeHerWay brand.
- Role whitelist (`user` | `assistant`) for messages.

### Practice card generator (`netlify/functions/practice-generate.js`)

- Same auth + rate-limit + fail-closed posture as the AI proxy.
- The `system` prompt is **pinned server-side** — the client only
  sends `{ topic, concept }`. The topic is checked against a small
  allowlist (`html`, `css`, `js`, `react`, `python`) and the concept
  is capped at 200 chars.
- Model output is parsed, code-fence-stripped, and validated against a
  strict schema (`question` / `code?` / `options[4]` / `correct 0..3`
  / `explanation`) before it leaves the function. Invalid shapes
  return 502 rather than forwarding a malformed card to the client.

### Public profile pages (`#u/:handle`)

- Opt-in only. `profiles.is_public` defaults to `false`.
- Public data is exposed through a `public_profiles` VIEW that
  projects only: display name, avatar URL, handle, total XP, streak,
  lessons completed count, and badges earned count. No email, no
  per-lesson progress, no bookmarks, no notes.
- The base-table RLS policies gating anon reads all require
  `profiles.is_public = true AND is_disabled = false`, so disabled
  accounts disappear from the public view immediately.
- Handles are validated client- and server-side (2–30 chars,
  `[A-Za-z0-9_-]`). Unique constraint on `public_handle` prevents
  squatting collisions.
- Updates to `is_public` / `public_handle` still go through the
  existing "Users manage own profiles" RLS policy (`auth.uid() = id`),
  so users cannot flip another user's visibility.

### Scheduled jobs

- `netlify/functions/streak-reminder.js` only runs on the Netlify
  schedule or when invoked with a `x-webhook-secret` header matching
  `STREAK_REMINDER_SECRET`. It does not log user emails or display
  names.

### Supply chain

- `package-lock.json` is committed.
- A GitHub Actions workflow (`.github/workflows/security-audit.yml`)
  runs `npm audit --audit-level=high` on every push and pull request.
- Dependabot is recommended (see the dependabot config file).

## Out of Scope

- Self-XSS against your own account via the browser console.
- Findings that require a rooted device or a malicious browser
  extension.
- Denial of service via brute-force traffic (Netlify + Supabase handle
  this at the edge).
- Missing headers that are already present in a different form (e.g.
  `X-XSS-Protection`, which is deprecated and replaced by CSP).
