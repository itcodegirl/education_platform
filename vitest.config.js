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
  },
});
