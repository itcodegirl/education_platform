# Accessibility Color Contrast Coverage Note

Unit `vitest-axe` checks still disable the `color-contrast` rule in these files:

- `src/components/auth/AuthPage.a11y.test.jsx`
- `src/components/layout/Sidebar.a11y.test.jsx`

Reason: JSDOM does not compute rendered contrast reliably enough for those unit checks to be authoritative.

Real-browser axe coverage is the source of truth for contrast in this repo:

- `tests/e2e/accessibility.smoke.spec.js`
- `tests/e2e/authenticated.accessibility.spec.js`

## TODO

When palette or typography tokens change, re-check these areas in the browser-based accessibility suite and during visual QA:

- Auth page card text, helper copy, and primary auth buttons
- Sidebar tabs, context strip, module buttons, and lesson rows
- Bottom toolbar icon buttons and notification badges

