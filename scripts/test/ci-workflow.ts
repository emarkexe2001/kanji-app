// Reads .github/workflows/ci.yml for the scripts tests (CI2, TEST7): its jobs and their steps.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/** The workflow file as it is. */
export const workflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');

/** The workflow without its comment lines. */
export const workflowCode = workflow
  .split('\n')
  .filter((line) => !line.trim().startsWith('#'))
  .join('\n');

/** Each job's lines (from `  <id>:` up to the next job), by job id. */
export const jobs: Map<string, string> = new Map(
  (workflowCode.split('\njobs:\n')[1] ?? '')
    .split(/\n(?= {2}\S+:\n)/)
    .map((job) => [/^ {2}(\S+):/.exec(job)?.[1] ?? '', job]),
);

/** The job with this id. Fails the test if there isn't one. */
export function job(id: string): string {
  const found = jobs.get(id);
  assert.ok(found, `no "${id}" job in ci.yml`);
  return found;
}

/** A job's steps (each `- ...` item and its lines). */
export const stepsOf = (jobId: string): string[] => job(jobId).split(/\n(?= *- )/);

/** The one step in the job whose `run:` line contains `command`. */
export function stepFor(jobId: string, command: string): string {
  const found = stepsOf(jobId).filter((step) => /run: .*/.exec(step)?.[0].includes(command));
  assert.equal(found.length, 1, `expected one step in "${jobId}" that runs ${command}, found ${found.length}`);
  return found[0]!;
}

/** The one step in the job whose `run:` line is exactly `run: <command>`. */
export function stepRunning(jobId: string, command: string): string {
  const found = stepsOf(jobId).filter((step) =>
    step.split('\n').some((line) => line.trim().replace(/^- /, '') === `run: ${command}`),
  );
  assert.equal(found.length, 1, `expected one step in "${jobId}" that runs ${command}, found ${found.length}`);
  return found[0]!;
}

/** The `if:` that skips a step on a docs-only pull request (CI2). */
export const SKIPPED_ON_DOCS_ONLY = "if: steps.changes.outputs.docs_only != 'true'";
