# Style Architecture Guide

This project uses a layered CSS approach to keep styling maintainable without introducing a CSS framework.

## Import order (single source of truth)

All style imports flow through [`src/styles/App.css`](../src/styles/App.css). Keep this order stable:

1. `tokens.css` — design tokens (colors, spacing, radii, typography)
2. `base.css` — resets and base element styles
3. `animations.css` — shared motion primitives
4. Feature modules (`auth.css`, `sidebar.css`, `lessons.css`, `panels.css`, `landing.css`, `responsive.css`)
5. Domain modules extracted from the legacy monolith:
   - `shell-layout.css`
   - `learning-experience.css`
   - `feature-surfaces.css`
   - `platform-quality.css`

## Domain module boundaries

- `shell-layout.css`
  - app shell, topbar, navigation row, theme variants, global layout helpers
- `learning-experience.css`
  - lesson flow, XP/progress surfaces, guest preview, roadmap, onboarding completion states
- `feature-surfaces.css`
  - AI tutor panel, code preview/challenge UI, admin dashboard panels, interaction-heavy components
- `platform-quality.css`
  - error/skeleton states, performance and platform-specific fixes, resilience states, accessibility hardening

## Contribution rules

- Prefer editing the smallest relevant module instead of adding styles to multiple files.
- Keep selectors local to the owning surface; avoid broad overrides.
- Add new tokens in `tokens.css` before introducing one-off values.
- If a new section needs many related styles, add them to the right domain file and include a section comment header.
- Run `npm run check:quality` after style changes to ensure build integrity.

## Legacy shorthand class map (for maintainability)

Some legacy selectors still use compact class names. When touching these
areas, prefer semantic aliases first and only then remove shorthand usage.

- `lp` -> `lesson-paragraph`
- `qq` -> `quiz-question`
- `qq-opt` -> `quiz-option`
- `module-group` (`mg` in older notes) -> `module-group`
- `lesson-list` / `lesson-list-btn` (`lg` in older notes) -> `lesson-list` / `lesson-list-button`
- `code-preview` (`cpv` in older notes) -> `code-preview`
- `sidebar` (`sb` in older notes) -> `sidebar`

Rule of thumb: new selectors must be readable at first glance, and any
remaining shorthand should be documented here before further expansion.
