# CodeHerWay — Mobile UX Audit

Scope: mobile/touch experience for the canonical product (`itcodegirl/education_platform`,
`main`). Reviewed the public funnel (landing → guest preview → auth), the authenticated
learning shell (lesson view, sticky navigation, pagination), the learner tool surfaces
(notes, bookmarks, review queue, search, cheatsheet, glossary, mobile tools sheet), the
challenge workspace + code preview, the quiz view, and all dialog/modal overlays. Line
numbers below are approximate anchors against the current tree, not exact contracts.

This is an audit report only — no source files were changed.

For ongoing release validation, use
[docs/mobile-release-checklist.md](./mobile-release-checklist.md). The checklist
turns these findings into repeatable mobile QA gates for PRs that touch layout,
navigation, keyboard behavior, modals, or performance.

---

## 1. Mobile journey issues

### 1.1 Public funnel (landing → guest preview → auth)

| # | Issue | Where | Why it hurts on mobile |
|---|-------|-------|------------------------|
| P1 | The auth `<form>` is the funnel's only conversion point but it sits *below* the marketing intro on stacked layouts. The page is scrollable (good) and `scrollToAuth()` exists, but the first-paint CTA ("Start learning free" / "Create account") is far below the fold on a phone. | `src/components/auth/LandingHero.jsx`, `src/components/auth/AuthPage.jsx`, `src/styles/landing.css` (`@media (max-width: 960px)` / `768px`) | New visitors land on a tall hero, must scroll past intro copy to reach the form; the primary CTA is "hard to reach". |
| P2 | `.auth-theme-toggle` is `position: absolute; top: 14px; right: 14px;` with hard-coded offsets — no `env(safe-area-inset-*)`. | `src/styles/auth.css` (~ll. 23–31) | On notched / rounded-corner devices the toggle crowds the status bar / corner radius. |
| P3 | Auth tabs ("Sign in" / "Create account") are a 2-up flex row with no font-size or wrap handling below ~360px. | `src/styles/auth.css` (`.auth-tabs`, ~ll. 111–129) | Label text can wrap or clip on small/old phones; the row reads as "overcrowded". |
| P4 | `AuthConfirmSent` renders as a fresh `<main>` with no focus move-in; toggling `GuestPreview` ↔ `AuthPage` (`AuthLayout`) does not restore focus to the trigger. | `src/components/auth/AuthConfirmSent.jsx`, `src/layouts/AuthLayout.jsx` | Keyboard / screen-reader users lose their place after "check your email" and after closing the preview. |
| P5 | "Forgot password" success message lands in `form-status` without scrolling the form back into view. | `src/components/auth/AuthPage.jsx` (reset success branch) | On a long page the confirmation is invisible; users re-submit. |
| P6 | Social-provider SVG glyphs are 18×18 inside a 48px button — fine for the hit area, tight as a *visual* target. | `src/components/auth/AuthSocialButtons.jsx` | Minor; flagged for completeness. |

What's already solid here: inputs are `font-size: 16px` on mobile (no iOS zoom-on-focus),
`.auth-field/.auth-submit/.auth-social` carry `scroll-margin-bottom: calc(180px + env(safe-area-inset-bottom))`
so focused fields lift above the keyboard, social buttons stack vertically ≤600px, CTA row
stacks ≤768px, form errors get `aria-live` + auto-focus, the guest-preview topbar/CTA already
use safe-area insets and 44–48px targets. There are dedicated regression tests
(`authMobileKeyboard.test.js`, `guestPreviewMobile.test.js`).

### 1.2 Learning shell — sticky navigation, lesson view, scroll

