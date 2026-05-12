# Lighthouse Evidence

Use this file to record measured Lighthouse results for reviewer-facing releases. CI assertions and bundle checks are useful guardrails, but portfolio claims should point to dated score evidence.

## Current Capture Status

No committed dated Lighthouse score row has been recorded yet.

The repository does run Lighthouse CI assertions in `.github/workflows/lighthouse-ci.yml`, and that workflow now uploads `.lighthouseci/` reports as a CI artifact. Treat the artifact as the source for the next dated row.

## CI Evidence Workflow

1. Open the latest Lighthouse CI workflow run for the target branch or release commit.
2. Download the `lighthouse-ci-<run-id>-<attempt>` artifact.
3. Inspect the `.lighthouseci/` report and temporary public URL, if available.
4. Add a dated row in the table below with the route, preset, scores, and artifact/report reference.

Do not claim measured Lighthouse performance in reviewer materials until this table has a dated row.

## Local Capture

Run the same command used by CI:

```bash
npm run build
npm run test:lighthouse
```

The configured route is `http://127.0.0.1:4319/`.

## Minimum Scores

The committed `lighthouserc.json` assertions require:

- Performance: `0.60`
- Accessibility: `0.90`
- Best practices: `0.90`
- SEO: `0.85`

## Result Template

| Date | Commit | Route | Device preset | Performance | Accessibility | Best practices | SEO | Evidence |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| TBD | TBD | `/` | desktop | TBD | TBD | TBD | TBD | Add CI artifact name, report path, or temporary LHCI URL. |

## Reviewer Note

Until this table has a dated score row, claim bundle guardrails, lazy-loading discipline, and CI Lighthouse assertions. Do not claim proven Lighthouse performance.
