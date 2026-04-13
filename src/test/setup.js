// ═══════════════════════════════════════════════
// Vitest setup — runs once before each test file.
//
// Currently just wires @testing-library/jest-dom's custom matchers
// (toBeInTheDocument, toHaveTextContent, etc.) into Vitest's
// expect. Add mocks for browser APIs here if tests grow to need
// them (e.g. matchMedia, ResizeObserver, IntersectionObserver).
// ═══════════════════════════════════════════════

import '@testing-library/jest-dom/vitest';
