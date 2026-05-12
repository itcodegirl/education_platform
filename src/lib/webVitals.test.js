import { describe, expect, it, vi } from 'vitest';
import {
  createWebVitalPayload,
  getWebVitalRating,
  observeWebVitals,
} from './webVitals';

describe('web vitals telemetry', () => {
  it('rates core web vitals with stable labels', () => {
    expect(getWebVitalRating('lcp', 2400)).toBe('good');
    expect(getWebVitalRating('lcp', 3000)).toBe('needs-improvement');
    expect(getWebVitalRating('lcp', 4200)).toBe('poor');
    expect(getWebVitalRating('unknown', 1)).toBe('unknown');
  });

  it('creates a low-cardinality analytics payload', () => {
    const payload = createWebVitalPayload({
      metric: 'cls',
      value: 0.12345,
      unit: 'score',
      windowRef: {
        navigator: {
          connection: { effectiveType: '4g' },
          deviceMemory: 8,
          hardwareConcurrency: 12,
        },
      },
      documentRef: { visibilityState: 'visible' },
    });

    expect(payload).toEqual({
      metric: 'cls',
      value: 0.12,
      unit: 'score',
      rating: 'needs-improvement',
      visibilityState: 'visible',
      effectiveConnectionType: '4g',
      deviceMemory: 8,
      hardwareConcurrency: 12,
    });
  });

  it('observes supported metrics and flushes final values on hidden visibility', () => {
    const observers = [];
    class FakePerformanceObserver {
      static supportedEntryTypes = ['event', 'largest-contentful-paint', 'layout-shift', 'paint'];

      constructor(callback) {
        this.callback = callback;
        observers.push(this);
      }

      observe(options) {
        this.type = options.type;
      }

      disconnect() {}
    }

    const documentListeners = {};
    const windowListeners = {};
    const documentRef = {
      visibilityState: 'visible',
      addEventListener: (event, callback) => {
        documentListeners[event] = callback;
      },
      removeEventListener: vi.fn(),
    };
    const windowRef = {
      addEventListener: (event, callback) => {
        windowListeners[event] = callback;
      },
      removeEventListener: vi.fn(),
      navigator: {},
    };
    const performanceRef = {
      getEntriesByType: (type) => (type === 'navigation'
        ? [{ responseStart: 120, startTime: 0 }]
        : []),
    };
    const trackEvent = vi.fn();

    const cleanup = observeWebVitals(trackEvent, {
      documentRef,
      windowRef,
      performanceRef,
      PerformanceObserverRef: FakePerformanceObserver,
    });

    observers.find((observer) => observer.type === 'paint').callback({
      getEntries: () => [{ name: 'first-contentful-paint', startTime: 950 }],
    });
    observers.find((observer) => observer.type === 'largest-contentful-paint').callback({
      getEntries: () => [{ startTime: 2100 }],
    });
    observers.find((observer) => observer.type === 'layout-shift').callback({
      getEntries: () => [{ value: 0.04, hadRecentInput: false }],
    });
    observers.find((observer) => observer.type === 'event').callback({
      getEntries: () => [{ interactionId: 1, duration: 180 }],
    });

    documentRef.visibilityState = 'hidden';
    documentListeners.visibilitychange();

    expect(trackEvent).toHaveBeenCalledWith('web_vital_ttfb', expect.objectContaining({ value: 120 }));
    expect(trackEvent).toHaveBeenCalledWith('web_vital_fcp', expect.objectContaining({ value: 950 }));
    expect(trackEvent).toHaveBeenCalledWith('web_vital_lcp', expect.objectContaining({ value: 2100 }));
    expect(trackEvent).toHaveBeenCalledWith('web_vital_cls', expect.objectContaining({ value: 0.04, unit: 'score' }));
    expect(trackEvent).toHaveBeenCalledWith('web_vital_inp', expect.objectContaining({ value: 180 }));

    cleanup();
    expect(documentRef.removeEventListener).toHaveBeenCalledWith('visibilitychange', documentListeners.visibilitychange);
    expect(windowRef.removeEventListener).toHaveBeenCalledWith('pagehide', windowListeners.pagehide);
  });
});
