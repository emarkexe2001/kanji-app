// TEST7: the end-to-end (e2e) test setup: the npm scripts, the Playwright config, the CI job,
// the ignored output folders and the docs. The e2e tests themselves are in apps/web/test/e2e/
// and run with `npm run test:e2e`.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import * as prettier from 'prettier';
import config from '../../apps/web/playwright.config.ts';
import { job, SKIPPED_ON_DOCS_ONLY, stepFor, stepRunning, stepsOf, workflowCode } from './ci-workflow.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const scriptsOf = (path: string): Record<string, string> => JSON.parse(read(path)).scripts;

describe('the e2e npm scripts', () => {
  const root = scriptsOf('package.json');
  const web = scriptsOf('apps/web/package.json');

  it('runs Playwright in apps/web with "npm run test:e2e"', () => {
    // Ends with `--`, so options after `npm run test:e2e --` (e.g. --headed) reach Playwright
    // instead of being read by npm (TEST7 review, R1).
    assert.equal(root['test:e2e'], 'npm run test:e2e -w @kanji/web --');
    assert.equal(web['test:e2e'], 'playwright test');
  });

  it('does not run the e2e tests with "npm test"', () => {
    // `npm test` runs each workspace's `test` script, then the scripts tests.
    assert.equal(root.test, 'npm run test --workspaces --if-present && npm run test:scripts');
    assert.equal(web.test, 'npm run test:unit && npm run test:ui');
    for (const name of ['test', 'test:unit', 'test:ui']) {
      assert.doesNotMatch(web[name] ?? '', /e2e|playwright/, `the web "${name}" script runs the e2e tests`);
    }
    assert.doesNotMatch(root.test ?? '', /e2e|playwright/);
  });
});

describe('the Playwright config', () => {
  it('finds every *.test.ts file in test/e2e/ by pattern, so a new file runs without changing any script', () => {
    assert.equal(config.testDir, 'test/e2e');
    assert.equal(config.testMatch, '**/*.test.ts');
  });

  it('uses Chromium only', () => {
    assert.equal(config.projects?.length, 1);
    assert.equal(config.projects[0]?.use?.defaultBrowserType, 'chromium');
  });

  it('builds the app and serves the build with vite preview, starting the server itself', () => {
    const server = Array.isArray(config.webServer) ? config.webServer[0] : config.webServer;
    assert.ok(server, 'no webServer in playwright.config.ts');
    assert.match(server.command, /^npm run build && npx vite preview --port (\d+) --strictPort$/);
    const port = /--port (\d+)/.exec(server.command)?.[1];
    assert.equal(server.url, `http://localhost:${port}`);
    assert.equal(config.use?.baseURL, `http://localhost:${port}`);
    // Never a server that is already running, which could be serving an old build.
    assert.equal(server.reuseExistingServer, false);
    // The build's output is shown, so a type error is visible when the build fails (review R3).
    assert.equal(server.stdout, 'pipe');
  });

  it('keeps a screenshot and a trace of each failed test in test-results/', () => {
    assert.equal(config.use?.screenshot, 'only-on-failure');
    assert.equal(config.use?.trace, 'retain-on-failure');
    assert.equal(config.outputDir, 'test-results');
  });
});

