// TEST7: the end-to-end (e2e) test setup: the npm scripts, the Playwright config, the CI job,
// the ignored output folders and the docs. The e2e tests themselves are in apps/web/test/e2e/
// and run with `npm run test:e2e`. TOOL6 added the port per run, set with `E2E_PORT`.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import * as prettier from 'prettier';
import config, { e2ePort } from '../../apps/web/playwright.config.ts';
import { job, SKIPPED_ON_DOCS_ONLY, stepFor, stepRunning, stepsOf, workflowCode } from './ci-workflow.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const scriptsOf = (path: string): Record<string, string> => JSON.parse(read(path)).scripts;
const CONFIG_URL = new URL('../../apps/web/playwright.config.ts', import.meta.url).href;

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

/**
 * Loads playwright.config.ts in a new Node process with `E2E_PORT` set to `port` (left out when
 * `undefined`), as `npm run test:e2e` does, so the port this test process was started with doesn't
 * matter. Returns the exit code, the server's command and url and `use.baseURL`, and stderr.
 */
function loadConfig(port: string | undefined) {
  const env: NodeJS.ProcessEnv = { ...process.env };
  delete env.E2E_PORT;
  if (port !== undefined) env.E2E_PORT = port;
  const code = `const { default: c } = await import(${JSON.stringify(CONFIG_URL)});
    console.log(JSON.stringify({ command: c.webServer.command, url: c.webServer.url, baseURL: c.use.baseURL }));`;
  const run = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', code], {
    cwd: ROOT,
    env,
    encoding: 'utf8',
  });
  const loaded = run.status === 0 ? (JSON.parse(run.stdout) as ReturnType<typeof servedOn>) : null;
  return { status: run.status, loaded, stderr: run.stderr };
}

/** What the config should hold for a run on `port`. */
function servedOn(port: number) {
  return {
    command: `npm run build && npx vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    baseURL: `http://localhost:${port}`,
  };
}

/** The message a bad `E2E_PORT` stops the run with. */
const badPortMessage = (value: string) => `E2E_PORT must be a whole number from 1024 to 65535, not "${value}".`;

