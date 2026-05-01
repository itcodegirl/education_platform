import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // @vitejs/plugin-react — lets vitest parse JSX in component tests
  // without a separate Babel config.
  plugins: [react()],
  test: {
    globals: true,
    // jsdom gives component tests a DOM + window. Pure-logic tests
    // (like the services layer) still work fine under jsdom; it's
    // only ~50ms slower per file.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      'tests/**',          // Playwright E2E tests
      'playwright-report',
      'test-results',
    ],
    // Placeholder env so `src/lib/supabaseClient.js` can evaluate at
    // import time. Production builds still require real values; this
    // only affects vitest. Tests that exercise auth/db behaviour
    // mock the client itself (see QuizView.test.jsx, AITutor.test.jsx),
    // so these placeholders are never actually used to make a
    // network call. Without them, any test file that transitively
    // imports the client (via providers, services, etc.) fails to
    // load, making `npm test` red on a fresh clone.
    env: {
      VITE_SUPABASE_URL: 'http://test.supabase.local',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
});
