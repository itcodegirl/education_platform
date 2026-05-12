# Asset Performance Policy

Last updated: May 12, 2026

Use this policy before adding images, fonts, videos, downloadable files, or new preload hints. The goal is to keep the platform calm and professional without letting visual polish slow the learner workspace.

## Image Rules

- Prefer AVIF or WebP for photographic and marketing images; use PNG only for transparent UI captures or screenshots that need lossless detail.
- Keep public-entry hero or preview images under 180 kB compressed unless there is a documented product reason.
- Keep repeated card, avatar, badge, and illustration images under 80 kB compressed.
- Provide explicit `width` and `height` or a stable CSS `aspect-ratio` for images that affect layout.
- Use lazy loading for below-the-fold images and authenticated-panel images.
- Avoid external placeholder image services in production-facing content.

## Font Rules

- Do not add a new font family without updating the performance evidence notes.
- Prefer existing local font assets and subset weights already in use.
- Limit new font weights to the smallest set needed for readable hierarchy.
- Do not preload fonts unless they are required for above-the-fold text and the preload is covered by a budget note.

## Preload Rules

- Preload only critical app shell assets that are needed before first interaction.
- Do not preload Monaco, Supabase, `jspdf`, `html2canvas`, course runtime data, challenge data, or authenticated-only styles.
- If a new preload is necessary, document the route, asset, reason, and measured impact in `docs/performance-evidence.md`.

## Media And Download Rules

- Keep video or animated media out of the public entry route unless it is user-initiated or represented by a lightweight poster.
- Downloadable PDFs or generated exports must remain behind explicit user intent.
- Generated files should not be committed unless they are stable documentation evidence.

## Review Checklist

1. Confirm new assets are compressed and sized for their rendered slot.
2. Confirm layout dimensions are stable before the asset loads.
3. Confirm below-the-fold and authenticated-only media are lazy.
4. Confirm no forbidden dependency or protected-route asset is preloaded in entry HTML.
5. Run `npm run audit:performance` after adding or changing assets that affect the build.

## Escalation Rules

- Optimize or replace the asset before raising a bundle or page-weight budget.
- Prefer route-owned assets over shared imports when the asset is not needed across the app.
- Add reviewer evidence when an asset is intentionally large because it carries product trust, portfolio proof, or instructional clarity.
