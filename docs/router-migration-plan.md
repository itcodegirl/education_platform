# Router migration plan (no behavior change today)

This project currently uses a lightweight path abstraction with manual `history.pushState` and `popstate` listeners.

The goal of this plan is to migrate to a full router incrementally, without breaking current deep links or legacy hash links.

## Current baseline

- Route contracts are now centralized in [`src/routes/routePaths.js`](../src/routes/routePaths.js).
- Legacy hash links (`#admin`, `#profile`, `#styleguide`, `#learn/...`, `#u/...`) are normalized to pathname routes.
- Navigation still uses existing behavior and guards.

## Migration phases

1. Introduce router provider in compatibility mode
- Add React Router and wrap the app shell with a browser router.
- Keep current route helpers as the canonical path contract during transition.

2. Move static routes first
- Migrate `/admin`, `/profile`, `/styleguide`, and `/u/:handle` to router route objects.
- Keep close/back behavior parity with current `closeRouteOrGoHome`.

3. Migrate learn route
- Move `/learn/:courseId/:moduleId/:lessonId` into router params.
- Keep existing `useNavigation` state model while replacing manual path parsing with `useParams` and `useNavigate`.

4. Remove legacy listeners
- Delete direct `popstate` and `hashchange` listeners once route parity tests pass.
- Keep one hash-normalization guard for old external links during one release window.

5. Clean-up release
- Remove fallback hash conversion only after telemetry confirms negligible hash usage.
- Keep a changelog note documenting deprecation.

## Verification checklist

- Deep links open correct course/module/lesson.
- Browser back/forward works in lesson flow and modal exits.
- Admin route still fails closed for non-admin users.
- Public profile links remain shareable.
- Existing e2e auth + lesson-flow tests pass unchanged.

