import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// UI / component tests (see docs/testing.md). Any *.test.ts(x) file under test/ui-tests/ is picked up.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['test/ui-tests/**/*.test.{ts,tsx}'],
      setupFiles: ['test/setup.ts'],
      restoreMocks: true,
    },
  }),
);
