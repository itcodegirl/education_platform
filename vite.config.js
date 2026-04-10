import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
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

          // Course data — each course is its own chunk (lessons + quizzes + challenges)
          'data-html': ['./src/data/html/course.js', './src/data/html/quizzes.js', './src/data/html/challenges.js'],
          'data-css': ['./src/data/css/course.js', './src/data/css/quizzes.js', './src/data/css/challenges.js'],
          'data-js': ['./src/data/js/course.js', './src/data/js/quizzes.js', './src/data/js/challenges.js'],
          'data-react': ['./src/data/react/course.js', './src/data/react/quizzes.js', './src/data/react/challenges.js'],

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
