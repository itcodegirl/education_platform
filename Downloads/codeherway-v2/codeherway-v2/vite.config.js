import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core (shared across everything)
          'vendor-react': ['react', 'react-dom'],

          // Supabase client
          'vendor-supabase': ['@supabase/supabase-js'],

          // jsPDF (only needed for certificates)
          'vendor-jspdf': ['jspdf'],

          // Course data — each course is its own chunk
          'data-html': ['./src/data/html/course.js'],
          'data-css': ['./src/data/css/course.js'],
          'data-js': ['./src/data/js/course.js'],
          'data-react': ['./src/data/react/course.js'],

          // Quiz data (938 questions — heavy)
          'data-quizzes': ['./src/data/quizzes.js'],

          // Challenge data
          'data-challenges': ['./src/data/challenges.js'],

          // Reference data (cheatsheets, glossary, projects)
          'data-reference': [
            './src/data/reference/cheatsheets.js',
            './src/data/reference/glossary.js',
            './src/data/reference/projects.js',
          ],
        },
      },
    },
  },
});