describe('the e2e port, set with E2E_PORT (TOOL6)', () => {
  it('is 4174 when E2E_PORT is unset or empty, for the server command, its url and baseURL', () => {
    assert.equal(e2ePort(undefined), 4174);
    assert.equal(e2ePort(''), 4174);
    for (const port of [undefined, '']) {
      const { status, loaded, stderr } = loadConfig(port);
      assert.equal(status, 0, stderr);
      assert.deepEqual(loaded, servedOn(4174), `E2E_PORT ${port === undefined ? 'unset' : 'empty'}`);
    }
  });

  it('uses a valid E2E_PORT for the server command (keeping --strictPort), its url and baseURL', () => {
    for (const [value, port] of [
      ['4180', 4180],
      ['1024', 1024],
      ['65535', 65535],
    ] as const) {
      assert.equal(e2ePort(value), port);
    }
    const { status, loaded, stderr } = loadConfig('4180');
    assert.equal(status, 0, stderr);
    assert.deepEqual(loaded, servedOn(4180));
  });

  it("throws a message naming E2E_PORT for each kind of value that isn't a whole number from 1024 to 65535", () => {
    const bad = {
      'not a number': ['abc', '4180abc'],
      'below 1024': ['0', '80', '1023'],
      'above 65535': ['65536', '70000'],
      'not whole': ['4174.5', '4180.0'],
      'with spaces': [' 4180', '4180 '],
      'with a sign': ['-4180', '+4180'],
      'another way of writing a number': ['0x10F4', '1e4', '4_180', '4,180'],
    };
    for (const [kind, values] of Object.entries(bad)) {
      for (const value of values) {
        assert.throws(() => e2ePort(value), { message: badPortMessage(value) }, `${kind}: "${value}"`);
      }
    }
  });

  it('stops the run with that message when the config loads, before Playwright starts a server', () => {
    const { status, loaded, stderr } = loadConfig('abc');
    assert.notEqual(status, 0);
    assert.equal(loaded, null);
    assert.ok(stderr.includes(badPortMessage('abc')), stderr);
  });

  // Agreed answer 4 (2026-11-19, #133): a leading zero is the same port, so it is accepted.
  it('accepts "04180" as port 4180, serving on --port 4180 (agreed answer 4)', () => {
    assert.equal(e2ePort('04180'), 4180);
    const { status, loaded, stderr } = loadConfig('04180');
    assert.equal(status, 0, stderr);
    assert.deepEqual(loaded, servedOn(4180));
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

  it("doesn't set E2E_PORT, so CI serves on port 4174 (TOOL6)", () => {
    assert.doesNotMatch(workflowCode, /E2E_PORT/);
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
    // Only the e2e lines of the 3.2 folder tree and the 4.1 table, so "when added" elsewhere in
    // the standards doesn't fail this test (TEST7 review, R4).
    const section = (from: string, to: string) => standards.split(from)[1]?.split(to)[0] ?? '';
    const treeLine = section('### 3.2', '### 3.3')
      .split('\n')
      .find((line) => /^\s*e2e\//.test(line));
    const tableRow = section('### 4.1', '### 4.2')
      .split('\n')
      .find((line) => line.startsWith('| End-to-end (e2e)'));
    assert.ok(treeLine, 'no e2e/ line in the standards 3.2 folder tree');
    assert.ok(tableRow, 'no End-to-end (e2e) row in the standards 4.1 table');
    assert.doesNotMatch(treeLine, /when added/);
    assert.doesNotMatch(tableRow, /when added/);
    const rules = standards.split('### 4.2')[1]?.split('\n## ')[0] ?? '';
    const bullet = rules.split('\n').find((line) => /e2e tests/i.test(line) && /layout/i.test(line));
    assert.ok(bullet, 'no standards 4.2 bullet saying layout requirements get e2e tests');
    assert.match(bullet, /screen-size/);
    // The manual browser check stays until the start page's checks are e2e tests (TEST7_5).
    assert.match(rules, /real browser.*360px, 640px and 1024px.*TEST7_5/);
  });

  // TEST7 review R7 (agreed 2026-11-11).
  it('say in standards 2.1 and 5.3 to run "npm run test:e2e" before a pull request, for any change outside docs/', () => {
    const standards = read('docs/standards/standards.md');
    const section = (from: string, to: string) => standards.split(from)[1]?.split(to)[0] ?? '';
    for (const [name, text] of [
      ['2.1', section('### 2.1', '### 2.2')],
      ['5.3', section('### 5.3', '### 5.4')],
    ] as const) {
      const checks = text.split('\n').find((line) => line.includes('`npm run format:check`'));
      assert.ok(checks, `no checks line in standards ${name}`);
      assert.match(checks, /`npm run test:e2e`.* for any change outside `docs\/`/, `standards ${name}`);
    }
  });
});

describe('the e2e port docs (TOOL6)', () => {
  const lf = (text: string) => text.replace(/\r\n/g, '\n');
  const flat = (text: string) => text.replace(/\s+/g, ' ').trim();
  const e2e = () => lf(read('docs/testing.md')).split('### End-to-end (e2e) tests')[1]?.split('\n## ')[0] ?? '';

  it('explain E2E_PORT in docs/testing.md in a row straight after the port 4174 row, for bash and PowerShell', () => {
    const lines = e2e().split('\n');
    const row4174 = lines.findIndex((line) => line.startsWith('| `npm run test:e2e` |') && line.includes('port 4174'));
    assert.ok(row4174 !== -1, 'no `npm run test:e2e` row saying port 4174');
    const next = lines[row4174 + 1] ?? '';
    assert.ok(next.includes('`E2E_PORT=4180 npm run test:e2e` (bash)'), `the row after the 4174 row: ${next}`);
    assert.ok(
      next.includes("`$env:E2E_PORT = '4180'; npm run test:e2e` (PowerShell)"),
      `the row after the 4174 row: ${next}`,
    );
  });

  it('give the rule "when several runs share a machine, give each its own port", the 1024 to 65535 range and --strictPort', () => {
    const paragraph = flat(e2e().split('**A port per run (TOOL6).**')[1]?.split('\n\n')[0] ?? '');
    assert.ok(paragraph, 'no "A port per run (TOOL6)." paragraph in the e2e section of docs/testing.md');
    assert.match(paragraph, /\*\*When several runs share a machine, give each its own port\*\*/);
    assert.match(paragraph, /Left unset \(or empty\), it is 4174/);
    assert.match(paragraph, /whole number from 1024 to 65535/);
    assert.match(paragraph, /message naming `E2E_PORT`/);
    assert.match(paragraph, /`--strictPort` stays/);
  });

  it('show a bash and a Windows PowerShell example, each with --workers=1', () => {
    const block = (lang: string) => new RegExp('```' + lang + '\\n([\\s\\S]*?)```').exec(e2e())?.[1] ?? '';
    assert.match(block('bash'), /^E2E_PORT=4180 npm run test:e2e -- --workers=1$/m);
    assert.match(block('powershell'), /^\$env:E2E_PORT = '4180'; npm run test:e2e -- --workers=1$/m);
    assert.match(block('powershell'), /Remove-Item Env:E2E_PORT goes back to 4174/);
  });

  it('say in standards 5.4, straight after "At most 2 code tickets at once", that each e2e run sharing a machine uses its own E2E_PORT', () => {
    const rules = lf(read('docs/standards/standards.md')).split('### 5.4')[1]?.split('\n### ')[0] ?? '';
    const bullets = rules
      .split(/^- /m)
      .slice(1)
      .map((text) => flat(text));
    const limit = bullets.findIndex((text) => text.startsWith('**At most 2 code tickets at once.**'));
    assert.ok(limit !== -1, 'no "At most 2 code tickets at once." bullet in standards 5.4');
    const rule = bullets[limit + 1] ?? '';
    assert.ok(rule.startsWith('**A port per e2e run.**'), `the bullet after the 2-ticket bullet: ${rule}`);
    assert.match(rule, /Each e2e run that shares a machine with another uses its own port, set with `E2E_PORT`/);
    assert.match(rule, /\(see \[testing\.md\]\(\.\.\/testing\.md#end-to-end-e2e-tests\)\)/);
    const mentions = bullets.filter((text) => text.includes('E2E_PORT'));
    assert.equal(mentions.length, 1, 'expected one standards 5.4 bullet about E2E_PORT');
  });
});

/** `text` with the characters that mean something in a regular expression escaped. */
function escape(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
