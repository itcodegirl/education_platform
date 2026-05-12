---
name: Mobile Device QA
about: Capture real iOS and Android mobile validation evidence
title: "Mobile QA: "
labels: ["qa", "mobile"]
assignees: []
---

## Scope

- PR or commit:
- Preview URL:
- Areas changed:
- Tester:
- Date:

## Devices

| Platform | Device / OS | Browser | Result | Notes |
| --- | --- | --- | --- | --- |
| iOS |  | Safari | Not run |  |
| Android |  | Chrome | Not run |  |

## Required Mobile Gates

- [ ] Public auth entry loads without horizontal page scroll.
- [ ] Preview lesson opens and the primary account action remains reachable.
- [ ] Signed-in lesson shell opens on mobile, or signed-in coverage is documented as skipped.
- [ ] Bottom lesson navigation does not overlap the final lesson control.
- [ ] Notes, search, review input, and auth inputs remain visible when the keyboard opens.
- [ ] Mobile tools sheet opens, scrolls internally, closes cleanly, and returns focus to the opener.
- [ ] Dialog close buttons clear the safe area and are at least 44 by 44 CSS pixels.
- [ ] VoiceOver or TalkBack reaches the lesson title, primary action, tools, notes, search, and close buttons in a logical order.
- [ ] Mobile Lighthouse or equivalent preview evidence is attached when performance-sensitive code changed.

## Evidence

- Screenshot or screen recording links:
- Lighthouse mobile result:
- Authenticated E2E status:
- Known exceptions:

## Sign-Off

- [ ] No release-blocking mobile issue found.
- [ ] Any exception has an owner and follow-up link.