| # | Issue | Where | Why it hurts on mobile |
|---|-------|-------|------------------------|
| L1 | **`viewport-fit=cover` is not set**, so `env(safe-area-inset-*)` resolves to `0` on iOS. All the safe-area math in `mobile-shell-hardening.css` / `panels.css` / `mobile-interactions.css` is effectively dead, *and* the fixed bottom `.lesson-nav` (which paints a background) can't extend under the home indicator — you get a letterbox strip or the bar floats above the gesture area. | `index.html` `<meta name="viewport">`; consumers in `src/styles/mobile-shell-hardening.css`, `src/styles/panels.css` | Either commit to `viewport-fit=cover` (and then the existing insets do real work) or the inset code is misleading. Today the bottom bar + home-indicator interaction is unhandled. |
| L2 | Sticky `.topbar` is `position: sticky; top: 0; padding: 14px 24px;` with **no `safe-area-inset-top`**. | `src/styles/shell-layout.css` (~ll. 83–92), `src/components/layout/LessonShellTopbar.jsx` | Under a Dynamic Island / notch in some browser modes the breadcrumb + hamburger sit under the cutout. |
| L3 | Lesson content has `scroll-padding-top` but the lesson surface/`.lesson-head` has no `scroll-margin-top`. Skip-link / in-page anchors land *under* the sticky topbar. | `src/styles/lessons.css` (`.lesson-surface`, `.lesson-head`), `src/styles/shell-layout.css` | Anchored navigation hides the heading the user just jumped to. |
| L4 | When the keyboard opens, `.shell.keyboard-open` collapses `.main-shell` padding-bottom from `128px` to `24px` and hides the bottom nav — a visible layout jump / scroll shift each time a textarea is focused. | `src/styles/mobile-shell-hardening.css` (~ll. 35–50), `src/hooks/useMobileKeyboardOpen.js` | Janky; can bounce the caret off-screen mid-type. |
| L5 | `.lesson-nav` (fixed bottom bar) is 5 controls — prev / done / tools / next / progress chip — in one non-wrapping `<nav>`. At ≤400px prev & tools shrink to `flex-basis: 44px` with labels visually hidden; below ~320px the five targets + gaps exceed the available width. The progress chip is absolutely positioned at `top: -26px`, which can clip on short content. | `src/components/layout/LessonNavBar.jsx`, `src/styles/panels.css` (`.lesson-nav*`), `src/styles/mobile-shell-hardening.css` | "Overcrowded controls"; the primary "Continue / Next lesson" CTA gets compressed and its label truncates on small phones. |
| L6 | `.theme-toggle` is `position: fixed; bottom: 20px; right: 18px; z-index: 220` — i.e. it floats directly above the fixed bottom nav (z-200) and overlaps the right edge of the Next button's tap zone. On ≤500px it's only 38×38. | `src/styles/shell-layout.css` (~l. 859), `src/styles/responsive.css` (~l. 92) | Easy to hit "theme" when reaching for "Next"; sub-44px target. |
| L7 | `.lesson-action-btn` (bookmark / notes toggles in the lesson header) is `min-height: 40px` and drops to `height: 36px` at ≤500px — and is **not** bumped back up by `mobile-interactions.css`. | `src/styles/lessons.css` (~ll. 313–320), `src/styles/responsive.css` (~ll. 93, 105), `src/components/learning/LessonHeader.jsx` | Two of the most-used learner actions are below the 44px touch minimum on phones. |
| L8 | Modal overlays for celebratory / interrupt surfaces (`.badge-unlock-overlay`, `.break-card`, `.welcome-card`, `.cc-overlay`/course complete, `.ob-overlay`/onboarding, `.install-prompt`) use plain pixel padding — no safe-area insets and (see §1.4) inconsistent focus/inert handling. | `src/styles/shell-layout.css`, `src/styles/learning-experience.css`, `src/styles/feature-surfaces.css`, `src/components/shared/BreakPrompt.jsx`, `src/components/shared/InstallPrompt.jsx`, `src/components/onboarding/Onboarding.jsx`, `src/components/gamification/CourseComplete.jsx` | Dismiss buttons can fall into the home-indicator strip; see focus notes below. |

