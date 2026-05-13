# Authenticated Performance Evidence

Last updated: May 12, 2026

Use this runbook when a PR changes signed-in learner flows, mobile lesson behavior, panels, search, progress, challenge/editor loading, exports, or Supabase-backed sync.

## Scope

Authenticated evidence should cover the surfaces where real learners spend time:

- Lesson workspace at `/learn`
- Lesson navigation and completion
- Progress panel and learning transcript
- Search panel and mobile tools sheet
- Challenge/editor open path
- PDF/export interaction path
- Authenticated mobile learning smoke path

## Capture Preconditions

- Use staging or a local Supabase E2E stack with test-only learner credentials.
- Read credentials from `.env.e2e` or CI secrets; never commit learner secrets or generated storage state.
- Run `npm run audit:performance` first so bundle and route-boundary issues are already known.
- Run `npm run test:e2e:smoke:authenticated` and `npm run test:e2e:smoke:mobile` when credentials are available.
- If credentials are unavailable, record that the authenticated smoke tests self-skipped instead of claiming authenticated evidence.

## Required Traces

| Flow | Device | Evidence to capture | What to check |
| --- | --- | --- | --- |
| Open `/learn` after sign-in | Desktop | Playwright trace or Chrome Performance recording | Initial learner shell responsiveness, route chunk loading, duplicate Supabase-client warnings. |
| Switch lessons and complete one lesson | Desktop | Playwright trace or React Profiler notes | Avoid repeated full-shell renders and duplicated completion writes. |
| Open progress panel | Desktop | React Profiler notes | Progress calculations complete without visible jank or repeated panel remounts. |
| Open challenge/editor | Desktop | Network and Performance recording | Monaco loads only after intent and does not preload into the public entry. |
| Open search and mobile tools | Mobile Chrome | Playwright trace plus screenshot/video on failure | Controls stay reachable, scroll remains contained, and fixed chrome does not overlap text entry. |
| Trigger export path | Desktop | Network and Performance recording | `jspdf` and `html2canvas` load only after export intent. |

## Pass Criteria

- No new initial-entry preload for Monaco, Supabase, `jspdf`, `html2canvas`, or protected app styles.
- No uncaught console errors during the authenticated trace.
- No duplicate Supabase browser-client warning.
- Lesson switching, panel opening, search, and mobile tools remain responsive enough to use without visible blocking.
- Mobile controls remain at least 44px tall and visible above fixed navigation or the on-screen keyboard.
- Any long task, memory growth, or repeated full-shell render is documented with a follow-up issue or PR note.

## Evidence Template

| Date | Commit | Flow | Device | Commands | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| TBD | TBD | `/learn` sign-in smoke | Desktop | `npm run test:e2e:smoke:authenticated` | Add Playwright report, trace, or CI artifact. | Record pass, skip reason, or follow-up. |
| TBD | TBD | Mobile learner smoke | Mobile Chrome | `npm run test:e2e:smoke:mobile` | Add Playwright report, trace, or CI artifact. | Record overlap, scroll, or responsiveness notes. |

## Reviewer Note

Public Lighthouse scores are not enough for learner-workspace performance claims. Use this runbook to attach authenticated traces, profiler notes, or an honest skip reason before describing signed-in performance as verified.
