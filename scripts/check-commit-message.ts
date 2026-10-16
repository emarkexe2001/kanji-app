// Checks commit messages against docs/standards/standards.md section 5.5.
// Used by both the commit-msg hook (.husky/commit-msg) and CI, so the rules live in one place.
//
//   tsx scripts/check-commit-message.ts --file <path>    check one message file (the hook)
//   tsx scripts/check-commit-message.ts --range <a..b>   check every commit in a git range (CI)
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const MAX_TITLE_LENGTH = 72;

// A line like "Co-Authored-By: Name <email>" or "Refs: #12".
const TRAILER_LINE = /^[A-Za-z0-9-]+: \S/;

// The line git adds above the diff in `git commit --verbose`. Everything below it is dropped.
const SCISSORS_LINE = /^# -+ >8 -+$/;

// Removes what git itself strips before saving a message: comment lines and the verbose diff.
export function stripGitComments(message: string): string {
  const kept: string[] = [];
  for (const line of message.replace(/\r\n/g, '\n').split('\n')) {
    if (SCISSORS_LINE.test(line)) break;
    if (!line.startsWith('#')) kept.push(line);
  }
  return kept.join('\n');
}

// Merge commits and git's own revert messages are written by git, so they are allowed through.
export function isExempt(title: string): boolean {
  return title.startsWith('Merge ') || /^Revert ".*"$/.test(title);
}

// Returns one message per broken rule. An empty list means the message is fine.
export function checkCommitMessage(message: string): string[] {
  const lines = message
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd());
  while (lines.length > 0 && lines[0] === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

  const title = lines[0] ?? '';
  if (title === '') return ['The commit message is empty.'];
  if (isExempt(title)) return [];

  const errors: string[] = [];
  if (title.length > MAX_TITLE_LENGTH) {
    errors.push(`The title is ${title.length} characters long; it must be ${MAX_TITLE_LENGTH} or fewer.`);
  }
  if (lines.length > 1 && lines[1] !== '') {
    errors.push('Line 2 must be blank, to separate the title from the description.');
  }
  if (!hasDescription(lines.slice(1))) {
    errors.push('There is no description. Add a blank line after the title, then describe the change.');
  }
  return errors;
}

// The description is the body without its trailer block (e.g. Co-Authored-By), which doesn't count.
function hasDescription(body: string[]): boolean {
  const paragraphs = body
    .join('\n')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.split('\n').filter((line) => line !== ''))
    .filter((paragraph) => paragraph.length > 0);
  const last = paragraphs[paragraphs.length - 1];
  if (last && last.every((line) => TRAILER_LINE.test(line))) paragraphs.pop();
  return paragraphs.length > 0;
}

function formatFailure(title: string, errors: string[], sha?: string): string {
  const heading = sha ? `Commit ${sha} "${title}"` : `Commit message "${title}"`;
  return [
    `${heading} breaks the commit message rules (docs/standards/standards.md 5.5):`,
    ...errors.map((error) => `  - ${error}`),
  ].join('\n');
}

function checkFile(path: string): boolean {
  const message = stripGitComments(readFileSync(path, 'utf8'));
  const errors = checkCommitMessage(message);
  if (errors.length === 0) return true;
  const title = message.trim().split('\n')[0] ?? '';
  console.error(formatFailure(title, errors));
  console.error(`\nYour message was saved in ${path}.`);
  console.error('Fix it in a file and commit again with: git commit -F <file>');
  return false;
}

function git(...args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' });
}

function checkRange(range: string): boolean {
  const shas = git('rev-list', '--reverse', range).split('\n').filter(Boolean);
  let ok = true;
  for (const sha of shas) {
    // Merge commits (more than one parent) are made by git or GitHub, not written by hand.
    const parents = git('rev-list', '--parents', '-n', '1', sha).trim().split(' ').length - 1;
    if (parents > 1) continue;
    const message = git('log', '-1', '--format=%B', sha);
    const errors = checkCommitMessage(message);
    if (errors.length > 0) {
      ok = false;
      console.error(formatFailure(message.trim().split('\n')[0] ?? '', errors, sha));
    }
  }
  const summary = `Checked ${shas.length} commit(s) in ${range}`;
  console.log(ok ? `${summary}: all OK.` : `\n${summary}: some broke the rules.`);
  return ok;
}

function main(args: string[]): number {
  const [mode, value] = args;
  if (mode === '--file' && value) return checkFile(value) ? 0 : 1;
  if (mode === '--range' && value) return checkRange(value) ? 0 : 1;
  console.error('Usage: tsx scripts/check-commit-message.ts --file <path> | --range <from..to>');
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