What's already solid: `display: contents` trick collapses the sidebar shell ≤900px so width
math stays sane; `.main-shell` uses `overscroll-behavior: contain`; bottom nav already hides
on `keyboard-open`; skip link to `#main-content` exists; nav buttons default to `min-height: 48px`;
there's a layout-regression test suite (`mobileShellLayout.test.js`, `mobilePerformanceLayout.test.js`).

### 1.3 Learner tool surfaces — notes, bookmarks, review queue, search, mobile tools sheet, sidebar

| # | Issue | Where | Why it hurts on mobile |
|---|-------|-------|------------------------|
| T1 | **Lesson notes textarea is not keyboard-aware.** It has no `scrollIntoView` on focus, the `.notes-panel` lives inside the scrolling lesson content with no bottom padding for the keyboard, and the lesson shell doesn't reposition it. Focus the notes field near the bottom of a lesson and the keyboard covers what you're typing. | `src/components/learning/LessonNotesPanel.jsx`, `src/styles/lessons.css` (`.notes-*`) | "Input blocked by keyboard" — direct, high-frequency. |
| T2 | Review-queue (`SRPanel`) "add concept" input + Generate button + success/error text sit in a scrollable modal with no scroll-into-view; the keyboard covers the Generate button and the `aria-live` feedback. No `inputMode` hint. | `src/components/panels/SRPanel.jsx`, `src/styles/panels.css` | Practitioners can't see the control they just triggered. |
| T3 | `SearchPanel` focuses the input ~100ms after the modal opens but never scrolls it into view if the modal opened scrolled, and there's no `lockBodyScroll` passed to its focus trap — the page behind the modal scrolls on iOS. | `src/components/panels/SearchPanel.jsx`, `src/components/panels/BookmarksPanel.jsx`, `src/components/panels/GlossaryPanel.jsx`, `src/components/panels/CheatsheetPanel.jsx` | Background bleed-through; jumpy first-keystroke. |
| T4 | `.mobile-tools-sheet` is `max-height: min(52vh, 360px)` anchored `bottom: calc(76px + …)` — on a short phone (≤600px tall) that leaves ~76px of lesson visible above it. The sheet itself has `overscroll-behavior-y: contain` but no `touch-action` lock, so a hard drag can still trigger iOS pull-to-refresh if the focus-trap body lock misfires. | `src/components/layout/MobileToolsSheet.jsx`, `src/styles/panels.css` (`.mobile-tools-sheet`, `.mobile-tools-scrim`) | Tool sheet "shown over primary content" with little context left; scroll bleed edge case. |
| T5 | `MobileToolsSheet` traps focus and handles Escape, but the *caller* (bottom toolbar / lesson header) doesn't track which trigger opened it, so focus restoration on close isn't guaranteed; there's also no "panel opened" announcement before focus lands on the first grid button. | `src/components/layout/MobileToolsSheet.jsx`, `src/components/layout/BottomToolbar.jsx`, `src/components/layout/LessonHeader.jsx` | Dialog focus issue — keyboard/SR users dumped at document start on close. |
| T6 | Sub-44px secondary targets in panels: `.bk-remove` (bookmark delete) is 28×28; `.tool-btn` is 42×42; `.tool-menu-item` is `min-height: 38px`. (Primary panel controls and `.mobile-tools-item` *are* ≥44–56px.) | `src/styles/panels.css` (~ll. 342–350, 384–401, 453–468) | "Overcrowded controls" / hard to tap precisely; destructive delete is the smallest target. |
| T7 | Sidebar drawer (`Sidebar.jsx`) traps focus and locks body scroll, but neither the sidebar nor `sidebar.css` uses any `env(safe-area-inset-*)`, so on a foldable / bottom-notch device the drawer header/footer can be clipped. | `src/components/layout/Sidebar.jsx`, `src/styles/sidebar.css` | Edge content (e.g. sign-out, profile) under the cutout. |

What's already solid: `useFocusTrap` is applied consistently to MobileToolsSheet, Search,
Bookmarks, SR, Cheatsheet, Glossary (all `role="dialog"` + `aria-modal`); search input has
`inputMode="search"` + `enterKeyHint`; SR concept input is length-capped; the mobile-tools
grid collapses to one column ≤400px; overlays already use safe-area padding via
`mobile-interactions.css` (which would actually fire once `viewport-fit=cover` is set).