describe('the e2e CI job', () => {
  it('is its own job, "End-to-end tests", that doesn\'t wait for "Typecheck and test"', () => {
    assert.match(job('e2e'), /^ {4}name: End-to-end tests$/m);
    assert.doesNotMatch(job('e2e'), /^ {4}needs:/m);
  });

  it('installs Chromium and runs "npm run test:e2e"', () => {
    assert.match(
      stepFor('e2e', 'playwright install'),
      /run: npx playwright install --with-deps --only-shell chromium$/m,
    );
    stepRunning('e2e', 'npm run test:e2e');
  });

  it('uploads the screenshots and traces as an artifact when a test fails', () => {
    const upload = stepsOf('e2e').filter((step) => step.includes('actions/upload-artifact'));
    assert.equal(upload.length, 1, 'expected one upload-artifact step');
    assert.match(upload[0]!, /if: failure\(\)/);
    assert.match(upload[0]!, /apps\/web\/test-results\//);
  });

  // Agreed answer 5 (2026-11-11): like "Typecheck and test", the job always starts and reports,
  // but skips the heavy steps on a docs-only pull request. A push to main always runs them.
  it('skips the browser install and the Playwright run on a docs-only PR, using the same docs-only check (CI2)', () => {
    const check = stepFor('e2e', 'scripts/docs-only-changes.ts');
    assert.equal(check, stepFor('test', 'scripts/docs-only-changes.ts'), 'not the same docs-only check');
    assert.match(stepFor('e2e', 'playwright install'), new RegExp(escape(SKIPPED_ON_DOCS_ONLY)));
    assert.match(stepRunning('e2e', 'npm run test:e2e'), new RegExp(escape(SKIPPED_ON_DOCS_ONLY)));
  });

  it('still starts and reports on a docs-only PR: no paths-ignore, and the job itself always runs', () => {
    assert.doesNotMatch(workflowCode, /paths-ignore/);
    assert.doesNotMatch(job('e2e'), /^ {4}if:/m);
    assert.doesNotMatch(stepRunning('e2e', 'npm ci'), /docs_only/);
  });

  it('runs everything on a push to main: the docs-only check only runs on pull requests', () => {
    assert.match(stepFor('e2e', 'scripts/docs-only-changes.ts'), /if: github\.event_name == 'pull_request'/);
  });
});

describe("Playwright's output folders", () => {
  const outputs = ['apps/web/test-results/trace.zip', 'apps/web/playwright-report/index.html'];

  it('are ignored by git', () => {
    for (const path of outputs) {
      // check-ignore exits with an error when the path isn't ignored.
      execFileSync('git', ['check-ignore', '--no-index', '-q', path], { cwd: ROOT });
    }
  });

  it('are ignored by ESLint', async () => {
    const eslint = new ESLint({ cwd: ROOT });
    for (const path of ['apps/web/test-results/trace.js', 'apps/web/playwright-report/report.js']) {
      assert.equal(await eslint.isPathIgnored(path), true, `ESLint doesn't ignore ${path}`);
    }
  });

  it('are ignored by Prettier', async () => {
    for (const path of ['apps/web/test-results/data.json', 'apps/web/playwright-report/index.html']) {
      const info = await prettier.getFileInfo(`${ROOT}${path}`, { ignorePath: `${ROOT}.prettierignore` });
      assert.equal(info.ignored, true, `Prettier doesn't ignore ${path}`);
    }
  });
});

describe('the e2e docs', () => {
  it('say in docs/testing.md how to run the e2e tests, install the browser and open a trace', () => {
    const section = read('docs/testing.md').split('### End-to-end (e2e) tests')[1]?.split('\n## ')[0] ?? '';
    for (const text of ['npm run test:e2e', 'npx playwright install chromium', 'npx playwright show-trace']) {
      assert.ok(section.includes(text), `the e2e section of docs/testing.md doesn't mention ${text}`);
    }
  });

  it('no longer say e2e tests are "when added" in standards 3.2 and 4.1, and 4.2 says layout gets e2e tests', () => {
    const standards = read('docs/standards/standards.md');
    assert.doesNotMatch(standards, /when added/);
    const rules = standards.split('### 4.2')[1]?.split('\n## ')[0] ?? '';
    const bullet = rules.split('\n').find((line) => /e2e tests/i.test(line) && /layout/i.test(line));
    assert.ok(bullet, 'no standards 4.2 bullet saying layout requirements get e2e tests');
    assert.match(bullet, /screen-size/);
    // The manual browser check stays until the start page's checks are e2e tests (TEST7_5).
    assert.match(rules, /real browser.*360px, 640px and 1024px.*TEST7_5/);
  });
});

/** `text` with the characters that mean something in a regular expression escaped. */
function escape(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
