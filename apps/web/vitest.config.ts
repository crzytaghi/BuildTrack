import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // npm hoists react-router to the repo root, where Node would resolve the mobile app's
  // React for it. Pre-bundle the router with this app's React so components that use
  // the router render with a single React copy in tests.
  resolve: { dedupe: ['react', 'react-dom'] },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    deps: { optimizer: { web: { enabled: true, include: ['react-router-dom', 'react-router'] } } },
  },
});