### 1.4 Challenge workspace, code preview, quiz, dialogs

| # | Issue | Where | Why it hurts on mobile |
|---|-------|-------|------------------------|
| C1 | **Tool panels shown too early / overcrowded:** `.cc-workspace` only stacks editor-over-preview at `@media (max-width: 900px)`. Between ~768–900px (landscape phones, small tablets) the editor (`height: 280px`) and preview (`min-height: 280px`) both sit in a 2-up grid → ~560px of vertical chrome before any actions. | `src/components/learning/CodeChallenge.jsx`, `src/styles/feature-challenges.css` (`.cc-workspace`, `@media 900px`) | Editor *and* preview on screen at once on narrow widths; nothing breathes. Lower the stack breakpoint to 768px (or stack whenever `useIsMobile`). |
| C2 | The challenge editor / preview heights are hard-coded `280px` / `320px` with no mobile reduction (only the *CodePreview* light editor gets a mobile min-height tweak). | `src/components/learning/CodeChallenge.jsx`, `src/components/learning/CodePreview.jsx`, `src/styles/feature-mobile-fixes.css` | On a 360px phone the editor eats the whole viewport; the Run/Submit CTA is pushed far below. |
| C3 | **Inline disclosure panels have no focus management.** `AITutor` panel (`role="log"`, not a dialog) and the `CodePreview` "explanation" expansion don't trap focus, don't move focus in on open (AITutor only `setTimeout`-focuses the input), and the explanation panel has no Escape-to-close. `ChallengeAIPanel` likewise has no Escape handler. | `src/components/learning/AITutor.jsx`, `src/components/learning/CodePreview.jsx`, `src/components/learning/challenge/ChallengeAIPanel.jsx` | "Dialog focus issues" — Tab escapes to page content; no keyboard close path. |
| C4 | **AI chat inputs blocked by the keyboard.** `AITutor` and `ChallengeAIPanel` input rows have fixed padding, no `scrollIntoView` on focus, and no safe-area / keyboard awareness; the `max-height: 500px` Android shrink rule is reactive (keyboard is already over the field). | `src/components/learning/AITutor.jsx`, `src/components/learning/challenge/ChallengeAIPanel.jsx`, `src/styles/feature-mobile-fixes.css` (`@media (max-height: 500px)`) | Chat input disappears behind the keyboard exactly when used. |
| C5 | **Modal backgrounds aren't inert.** `BreakPrompt`, `Onboarding`, `CourseComplete`, `InstallPrompt` overlays don't mark the rest of the page `inert`, so SR/keyboard users can Tab into content behind the modal. `Onboarding` also doesn't capture/restore focus around its trap. | `src/components/shared/BreakPrompt.jsx`, `src/components/onboarding/Onboarding.jsx`, `src/components/gamification/CourseComplete.jsx`, `src/components/shared/InstallPrompt.jsx` | Background reachable behind dialogs; focus lost on close. |
| C6 | **Sub-44px controls in the challenge UI:** `.cc-reset-btn` (~18px tall), `.code-preview-explain` (~22px), `.cc-ai-suggestion`, `.code-preview-tab` (gets `min-height: 44px` ≤768px but that's overridden by `padding: 6px 8px` at ≤400px). Quiz radio/`.qq-opt` labels are `padding: 12px 16px` → ~40px tall with no mobile bump. | `src/styles/feature-challenges.css`, `src/styles/feature-ai-tutor.css`, `src/styles/feature-mobile-fixes.css`, `src/styles/learning-experience.css`, `src/components/learning/quiz/questionTypes.jsx` | Reset / explain / quiz options below the touch minimum. |
| C7 | **Horizontal overflow from code blocks.** `.cc-solution-code`, `.qq-code`, `.qq-bug-lines code` use `white-space: pre; overflow-x: auto` with no mobile font-size reduction and no scroll affordance — short lines scroll sideways on a 320px screen with no visual cue. | `src/styles/feature-challenges.css`, `src/styles/learning-experience.css` | "Scroll behavior" — surprise horizontal scroll inside vertical content. |
| C8 | Quiz Submit lives after the last question with no sticky CTA — on a 5+ question quiz it's a long scroll to a small button. | `src/components/learning/QuizView.jsx` | "Hard-to-reach CTA". |
| C9 | `.cc-ai-response` (`max-height: 200px; overflow-y: auto`) lacks `-webkit-overflow-scrolling: touch`, unlike the lesson AI tutor — janky momentum scroll on iOS. | `src/styles/feature-challenges.css` | Minor polish gap. |

What's already solid: Monaco is *not* loaded on phones (light textarea editor + Data-Saver
awareness); `useFocusTrap` is well-built (Tab-wrap, Escape, body-scroll lock, focus restore)
and used by the real modals (BreakPrompt, BadgeUnlock, CourseComplete, onboarding); inputs
are forced to `16px` ≤768px; `100dvh` is used for the address-bar problem; `aria-live`
status regions are everywhere; tap-highlight and input appearance are normalized for Android.

