// ═══════════════════════════════════════════════
// Vitest setup — runs once before each test file.
//
// Currently just wires @testing-library/jest-dom's custom matchers
// (toBeInTheDocument, toHaveTextContent, etc.) into Vitest's
// expect. Add mocks for browser APIs here if tests grow to need
// them (e.g. matchMedia, ResizeObserver, IntersectionObserver).
// ═══════════════════════════════════════════════

import '@testing-library/jest-dom/vitest';

// Node 22 exposes an experimental global localStorage getter that warns unless
// launched with a file path. Vitest tests should use deterministic memory state.
class TestStorage {
  #items = new Map();

  get length() {
    return this.#items.size;
  }

  clear() {
    this.#items.clear();
  }

  getItem(key) {
    const normalizedKey = String(key);
    return this.#items.has(normalizedKey) ? this.#items.get(normalizedKey) : null;
  }

  key(index) {
    return Array.from(this.#items.keys())[index] ?? null;
  }

  removeItem(key) {
    this.#items.delete(String(key));
  }

  setItem(key, value) {
    this.#items.set(String(key), String(value));
  }
}

if (typeof window !== 'undefined') {
  const localStorage = new TestStorage();

  Object.defineProperty(globalThis, 'Storage', {
    configurable: true,
    writable: true,
    value: TestStorage,
  });

  Object.defineProperty(window, 'Storage', {
    configurable: true,
    writable: true,
    value: TestStorage,
  });

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: localStorage,
  });

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    writable: true,
    value: localStorage,
  });
}
