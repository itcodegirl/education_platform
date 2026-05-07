# UX Trust and Calmness Notes

This note records the learner-trust decisions behind the current UX pass.

## Progress and Sync

- Lesson progress, bookmarks, notes, XP, and streaks surface visible save/sync status in the lesson flow.
- Same-browser retry is supported for recoverable failed writes. The UI should not imply universal cloud recovery for every failed route action.
- Challenge completion history is still same-browser CodeHerWay progress until a backend-backed challenge completion model is added.

## Rewards and Exports

- XP, streaks, and badges are motivational product signals, not external credentials.
- Course completion downloads are learner progress exports. They should not be described as verified certificates or third-party accreditation.
- Backend reward sync remains feature-gated until Supabase migrations and authenticated duplicate-award validation are verified in a real project.

## Mobile Learning

- The sticky mobile lesson nav remains the primary small-screen path for Previous, Complete lesson, Tools, and Next.
- Search stays reachable from the mobile topbar without opening the full course drawer.
- The mobile tools sheet opens the existing panels instead of introducing a second tool system.

## Remaining UX Risks

- Authenticated mobile Playwright coverage self-skips without Supabase and learner credentials.
- The GitHub repository name still differs from the CodeHerWay product name; changing that safely requires repository-level workflow support.