---

## 2. Highest-impact fixes (ranked)

1. **Make notes / SR / AI inputs keyboard-safe (T1, T2, C4).** On focus, `scrollIntoView({ block: 'center' })` the field; add bottom padding equal to the keyboard inset (or use the existing `keyboard-open` signal from `useMobileKeyboardOpen`); never let a focused input sit under the keyboard. This is the single most-felt mobile bug for active learners.
2. **Fix the lesson-header touch targets and the theme-toggle collision (L6, L7).** Bring `.lesson-action-btn` back to ≥44×44 on phones and move/resize `.theme-toggle` so it doesn't overlap the fixed Next button's hit area (or fold theme into the tools sheet on mobile).
3. **Decide on `viewport-fit=cover` (L1).** Either add it to the `<meta viewport>` (and the existing safe-area CSS starts doing real work — bottom nav extends correctly under the home indicator) or remove the dead inset math. Pair with `safe-area-inset-top` on `.topbar` (L2).
4. **Stack the challenge workspace earlier and shrink the editor on phones (C1, C2).** Stack at ≤768px (or whenever `useIsMobile`); cap editor/preview heights to something like `min(280px, 40vh)` on small screens so Run/Submit stays reachable.
5. **Give the inline disclosure panels real dialog ergonomics (C3, T5).** Add Escape-to-close and focus-in/focus-restore to `AITutor`, `ChallengeAIPanel`, and the `CodePreview` explanation; have the mobile tools sheet's opener remember the trigger for focus return.
6. **Mark modal backgrounds `inert` (C5).** Apply `inert` to the app root while `BreakPrompt`/`Onboarding`/`CourseComplete`/`InstallPrompt` are open; add focus capture/restore to `Onboarding`.
7. **Slim the bottom lesson nav on small phones (L5).** Drop the standalone Tools button into the row only when there's space, or move the progress chip out of the bar; guarantee the Next CTA keeps its label + ≥48px down to 320px.
8. **Bump remaining sub-44px controls (T6, C6):** `.bk-remove`, `.tool-btn`, `.tool-menu-item`, `.cc-reset-btn`, `.code-preview-explain`, `.qq-opt`/quiz options, `.code-preview-tab` at ≤400px.
9. **Tame code-block overflow (C7)** and the **keyboard-open layout jump (L4)**; add `scroll-margin-top` to lesson headings (L3); restore focus across the auth↔guest-preview/confirm-sent transitions (P4, P5).
10. **Safe-area padding on the sidebar drawer and celebratory overlays (T7, L8)** once `viewport-fit=cover` is in.

---

## 3. Components / files likely involved

