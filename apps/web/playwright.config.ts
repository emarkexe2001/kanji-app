import { defineConfig, devices } from '@playwright/test';

// End-to-end (e2e) tests (TEST7, see docs/testing.md). They run the production build in a real
// browser (Chromium only, for now), so they can check what the UI tests in jsdom can't: layout,
// sizes, focus, and the device's settings.
//
// Any *.test.ts file under test/e2e/ is picked up, so a new test file runs without changing any
// script.

/** The port the production build is served on. Not Vite's usual 4173, so a preview server you
 * started yourself isn't mistaken for this one. */
const PORT = 4174;

export default defineConfig({
  testDir: 'test/e2e',
  testMatch: '**/*.test.ts',
  // Failures keep their screenshot and trace here (CI uploads the folder as an artifact).
  outputDir: 'test-results',
  fullyParallel: true,
  // A test.only left in by mistake fails the CI run instead of skipping every other test.
  forbidOnly: !!process.env.CI,
  // No retries: a test that only passes on the second try is a problem to fix, not to hide.
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Builds the app and serves the build with `vite preview`, the closest to what users get. The
  // server is started before the tests and stopped after them. It is never reused, so the tests
  // always run against a fresh build of the code in front of them.
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
    // Shows the build's output, so a type error from `tsc` (which writes to stdout) is shown
    // when the build fails, not only "not able to start" (TEST7 review, R3).
    stdout: 'pipe',
  },
});
