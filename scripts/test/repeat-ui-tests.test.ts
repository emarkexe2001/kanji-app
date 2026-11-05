import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { DEFAULT_RUNS, parseArgs, repeatRuns } from '../repeat-ui-tests.ts';

describe('parseArgs', () => {
  it('does 10 runs when no number is given', () => {
    assert.equal(DEFAULT_RUNS, 10);
    assert.deepEqual(parseArgs([]), { runs: 10, vitestArgs: [] });
  });

  it('reads the number of runs', () => {
    assert.deepEqual(parseArgs(['3']), { runs: 3, vitestArgs: [] });
  });

  it('passes everything after the number on to Vitest', () => {
    assert.deepEqual(parseArgs(['3', '--reporter=verbose']), { runs: 3, vitestArgs: ['--reporter=verbose'] });
  });

  it('passes Vitest arguments on with the default number of runs when no number is given', () => {
    assert.deepEqual(parseArgs(['--reporter=verbose']), { runs: 10, vitestArgs: ['--reporter=verbose'] });
  });

  for (const bad of ['0', '2.5', 'ten', '']) {
    it(`rejects "${bad}" as the number of runs`, () => {
      assert.throws(() => parseArgs([bad]), /whole number of 1 or more/);
    });
  }
});

describe('repeatRuns', () => {
  const quiet = () => {};

  it('does every run when they all pass', () => {
    const runs: number[] = [];
    const result = repeatRuns(10, (run) => (runs.push(run), 0), quiet);
    assert.deepEqual(runs, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.deepEqual(result, { passed: 10 });
  });

  it('stops at the first run that fails and says which one', () => {
    const runs: number[] = [];
    const result = repeatRuns(10, (run) => (runs.push(run), run === 4 ? 1 : 0), quiet);
    assert.deepEqual(runs, [1, 2, 3, 4]);
    assert.deepEqual(result, { passed: 3, failedRun: 4 });
  });

  it('counts a failing first run as no runs passed', () => {
    assert.deepEqual(
      repeatRuns(10, () => 1, quiet),
      { passed: 0, failedRun: 1 },
    );
  });

  it('says which run is going and how it ended', () => {
    const lines: string[] = [];
    repeatRuns(
      2,
      (run) => (run === 2 ? 1 : 0),
      (line) => lines.push(line),
    );
    assert.match(lines.join('\n'), /run 1 of 2/);
    assert.match(lines.join('\n'), /run 2 of 2/);
    assert.match(lines.at(-1)!, /Run 2 of 2 failed .*1 run\(s\) passed/);
  });
});

describe('the test:ui:repeat script', () => {
  it('is in the web app, and runs scripts/repeat-ui-tests.ts', () => {
    const pkg = JSON.parse(readFileSync(new URL('../../apps/web/package.json', import.meta.url), 'utf8'));
    assert.match(pkg.scripts['test:ui:repeat'], /scripts\/repeat-ui-tests\.ts/);
  });

  it('is described in docs/testing.md', () => {
    const doc = readFileSync(new URL('../../docs/testing.md', import.meta.url), 'utf8');
    assert.match(doc, /test:ui:repeat/);
  });
});