Funnel: `src/components/auth/{AuthPage,GuestPreview,LandingHero,AuthSocialButtons,AuthConfirmSent}.jsx`,
`src/layouts/AuthLayout.jsx`, `src/styles/{auth,landing,responsive}.css`, `index.html`.

Shell & nav: `src/layouts/AppLayout.jsx`, `src/components/layout/{LessonNavBar,LessonShellTopbar,LessonPagination,LessonFocusStrip,BottomToolbar,Breadcrumb,ThemeToggle}.jsx`,
`src/components/learning/{LessonView,LessonHeader}.jsx`,
`src/hooks/useMobileKeyboardOpen.js`,
`src/styles/{shell-layout,lessons,learning-experience,panels,mobile-shell-hardening,mobile-interactions,mobile-performance,responsive}.css`.

Tool surfaces: `src/components/layout/{MobileToolsSheet,Sidebar,SidebarTabBar}.jsx`,
`src/components/PanelManager.jsx`,
`src/components/learning/LessonNotesPanel.jsx`,
`src/components/panels/{BookmarksPanel,SRPanel,SearchPanel,CheatsheetPanel,GlossaryPanel}.jsx`,
`src/hooks/useFocusTrap.*`, `src/styles/{panels,sidebar,feature-surfaces}.css`.

Challenge / quiz / dialogs: `src/components/learning/{CodeChallenge,CodePreview,LessonProductFrame,QuizView,AITutor,LessonFeedback}.jsx`,
`src/components/learning/challenge/ChallengeAIPanel.jsx`,
`src/components/learning/quiz/questionTypes.jsx`,
`src/components/shared/{BreakPrompt,InstallPrompt}.jsx`,
`src/components/onboarding/Onboarding.jsx`,
`src/components/gamification/CourseComplete.jsx`,
`src/styles/{feature-challenges,feature-ai-tutor,feature-mobile-fixes,animations}.css`.

Test homes (extend these): `src/styles/*.test.js` (`authMobileKeyboard`, `guestPreviewMobile`,
`mobileShellLayout`, `mobileInteractionLayout`, `mobilePerformanceLayout`, `mobileToolsSheetLayout`),
`tests/e2e/*` (notably `accessibility.smoke.spec.js`, `authenticated.accessibility.spec.js`,
`auth.smoke.spec.js`, `public-learning-entry.spec.js`) with the existing `mobile-chrome` Playwright project.

---

## 4. E2E scenarios to test (Playwright `mobile-chrome` / iPhone-class viewport)

1. **Auth conversion above the fold** — load `/`, assert the auth form's primary submit button is reachable within one viewport scroll; tab order goes intro CTA → form; `scrollToAuth` actually brings the form fully into view.
2. **Keyboard never covers the focused field** — sign-up: focus display name / email / password in turn on a 667px-tall viewport; assert each focused input's bounding box stays fully above the (emulated) keyboard. Repeat for: lesson notes textarea, SR "add concept" input, AITutor input, ChallengeAIPanel input.
3. **Forgot-password confirmation visible** — request reset from a scrolled position; assert the success message scrolls into view.
4. **Bottom nav vs. content** — on a lesson, scroll to the end; assert the last interactive element (pagination "Continue", feedback widget) is not overlapped by the fixed `.lesson-nav`; assert "Next/Continue" keeps its label at 360px and 320px and is ≥48px.
5. **Theme toggle doesn't steal Next taps** — tap at the visual center of the "Next" button on a 360px viewport; assert navigation happened (not a theme flip).
6. **Mobile tools sheet** — open from the bottom toolbar: focus moves into the sheet, Escape closes it, focus returns to the toolbar trigger; background doesn't scroll while open; lesson content remains partly visible.
7. **Search / Bookmarks / SR modals** — open each: focus lands in the modal, page behind doesn't scroll on touch-drag, Escape closes, focus restored; on a short viewport the modal fits without clipping.
8. **Challenge workspace layout** — at 768px and 390px: editor and preview are stacked (not side-by-side); the Run and Submit buttons are reachable without horizontal scroll; submitting shows feedback in-viewport.
9. **Code blocks** — render a lesson/challenge with a long code line on a 320px viewport; assert the code block is the only horizontally scrollable element and the page itself doesn't scroll sideways.
10. **Modal background inert** — with `BreakPrompt` / `Onboarding` / `CourseComplete` open, assert Tab cycles only within the dialog and `document.activeElement` is always inside it; on close, focus returns to the opener.
11. **Touch-target sweep** — automated check (axe / custom) that all interactive elements in: lesson header, lesson nav, panel toolbars, quiz options, challenge controls measure ≥44×44 CSS px at ≤500px width.
12. **Safe area (once `viewport-fit=cover` lands)** — emulate an iPhone 14 Pro; assert `.topbar` content sits below the inset, `.lesson-nav` background extends to the screen edge, and modal dismiss buttons clear the home-indicator strip.
13. **Keyboard-open shell** — focus a lesson textarea; assert `.lesson-nav` and `.theme-toggle` hide, the scroll position doesn't jump the caret off-screen, and they reappear on blur.

