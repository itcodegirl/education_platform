// Service worker registration lives in the bundled app entry so the
// strict CSP can keep blocking inline scripts.

const shouldRegisterServiceWorker =
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  import.meta.env.PROD;

if (shouldRegisterServiceWorker) {
  const SW_SCRIPT_URL = '/sw.js?v=10';
  const SW_UPDATE_READY_EVENT = 'codeherway:sw-update-ready';
  const SW_STATE_EVENT = 'codeherway:sw-state';

  function dispatchSwEvent(type, detail = {}) {
    window.dispatchEvent(new CustomEvent(type, { detail }));
  }

  async function trackServiceWorkerEvent(phase, detail = {}) {
    try {
      const { trackEvent } = await import('./analytics');
      trackEvent('service_worker_event', {
        phase,
        scriptUrl: SW_SCRIPT_URL,
        ...detail,
      });
    } catch {
      // Analytics is optional and should never affect SW updates.
    }
  }

  async function reportServiceWorkerError(phase, error, detail = {}) {
    console.log(`SW ${phase}:`, error);
    trackServiceWorkerEvent(`${phase}_failed`, {
      message: error?.message || String(error),
      ...detail,
    });

    try {
      const { reportException } = await import('./sentry');
      reportException(error instanceof Error ? error : new Error(String(error)), {
        source: 'service-worker',
        phase,
        ...detail,
      });
    } catch {
      // Sentry is optional and may not be initialized yet.
    }
  }

  function notifyUpdateReady(registration, worker, reason) {
    dispatchSwEvent(SW_UPDATE_READY_EVENT, {
      registration,
      worker,
      scriptUrl: worker?.scriptURL || registration?.waiting?.scriptURL || SW_SCRIPT_URL,
      reason,
    });
    trackServiceWorkerEvent('update_ready', { reason });
  }

  function activateWaitingWorker(registration) {
    const worker = registration?.waiting;
    if (!worker) return false;
    worker.postMessage({ type: 'SKIP_WAITING' });
    trackServiceWorkerEvent('skip_waiting_requested');
    return true;
  }

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
      reportServiceWorkerError('legacy_cleanup', error);
    }
  }

  window.addEventListener('load', async () => {
    let refreshing = false;

    navigator.serviceWorker.addEventListener('message', (event) => {
      const type = event.data?.type || '';
      if (!type) return;

      dispatchSwEvent(SW_STATE_EVENT, event.data);
      trackServiceWorkerEvent('worker_message', {
        messageType: type,
        ...(event.data?.payload || {}),
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      trackServiceWorkerEvent('controller_changed');
      window.location.reload();
    });

    window.addEventListener('codeherway:sw-activate-waiting', (event) => {
      if (activateWaitingWorker(event.detail?.registration)) return;
      window.location.reload();
    });

    try {
      await unregisterLegacySw(SW_SCRIPT_URL);

      const reg = await navigator.serviceWorker.register(SW_SCRIPT_URL, {
        updateViaCache: 'none',
      });

      console.log('SW registered:', reg.scope);
      trackServiceWorkerEvent('registered', { scope: reg.scope });
      reg.update().catch((err) => {
        reportServiceWorkerError('update', err, { scope: reg.scope });
      });

      if (reg.waiting) {
        if (navigator.serviceWorker.controller) {
          notifyUpdateReady(reg, reg.waiting, 'waiting-on-load');
        } else {
          activateWaitingWorker(reg);
        }
      }

      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        if (!worker) return;

        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            notifyUpdateReady(reg, worker, 'installed-update');
          }
        });
      });
    } catch (err) {
      reportServiceWorkerError('registration', err);
    }
  });
}
