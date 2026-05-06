const PREVIEW_REQUEST_TYPE = 'codeherway:challenge-preview-request';
const PREVIEW_RESPONSE_TYPE = 'codeherway:challenge-preview-response';
const PREVIEW_NODE_ID_ATTR = 'data-codeherway-node-id';
const PREVIEW_SNAPSHOT_TIMEOUT_MS = 1500;

const EMPTY_COMPUTED_STYLE = Object.freeze({});

function buildEmptyPreviewFrame() {
  return {
    contentDocument: null,
    contentWindow: {
      innerHeight: 0,
      innerWidth: 0,
      getComputedStyle: () => EMPTY_COMPUTED_STYLE,
      _challengeResults: [],
    },
  };
}

export function buildChallengePreviewBridgeScript() {
  return `
    (() => {
      const REQUEST_TYPE = ${JSON.stringify(PREVIEW_REQUEST_TYPE)};
      const RESPONSE_TYPE = ${JSON.stringify(PREVIEW_RESPONSE_TYPE)};
      const NODE_ID_ATTR = ${JSON.stringify(PREVIEW_NODE_ID_ATTR)};

      const toCamelCase = (name) => name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

      const serializeComputedStyle = (style) => {
        const output = {};
        for (const name of Array.from(style)) {
          const value = style.getPropertyValue(name);
          output[name] = value;
          output[toCamelCase(name)] = value;
        }
        return output;
      };

      const buildSnapshot = () => {
        const root = document.documentElement;
        if (!root) {
          return {
            html: '<!DOCTYPE html><html><head></head><body></body></html>',
            viewportHeight: window.innerHeight || 0,
            viewportWidth: window.innerWidth || 0,
            styles: {},
            consoleResults: Array.isArray(window._challengeResults) ? window._challengeResults : [],
          };
        }

        const clonedRoot = root.cloneNode(true);
        const liveElements = [root, ...root.querySelectorAll('*')];
        const clonedElements = [clonedRoot, ...clonedRoot.querySelectorAll('*')];
        const styles = {};

        liveElements.forEach((element, index) => {
          const nodeId = String(index);
          const clonedElement = clonedElements[index];
          clonedElement?.setAttribute?.(NODE_ID_ATTR, nodeId);
          styles[nodeId] = serializeComputedStyle(window.getComputedStyle(element));
        });

        return {
          html: '<!DOCTYPE html>' + clonedRoot.outerHTML,
          viewportHeight: window.innerHeight || 0,
          viewportWidth: window.innerWidth || 0,
          styles,
          consoleResults: Array.isArray(window._challengeResults) ? window._challengeResults : [],
        };
      };

      window.addEventListener('message', (event) => {
        if (event.source !== window.parent) return;

        const data = event.data;
        if (!data || data.type !== REQUEST_TYPE || !data.requestId) return;

        window.parent.postMessage(
          {
            type: RESPONSE_TYPE,
            requestId: data.requestId,
            snapshot: buildSnapshot(),
          },
          '*',
        );
      });
    })();
  `;
}

export function createChallengePreviewTestFrameFromSnapshot(snapshot) {
  if (!snapshot?.html || typeof DOMParser === 'undefined') {
    return buildEmptyPreviewFrame();
  }

  const parser = new DOMParser();
  const contentDocument = parser.parseFromString(snapshot.html, 'text/html');
  const stylesByNodeId = snapshot.styles || {};

  return {
    contentDocument,
    contentWindow: {
      innerHeight: snapshot.viewportHeight || 0,
      innerWidth: snapshot.viewportWidth || 0,
      getComputedStyle: (element) => {
        const nodeId = element?.getAttribute?.(PREVIEW_NODE_ID_ATTR);
        return nodeId ? (stylesByNodeId[nodeId] || EMPTY_COMPUTED_STYLE) : EMPTY_COMPUTED_STYLE;
      },
      _challengeResults: Array.isArray(snapshot.consoleResults) ? snapshot.consoleResults : [],
    },
  };
}

export function requestChallengePreviewSnapshot(iframeEl, { timeoutMs = PREVIEW_SNAPSHOT_TIMEOUT_MS } = {}) {
  const sourceWindow = iframeEl?.contentWindow;
  if (!sourceWindow || typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const requestId = `challenge-preview-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let settled = false;

    const cleanup = () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeoutId);
    };

    const settle = (snapshot) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(snapshot);
    };

    const handleMessage = (event) => {
      if (event.source !== sourceWindow) return;

      const data = event.data;
      if (!data || data.type !== PREVIEW_RESPONSE_TYPE || data.requestId !== requestId) return;

      settle(data.snapshot || null);
    };

    const timeoutId = setTimeout(() => settle(null), timeoutMs);

    window.addEventListener('message', handleMessage);
    sourceWindow.postMessage(
      {
        type: PREVIEW_REQUEST_TYPE,
        requestId,
      },
      '*',
    );
  });
}

export async function createChallengePreviewTestFrame(iframeEl, options) {
  const snapshot = await requestChallengePreviewSnapshot(iframeEl, options);
  if (snapshot) {
    return createChallengePreviewTestFrameFromSnapshot(snapshot);
  }

  try {
    if (iframeEl?.contentDocument || iframeEl?.contentWindow?.getComputedStyle) {
      return iframeEl;
    }
  } catch {
    // Sandboxed iframe access can throw SecurityError; fall through to the
    // empty preview frame so challenge grading fails closed.
  }

  return buildEmptyPreviewFrame();
}

export { PREVIEW_REQUEST_TYPE, PREVIEW_RESPONSE_TYPE, PREVIEW_NODE_ID_ATTR };