---

## 5. Acceptance criteria

- **AC1 — No covered inputs.** On a 375×667 (and 360×640) emulated device, focusing any text input/textarea in the public funnel, lesson view, notes, review queue, search, and both AI panels leaves the entire input visible above the on-screen keyboard. No focused input is ever overlapped by the keyboard, a sticky bar, or a floating button.
- **AC2 — Touch targets.** Every interactive control reachable on mobile (≤500px width) — including lesson-header bookmark/notes buttons, lesson nav buttons, theme toggle, panel toolbar buttons, bookmark delete, quiz options, challenge Run/Reset/Explain, code-preview tabs — has a hit area ≥44×44 CSS px. Verified by an automated assertion in the e2e suite.
- **AC3 — Reachable primary CTAs.** The auth submit button is reachable within one scroll from `/` on a phone. The lesson "Continue/Next lesson" button keeps its visible label and ≥48px size from 320px up. The quiz Submit and challenge Run/Submit buttons are reachable without horizontal scrolling.
- **AC4 — Dialog ergonomics.** Every overlay that visually blocks the page (`BreakPrompt`, `Onboarding`, `CourseComplete`, `InstallPrompt`, search/bookmarks/SR/glossary/cheatsheet modals, mobile tools sheet) moves focus into itself on open, traps Tab within itself, closes on Escape, returns focus to the element that opened it, and renders the rest of the page `inert`/non-focusable while open. The same focus-return guarantee covers the auth ↔ guest-preview and auth ↔ "confirm sent" transitions.
- **AC5 — No content trapped behind nav.** On any lesson at any supported width, all lesson content and in-content controls can be scrolled fully clear of the sticky topbar and the fixed bottom `.lesson-nav` (in-page anchors land with the heading visible; the last interactive element isn't overlapped).
- **AC6 — Tool panels not premature / not smothering.** The challenge editor and preview are stacked (never side-by-side) at ≤768px; on phones the editor occupies ≤40vh so action buttons stay on screen. The mobile tools sheet leaves a usable strip of lesson content visible and never bleeds scroll to the page body.
- **AC7 — No surprise horizontal scroll.** At 320px width, no page in the app scrolls horizontally; only `<pre>`/code blocks scroll on their own axis, and they show a scroll affordance.
- **AC8 — Safe area.** `viewport-fit=cover` is set; `.topbar` content clears the top inset, fixed bottom bars and overlays respect the bottom/side insets, and the floating theme toggle does not overlap the bottom nav or the Next button's hit area.
- **AC9 — No layout jump on keyboard.** Opening/closing the on-screen keyboard in a lesson does not move the caret off-screen and does not produce a visible content jump beyond hiding/showing the bottom nav.
- **AC10 — Regression coverage.** New `mobile-chrome` Playwright specs cover scenarios 1–13 above and run in CI alongside the existing `test:e2e:smoke:mobile` flow; the style-layout `*.test.js` files gain assertions for the new touch-target and safe-area rules.
