# Mobile Release Checklist

Use this checklist for any PR that changes layout, navigation, lesson tools,
auth entry, modals, keyboard/input behavior, or mobile performance. It converts
the mobile UX audit into a repeatable release gate without adding product
features.

## Required Evidence

- [ ] `npm run build`
- [ ] `npm run test`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test:e2e:smoke:public`
- [ ] `npm run test:e2e:smoke:mobile` with authenticated E2E credentials, or
      a clear note that signed-in mobile coverage skipped.
- [ ] Mobile Lighthouse or equivalent deployed-preview evidence for LCP, INP,
      CLS, total JavaScript, and main-thread time when performance-sensitive
      files changed.

## Device Matrix

Check at least one real iOS device and one real Android device before release
when mobile shell, keyboard, modal, or navigation behavior changed.

| Device class | Minimum check |
| --- | --- |
| Small phone, about 320px wide | No horizontal page scroll; primary CTAs retain readable labels. |
| Standard phone, about 390px wide | Bottom navigation, search, notes, and tools remain thumb reachable. |
| Tall/notched phone | Topbar, dialogs, and bottom nav respect safe areas. |
| Android Chrome | Keyboard does not cover focused notes, search, review, or auth inputs. |
| iOS Safari | Keyboard, address bar, and home indicator do not hide active controls. |

## Interaction Gates

- [ ] Thumb reach: primary lesson actions stay in the lower half of the screen
      without crowding destructive or secondary controls.
- [ ] Touch targets: all mobile controls are at least 44 by 44 CSS pixels, with
      48px preferred for primary lesson actions.
- [ ] Sticky navigation: the bottom lesson nav never overlaps the final
      interactive element in a lesson.
- [ ] Keyboard overlap: every focused input or textarea remains visible after
      the mobile keyboard opens.
- [ ] Modal usability: dialogs move focus in, trap focus, close on Escape or a
      visible close button, and restore focus to the opener.
- [ ] Gesture friendliness: scrollable sheets contain their own scroll and do
      not trigger background page scroll.
- [ ] Readability: lesson headings, quiz options, and code blocks stay readable
      at 320px without forcing page-level horizontal scroll.
- [ ] Cognitive load: mobile screens show one primary learner action at a time;
      optional tools are grouped behind the tools sheet or panel entry points.

## Accessibility Gates

- [ ] VoiceOver or TalkBack can reach the lesson title, current progress,
      primary action, tools, notes, search, and close buttons in a logical
      order.
- [ ] Focus indicators remain visible against light and dark themes.
- [ ] Modal status and async feedback use existing `aria-live` regions without
      moving focus unexpectedly.
- [ ] Icon-only mobile controls have accessible names that match their action.

## Performance Gates

- [ ] No new heavy dependency appears in the initial route bundle.
- [ ] Monaco, Supabase, PDF export, canvas export, course data, and search
      manifest chunks remain lazy or separately budgeted.
- [ ] Mobile-only animation, blur, and shadow effects avoid unnecessary
      compositing work on scroll-heavy learner surfaces.
- [ ] Long lessons and tool panels keep scroll responsive on a mid-range phone.

## Release Decision

Do not treat a release as mobile-ready when authenticated mobile E2E skipped,
real-device keyboard behavior was not checked, or deployed-preview performance
evidence is missing. Ship only with a documented exception and a follow-up owner
when one of those gates cannot be completed.
