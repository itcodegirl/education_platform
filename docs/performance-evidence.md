# Performance Evidence

Last updated: May 12, 2026

This file records the current performance proof points reviewers can inspect without relying on broad claims.

## Local Gates

Run:

```bash
npm run audit:performance
```

This executes:

- `npm run build`
- `npm run check:bundle`
- `npm run check:route-boundaries`

Current local verification on this branch:

- Production build succeeds.
- Initial JavaScript gzip: 84.12 kB, under the 170 kB budget.
- Initial CSS gzip: 8.21 kB, under the 12 kB budget.
- Monaco, Supabase, and protected-app styles are not preloaded from the entry HTML.
- `jspdf` and `html2canvas` are blocked from static source imports and must stay behind the PDF/export action.

## CI Evidence

GitHub Actions runs Lighthouse through `.github/workflows/lighthouse-ci.yml` with `npm run test:lighthouse`.

The workflow uploads `.lighthouseci/` as an artifact named:

```text
lighthouse-ci-<run-id>-<attempt>
```

Use that artifact as the recruiter-facing proof for Lighthouse Performance, Accessibility, Best Practices, and SEO assertions. Do not cite a Lighthouse score in the portfolio case study until it comes from a completed CI run or a local run captured with the same config.

## Known Limits

- Lighthouse uses the public entry route only. Authenticated learner performance still needs browser traces from a credentialed staging run.
- The PDF export dependency is intentionally allowed as a lazy interaction chunk. It should not be optimized by moving it into shared app code.
- The protected lesson workspace remains the largest app-owned chunk and should be split only after the current trust and learning-flow work is stable.
