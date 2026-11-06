import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { isDocsOnly, parseChangedFiles } from '../docs-only-changes.ts';

describe('isDocsOnly', () => {
  it('is docs-only when every file is under docs/', () => {
    assert.equal(isDocsOnly(['docs/testing.md', 'docs/tickets/CI2_skip_slow_checks_on_docs_prs_ticket.md']), true);
  });

  it('is docs-only for a file under docs/ that is not Markdown', () => {
    assert.equal(isDocsOnly(['docs/mockups/card-limit.html']), true);
  });

  it('is docs-only when every file is a .md file outside docs/', () => {
    assert.equal(isDocsOnly(['.github/pull_request_template.md', 'README.md', 'apps/web/README.md']), true);
  });

  it('is docs-only for a mix of docs/ files and .md files', () => {
    assert.equal(isDocsOnly(['docs/standards/standards.md', '.github/pull_request_template.md']), true);
  });

  it('is not docs-only when a code file is changed alongside docs', () => {
    assert.equal(isDocsOnly(['docs/testing.md', 'scripts/test/docs-only-changes.test.ts']), false);
  });

  it('is not docs-only when only the CI workflow is changed', () => {
    assert.equal(isDocsOnly(['.github/workflows/ci.yml']), false);
  });

  it('is not docs-only when package.json is changed', () => {
    assert.equal(isDocsOnly(['package.json']), false);
    assert.equal(isDocsOnly(['docs/testing.md', 'package.json']), false);
  });

  it('only counts the docs/ folder at the repo root, not one inside a workspace', () => {
    assert.equal(isDocsOnly(['apps/web/docs/notes.ts']), false);
  });

  it('only counts files that end in .md', () => {
    assert.equal(isDocsOnly(['scripts/md-helper.ts']), false);
    assert.equal(isDocsOnly(['notes.mdx']), false);
  });

  // No changed files means something went wrong (e.g. the diff was taken against the wrong
  // commit), so it is safer to run every check than to skip them.
  it('is not docs-only when no files are changed', () => {
    assert.equal(isDocsOnly([]), false);
  });
});

describe('parseChangedFiles', () => {
  it('reads one path per line and ignores blank lines and line endings', () => {
    assert.deepEqual(parseChangedFiles('docs/testing.md\r\npackage.json\n\n'), ['docs/testing.md', 'package.json']);
  });

  it('reads empty output as no files', () => {
    assert.deepEqual(parseChangedFiles(''), []);
  });
});

describe('the CI workflow', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  /** The workflow's steps (each `- ...` item and its lines), without comments. */
  const steps = workflow
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n')
    .split(/\n(?= *- )/);
  /** The one step whose `run:` line contains `command`. */
  const stepFor = (command: string): string => {
    const found = steps.filter((step) => /run: .*/.exec(step)?.[0].includes(command));
    assert.equal(found.length, 1, `expected one step that runs ${command}, found ${found.length}`);
    return found[0]!;
  };
  /** The one step whose `run:` line is exactly `run: <command>`. */
  const stepRunning = (command: string): string => {
    const found = steps.filter((step) =>
      step.split('\n').some((line) => line.trim().replace(/^- /, '') === `run: ${command}`),
    );
    assert.equal(found.length, 1, `expected one step that runs ${command}, found ${found.length}`);
    return found[0]!;
  };
  const skippedOnDocsOnly = "if: steps.changes.outputs.docs_only != 'true'";

  it('keeps the one required job, "Typecheck and test", and does not use paths-ignore', () => {
    const jobs = workflow.split('\njobs:\n')[1] ?? '';
    assert.equal(jobs.match(/^ {2}\S+:$/gm)?.length, 1, 'expected exactly one job');
    assert.match(workflow, /name: Typecheck and test/);
    assert.doesNotMatch(steps.join('\n'), /paths-ignore/);
  });

  it('runs the docs-only rule on pull requests only, from the changed files', () => {
    const step = stepFor('scripts/docs-only-changes.ts');
    assert.match(step, /id: changes/);
    assert.match(step, /if: github\.event_name == 'pull_request'/);
    assert.match(step, /git diff --name-only --no-renames origin\/ci2-proof-base\.\.\.HEAD/);
    assert.match(step, /\$GITHUB_OUTPUT/);
  });

  for (const command of ['npm run format:check', 'npm run lint', 'npm run typecheck', 'npm test']) {
    it(`skips "${command}" on a docs-only PR`, () => {
      assert.ok(stepRunning(command).includes(skippedOnDocsOnly));
    });
  }

  it('still runs npm ci, the commit message check and the scripts tests on a docs-only PR', () => {
    assert.ok(!stepRunning('npm ci').includes('docs_only'));
    assert.ok(!stepFor('npm run check:commits').includes('docs_only'));
    assert.match(stepRunning('npm run test:scripts'), /if: steps\.changes\.outputs\.docs_only == 'true'/);
  });

  it('explains the docs-only rule in a comment', () => {
    assert.match(workflow, /# .*docs-only when every file it changes is under/);
    assert.match(workflow, /# .*still runs the commit message check and the\n# scripts tests/);
    assert.match(workflow, /# This is done with `if:` on the steps, not `paths-ignore`/);
  });
});

describe('standards 5.4', () => {
  it('says which checks run on a docs-only pull request', () => {
    const standards = readFileSync(new URL('../../docs/standards/standards.md', import.meta.url), 'utf8');
    const section = standards.split('### 5.4')[1]?.split('### 5.5')[0] ?? '';
    const bullet = section.split('\n').find((line) => /docs-only/i.test(line));
    assert.ok(bullet, 'no docs-only bullet in standards 5.4');
    for (const check of ['check:commits', 'test:scripts', 'format:check', 'lint', 'typecheck']) {
      assert.ok(bullet.includes(check), `the docs-only bullet doesn't mention ${check}`);
    }
  });
});
