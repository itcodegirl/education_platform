---
name: Lighthouse Evidence Capture
about: Record measured Lighthouse scores from CI before using performance claims publicly
title: "Lighthouse evidence: "
labels: ["performance", "portfolio", "ci"]
assignees: []
---

## Goal

Capture dated Lighthouse evidence for reviewer-facing performance claims.

## CI Artifact

- [ ] Lighthouse CI workflow completed for the target branch or release commit.
- [ ] Artifact downloaded: `lighthouse-ci-<run-id>-<attempt>`.
- [ ] `.lighthouseci/` report inspected.
- [ ] Temporary public LHCI URL or local report path recorded, if available.

## Scores

- [ ] Performance:
- [ ] Accessibility:
- [ ] Best practices:
- [ ] SEO:

## Documentation Update

- [ ] Add a dated row to `docs/lighthouse-evidence.md`.
- [ ] Include commit SHA, route, device preset, scores, and artifact/report reference.
- [ ] Do not cite scores in portfolio materials until this row is committed.

## Notes

Reference: [`docs/lighthouse-evidence.md`](../../docs/lighthouse-evidence.md)
