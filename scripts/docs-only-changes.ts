// Says whether a pull request is "docs-only" (CI2), so CI can skip the app's slow checks on it.
//
// A pull request is docs-only when every file it changes is under `docs/` or is a Markdown
// (`.md`) file anywhere in the repo. Any other file (code, tests, config, `package.json`, the
// CI workflow itself) makes it a normal pull request.
//
// CI pipes the changed file names into it, one per line, and adds its answer to $GITHUB_OUTPUT:
//
//   git diff --name-only --no-renames origin/main...HEAD | npx tsx scripts/docs-only-changes.ts
//
// It prints `docs_only=true` or `docs_only=false`.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** True when the file can't affect the app: it is under `docs/` or is a Markdown file. */
export function isDocsFile(path: string): boolean {
  return path.startsWith('docs/') || path.endsWith('.md');
}

/**
 * True when every changed file is a docs file.
 *
 * An empty list is NOT docs-only: if no changed files were found, something may have gone wrong
 * (e.g. the diff was taken against the wrong commit), so it is safer to run every check.
 */
export function isDocsOnly(changedFiles: string[]): boolean {
  return changedFiles.length > 0 && changedFiles.every(isDocsFile);
}

/** Reads `git diff --name-only` output: one path per line, ignoring blank lines. */
export function parseChangedFiles(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

function main(): void {
  const changedFiles = parseChangedFiles(readFileSync(0, 'utf8'));
  const docsOnly = isDocsOnly(changedFiles);
  console.error(
    `${changedFiles.length} changed file(s). ${docsOnly ? 'Docs-only: the slow checks are skipped.' : 'Not docs-only: every check runs.'}`,
  );
  console.log(`docs_only=${docsOnly}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
