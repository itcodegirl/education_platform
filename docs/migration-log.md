# Migration Log

Tracks the approved consolidation work for the canonical
`education_platform` repo.

## Step 1

- Verified authoritative repo: `C:\Users\Jenna\OneDrive\education_platform\education_platform`
- Dedicated migration branch: `codex/codeherway-consolidation`
- Scope locked to approved rewrite paths, reference-only paths, and ignore list
- No application code rewritten in this step
- No rename, archive, or deployment-setting changes in this step

## Step 2

- Added `src/types/learning.ts`
- Rewrote the learning-domain model from scratch instead of copying
  the source repo's older shared-types file
- Separated course, module, lesson, quiz, badge, and spaced-
  repetition shapes from the existing Supabase row / DTO types
- Kept localStorage logic out of the new type layer

## Step 3

- Added `src/routes/guards/GuardScreen.jsx`
- Added `src/routes/guards/ProtectedRoute.jsx`
- Added `src/routes/guards/PublicOnlyRoute.jsx`
- Added `src/routes/guards/AdminRoute.jsx`
- Rebuilt route guards using the real `useAuth()` contract,
  `profile.is_admin`, and `profile.is_disabled`
- Did not introduce mocked auth logic

## Step 4

- Added `src/routes/routeState.js`
- Added `src/routes/PublicRoutes.jsx`
- Added `src/routes/AppRouteBranch.jsx`
- Added `src/routes/AdminRouteBranch.jsx`
- Updated `src/routes/AppRoutes.jsx`
- Split route responsibilities into public, authenticated app, and
  admin branches while keeping the stronger existing hash-based
  routing behavior

## Step 5

- Added `src/layouts/PublicLayout.jsx`
- Added `src/layouts/AdminLayout.jsx`
- Integrated those shells into `src/routes/PublicRoutes.jsx` and
  `src/routes/AdminRouteBranch.jsx`
- Preserved the existing `AppLayout` as the mature authenticated app
  shell instead of replacing it with scaffold-level structure

## Step 6

- Updated `docs/architecture.md` with approved reference-only notes
  for route architecture, layout boundaries, page inventory, UI
  inventory, and styling guidance
- Performed a consolidation review against the approved rewrite,
  reference-only, and ignore lists

## Approved Rewrite Queue

- `codeherway-platform/src/utils/types.ts` -> `src/types/learning.ts`
- `codeherway-education-platform/src/routes/router.jsx` -> `src/routes/`
- `codeherway-education-platform/src/routes/protectedRoute.jsx` -> `src/routes/guards/`
- `codeherway-education-platform/src/routes/publicOnlyRoute.jsx` -> `src/routes/guards/`
- `codeherway-education-platform/src/routes/adminRoute.jsx` -> `src/routes/guards/`
- `codeherway-education-platform/src/layouts/publicLayout.jsx` -> `src/layouts/`
- `codeherway-education-platform/src/layouts/appLayout.jsx` -> `src/layouts/`
- `codeherway-education-platform/src/layouts/adminLayout.jsx` -> `src/layouts/`

## Reference-Only Queue

- `codeherway-platform/src/components/ui/` -> `docs/architecture.md`
- `codeherway-platform/components.json` -> `docs/architecture.md`
- `codeherway-platform/src/App.css` -> ideas only for `src/styles/sidebar.css` and `src/styles/lessons.css`
- `codeherway-education-platform/src/pages/public/landingPage.jsx` -> `docs/architecture.md`
- `codeherway-education-platform/src/pages/public/loginPage.jsx` -> `docs/architecture.md`
- `codeherway-education-platform/src/pages/public/signupPage.jsx` -> `docs/architecture.md`
- `codeherway-education-platform/src/pages/app/dashboardPage.jsx` -> `docs/architecture.md`
- `codeherway-education-platform/src/pages/app/profilePage.jsx` -> `docs/architecture.md`
- `codeherway-education-platform/src/pages/app/settingsPage.jsx` -> `docs/architecture.md`
- `codeherway-education-platform/src/pages/admin/adminPage.jsx` -> `docs/architecture.md`

## Ignore List

- `codeherway-platform/src/utils/storage.ts`
- Duplicated learning components
- Duplicated course data
- All localStorage-driven app logic
- All mocked auth logic
- All placeholder page implementations
- Any file not explicitly approved above
