// ═══════════════════════════════════════════════
// SERVICE WORKER REGISTRATION
//
// Moved out of an inline <script> in index.html because the strict
// CSP (`script-src 'self' 'wasm-unsafe-eval'`) blocks inline-script
// execution. By importing this from main.jsx, the registration code
// is bundled by Vite and served as a module from our own origin, so
// it passes 'self'.
//
// Functionally identical to the inline version that used to live in
// index.html: waits for window 'load', registers /sw.js?v=8 with
// updateViaCache: 'none', posts SKIP_WAITING to any installed worker
// so new deploys take over immediately, and reloads the page once on
// controller change so the user always sees the latest version.
// ═══════════════════════════════════════════════

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const SW_SCRIPT_URL = '/sw.js?v=8';

  async function unregisterLegacySw(registrationUrl) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations
          .filter((registration) => {
            const activeScriptURL = registration.active?.scriptURL || '';
            const installingScriptURL = registration.installing?.scriptURL || '';
            const waitingScriptURL = registration.waiting?.scriptURL || '';

            const hasLegacySw = [
              activeScriptURL,
              installingScriptURL,
              waitingScriptURL,
            ].some((scriptUrl) => scriptUrl.includes('/sw.js') && !scriptUrl.includes(registrationUrl));

            return registration.scope.startsWith(window.location.origin) && hasLegacySw;
          })
          .map((registration) => registration.unregister())
      );
    } catch (error) {
      console.log('SW legacy cleanup failed:', error);
    }
  }

  window.addEventListener('load', async () => {
    let refreshing = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    try {
      await unregisterLegacySw(SW_SCRIPT_URL);

      const reg = await navigator.serviceWorker.register(SW_SCRIPT_URL, {
        updateViaCache: 'none',
      });

      console.log('SW registered:', reg.scope);
      reg.update().catch((err) => {
        console.log('SW update skipped:', err);
      });

      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        if (!worker) return;

        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            worker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    } catch (err) {
      console.log('SW registration failed:', err);
    }
  });
}
