// Runs the web UI tests several times in a row and stops at the first run that fails (TEST6).
// A test that only times out on a busy machine shows up here, where one run might miss it.
//
//   npm run test:ui:repeat -w @kanji/web                    10 runs
//   npm run test:ui:repeat -w @kanji/web -- 3               3 runs
//   npm run test:ui:repeat -w @kanji/web -- 3 --reporter=verbose
//                                                           extra arguments go to `vitest run`
//
// It runs `npm run test:ui` in apps/web through the shell, so it works the same on Windows
// (Git Bash or cmd.exe) and on Linux in CI.
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const DEFAULT_RUNS = 10;

export interface RepeatOptions {
  /** How many runs to do. */
  runs: number;
  /** Arguments passed on to `vitest run`. */
  vitestArgs: string[];
}

/** Reads the arguments: an optional number of runs first (a whole number, 1 or more), then anything for Vitest. */
export function parseArgs(args: string[]): RepeatOptions {
  const [first, ...rest] = args;
  if (first === undefined || first.startsWith('-')) return { runs: DEFAULT_RUNS, vitestArgs: args };
  if (!/^[1-9]\d*$/.test(first)) {
    throw new Error(`The number of runs must be a whole number of 1 or more, not "${first}".`);
  }
  return { runs: Number(first), vitestArgs: rest };
}

export interface RepeatResult {
  /** How many runs passed. */
  passed: number;
  /** The run (from 1) that failed, if one did. No more runs are done after it. */
  failedRun?: number;
}

/**
 * Calls `runOnce` up to `runs` times, with the run number (from 1). It returns the exit code of
 * that run; anything other than 0 is a failure, and the runs stop there.
 */
export function repeatRuns(
  runs: number,
  runOnce: (run: number) => number,
  log: (line: string) => void = console.log,
): RepeatResult {
  for (let run = 1; run <= runs; run++) {
    log(`\n=== UI test run ${run} of ${runs} ===`);
    const code = runOnce(run);
    if (code !== 0) {
      log(`\nRun ${run} of ${runs} failed (exit code ${code}). Stopping here; ${run - 1} run(s) passed before it.`);
      return { passed: run - 1, failedRun: run };
    }
  }
  log(`\nAll ${runs} run(s) passed.`);
  return { passed: runs };
}

const WEB_APP = fileURLToPath(new URL('../apps/web/', import.meta.url));

/** One run of the UI tests: `npm run test:ui` in apps/web, with its output shown as it goes. */
function runUiTests(vitestArgs: string[]): number {
  const args = ['run', 'test:ui', ...(vitestArgs.length ? ['--', ...vitestArgs] : [])];
  // shell: true finds npm on Windows (npm.cmd) as well as on Linux.
  const result = spawnSync('npm', args, { cwd: WEB_APP, stdio: 'inherit', shell: true });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

function main(args: string[]): number {
  let options: RepeatOptions;
  try {
    options = parseArgs(args);
  } catch (error) {
    console.error((error as Error).message);
    console.error('Usage: npm run test:ui:repeat -w @kanji/web -- [runs] [vitest arguments]');
    return 2;
  }
  return repeatRuns(options.runs, () => runUiTests(options.vitestArgs)).failedRun ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
