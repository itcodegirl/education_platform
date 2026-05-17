# Netlify Production Verification

Use this after a production Netlify deploy, especially after any PR that touches
`public/sw.js`, `src/lib/registerSW.js`, `netlify.toml`, routing, or the Vite
build output.

## Quick Command

```bash
npm run check:production-deploy -- --url https://codeherway-education-platform.netlify.app/
```

For a custom domain, replace the URL:

```bash
npm run check:production-deploy -- --url https://codeherway.com/
```

The script is intentionally not part of the default local quality gate because
it depends on the live Netlify deployment and network access.

## What The Script Checks

- `/` returns HTTP 200 and contains the app shell.
- `/`, `/index.html`, `/sw.js`, and `/manifest.json` use
  `Cache-Control: public, max-age=0, must-revalidate`.
- live `/sw.js` serves the same `CACHE_VERSION` as checked-in `public/sw.js`.
- a fake SPA route returns the app shell through the Netlify redirect.
- the first hashed Vite asset referenced by the homepage returns HTTP 200.
- that hashed asset uses `Cache-Control: public, max-age=31536000, immutable`.

## Browser Verification

After the script passes, verify the service worker in a real browser:

1. Open the production URL in a private window.
2. Open DevTools.
3. Go to Application > Service Workers.
4. Confirm the active worker URL includes the current registered version, such
   as `/sw.js?v=12`.
5. Reload once and confirm the page does not log a rejected `FetchEvent`
   promise for the homepage.
6. In DevTools Network, check:
   - `/` and `/index.html` are revalidated.
   - `/sw.js` is revalidated.
   - hashed `/assets/*` files are immutable.
7. Optional offline check:
   - Load one lesson while online.
   - Switch DevTools Network to Offline.
   - Refresh the same lesson route.
   - Expected: cached shell or branded offline page, not a blank browser error.

## Clearing Old Worker State

If a browser is stuck on an old service worker:

1. DevTools > Application > Service Workers.
2. Click Update, then reload.
3. If it still serves the old worker, click Unregister.
4. Hard reload the page.
5. Confirm the new `/sw.js?v=<current>` worker installs.

Do this only for local/manual verification. Production users should receive the
new worker through the versioned registration URL and no-cache `/sw.js` headers.

## Failure Triage

| Failure | Likely cause | Next step |
| --- | --- | --- |
| `/sw.js` version is old | Netlify deploy has not finished or browser/CDN still has old worker | Wait for deploy completion, then rerun with `--url` |
| shell paths are missing revalidation headers | `netlify.toml` header block regressed | Check `npm run test:run -- src/integration/netlify-cache-headers.test.js` |
| hashed asset is not immutable | asset header block regressed or homepage is not Vite output | Check `/assets/*` headers in `netlify.toml` |
| SPA fallback route is not app shell | Netlify redirect is missing or overridden | Check the `[[redirects]]` block in `netlify.toml` |
| homepage returns non-200 | production deploy failed or domain points elsewhere | Check Netlify deploy logs and DNS |

## Evidence Template

```md
Production verification date:
Tester:
Production URL:
Deploy SHA / Netlify deploy id:
Service worker version:
Command:
Command result:
Browser worker version:
Rejected FetchEvent promise observed: yes/no
Notes:
Decision:
```
