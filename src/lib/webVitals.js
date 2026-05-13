const VITAL_THRESHOLDS = Object.freeze({
  cls: [0.1, 0.25],
  fcp: [1800, 3000],
  inp: [200, 500],
  lcp: [2500, 4000],
  ttfb: [800, 1800],
});

function roundMetricValue(value) {
  return Number(Number(value || 0).toFixed(2));
}

export function getWebVitalRating(metric, value) {
  const [good, poor] = VITAL_THRESHOLDS[metric] || [];
  if (!Number.isFinite(good) || !Number.isFinite(poor)) return 'unknown';
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

export function createWebVitalPayload({
  metric,
  value,
  unit = 'ms',
  windowRef = typeof window !== 'undefined' ? window : undefined,
  documentRef = typeof document !== 'undefined' ? document : undefined,
} = {}) {
  const roundedValue = roundMetricValue(value);
  const connection = windowRef?.navigator?.connection;

  return {
    metric,
    value: roundedValue,
    unit,
    rating: getWebVitalRating(metric, roundedValue),
    visibilityState: documentRef?.visibilityState || 'unknown',
    effectiveConnectionType: connection?.effectiveType || 'unknown',
    deviceMemory: windowRef?.navigator?.deviceMemory || null,
    hardwareConcurrency: windowRef?.navigator?.hardwareConcurrency || null,
  };
}

function observeEntryType({
  PerformanceObserverRef,
  type,
  onEntries,
  options = {},
}) {
  try {
    const observer = new PerformanceObserverRef((list) => {
      onEntries(list.getEntries());
    });
    observer.observe({ type, buffered: true, ...options });
    return () => observer.disconnect();
  } catch {
    return () => {};
  }
}

function supportsEntryType(PerformanceObserverRef, type) {
  return PerformanceObserverRef?.supportedEntryTypes?.includes(type);
}

export function observeWebVitals(trackEvent, {
  windowRef = typeof window !== 'undefined' ? window : undefined,
  documentRef = typeof document !== 'undefined' ? document : undefined,
  performanceRef = typeof performance !== 'undefined' ? performance : undefined,
  PerformanceObserverRef = windowRef?.PerformanceObserver,
} = {}) {
  if (typeof trackEvent !== 'function') return () => {};
  if (!windowRef || !documentRef || !performanceRef || !PerformanceObserverRef) return () => {};

  const cleanups = [];
  const sent = new Set();
  let clsValue = 0;
  let lcpValue = 0;
  let inpValue = 0;

  const sendMetric = (metric, value, unit = 'ms') => {
    if (!Number.isFinite(value)) return;
    trackEvent(`web_vital_${metric}`, createWebVitalPayload({
      metric,
      value,
      unit,
      windowRef,
      documentRef,
    }));
  };

  const sendOnce = (metric, value, unit = 'ms') => {
    if (sent.has(metric)) return;
    sent.add(metric);
    sendMetric(metric, value, unit);
  };

  const navigationEntry = performanceRef.getEntriesByType?.('navigation')?.[0];
  if (navigationEntry?.responseStart) {
    sendOnce('ttfb', navigationEntry.responseStart - navigationEntry.startTime);
  }

  if (supportsEntryType(PerformanceObserverRef, 'paint')) {
    cleanups.push(observeEntryType({
      PerformanceObserverRef,
      type: 'paint',
      onEntries: (entries) => {
        const fcp = entries.find((entry) => entry.name === 'first-contentful-paint');
        if (fcp) sendOnce('fcp', fcp.startTime);
      },
    }));
  }

  if (supportsEntryType(PerformanceObserverRef, 'largest-contentful-paint')) {
    cleanups.push(observeEntryType({
      PerformanceObserverRef,
      type: 'largest-contentful-paint',
      onEntries: (entries) => {
        const latest = entries.at(-1);
        if (latest?.startTime) {
          lcpValue = latest.startTime;
        }
      },
    }));
  }

  if (supportsEntryType(PerformanceObserverRef, 'layout-shift')) {
    cleanups.push(observeEntryType({
      PerformanceObserverRef,
      type: 'layout-shift',
      onEntries: (entries) => {
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value || 0;
          }
        });
      },
    }));
  }

  if (supportsEntryType(PerformanceObserverRef, 'event')) {
    cleanups.push(observeEntryType({
      PerformanceObserverRef,
      type: 'event',
      options: { durationThreshold: 40 },
      onEntries: (entries) => {
        entries.forEach((entry) => {
          if (entry.interactionId && entry.duration > inpValue) {
            inpValue = entry.duration;
          }
        });
      },
    }));
  }

  const flushFinalMetrics = () => {
    if (lcpValue > 0) sendOnce('lcp', lcpValue);
    if (clsValue > 0) sendOnce('cls', clsValue, 'score');
    if (inpValue > 0) sendOnce('inp', inpValue);
  };

  const onVisibilityChange = () => {
    if (documentRef.visibilityState === 'hidden') {
      flushFinalMetrics();
    }
  };

  documentRef.addEventListener('visibilitychange', onVisibilityChange);
  windowRef.addEventListener('pagehide', flushFinalMetrics);

  return () => {
    cleanups.forEach((cleanup) => cleanup());
    documentRef.removeEventListener('visibilitychange', onVisibilityChange);
    windowRef.removeEventListener('pagehide', flushFinalMetrics);
  };
}
