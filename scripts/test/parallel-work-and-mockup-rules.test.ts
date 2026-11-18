// Checks two process rules agreed on 2026-11-18 (from the PR #120/#125 retro): one finalised
// mockup with every question (standards 5.1), and the limit on parallel ticket work with
// merging one pull request at a time (standards 5.4, with a pointer in testing.md). These are
// docs, so the tests check key phrases, not exact wording or whitespace.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const STANDARDS_PATH = resolve(ROOT, 'docs/standards/standards.md');
const TESTING_PATH = resolve(ROOT, 'docs/testing.md');
const TOOL6_PATH = 'docs/tickets/tool/TOOL6_e2e_port_per_run_ticket.md';

const read = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

/** Collapses runs of whitespace, so line breaks in the prose don't matter. */
const flat = (text: string) => text.replace(/\s+/g, ' ').trim();

/** The text under a markdown heading (any level), up to the next heading of that level or higher. */
function section(text: string, heading: RegExp): string {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => heading.test(line));
  assert.ok(start !== -1, `no heading matching ${heading}`);
  const level = lines[start]!.match(/^#+/)![0].length;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => {
    const hashes = line.match(/^(#+)\s/);
    return hashes !== null && hashes[1]!.length <= level;
  });
  return (end === -1 ? rest : rest.slice(0, end)).join('\n');
}

/** The top-level bullets of a block of markdown, flattened. */
const bullets = (text: string) =>
  text
    .split(/^- /m)
    .slice(1)
    .map((bullet) => flat(bullet));

/** The one bullet that starts with the given bold label. */
function bullet(text: string, label: string): string {
  const found = bullets(text).filter((b) => b.startsWith(`**${label}**`));
  assert.equal(found.length, 1, `expected one "**${label}**" bullet, found ${found.length}`);
  return found[0]!;
}

const standards = () => read(STANDARDS_PATH);
const beforeStarting = () => section(standards(), /^###\s+5\.1\s+Before starting/);
const pullRequests = () => section(standards(), /^###\s+5\.4\s+Pull requests and merging/);

describe('standards 5.1 one finalised mockup', () => {
  const rule = () => bullet(beforeStarting(), 'One finalised mockup with every question.');

  it('comes straight after the "Mockup first for UI work" bullet', () => {
    const labels = bullets(beforeStarting()).map((b) => b.match(/^\*\*([^*]+)\*\*/)?.[1]);
    const mockupFirst = labels.indexOf('Mockup first for UI work.');
    assert.ok(mockupFirst !== -1, 'no "Mockup first for UI work." bullet');
    assert.equal(labels[mockupFirst + 1], 'One finalised mockup with every question.');
  });

  it('asks for one finalised mockup showing every question, with the recommended option marked', () => {
    assert.match(rule(), /one finalised mockup that shows every question for the ticket/);
    assert.match(rule(), /recommended option marked/);
  });

  it('draws each option where it can, and puts questions with nothing to draw on a "Questions" panel', () => {
    assert.match(rule(), /Draw each option where it can be drawn/);
    assert.match(rule(), /nothing to draw/);
    assert.match(rule(), /"Questions" panel in the mockup/);
  });

  it('is approved before any feature work starts, and the answers go into the ticket from it', () => {
    assert.match(rule(), /approved before any feature work starts/);
    assert.match(rule(), /agreed answers go into the ticket from it/);
  });

  it('draws a decision made later into the same mockup', () => {
    assert.match(rule(), /decision made later is drawn into the same mockup/);
  });
});

describe('standards 5.4 parallel ticket work', () => {
  const limit = () => bullet(pullRequests(), 'At most 2 code tickets at once, until TOOL6.');
  const oneAtATime = () => bullet(pullRequests(), 'Merge one pull request at a time.');

  it('allows at most 2 code tickets at the same time, not counting docs-only pull requests', () => {
    assert.match(limit(), /at most 2 code tickets at the same time/);
    assert.match(limit(), /Docs-only pull requests .*don't count/);
  });

  it('says to run the e2e tests with --workers=1 during parallel work and treat CI as the gate', () => {
    assert.match(limit(), /`npm run test:e2e -- --workers=1`/);
    assert.match(limit(), /treat CI as the gate/);
  });

  it('says to look at the limit again once TOOL6 is merged, and to keep it until it is changed', () => {
    assert.match(limit(), new RegExp(TOOL6_PATH.replace(/\./g, '\\.')));
    assert.match(limit(), /look at the 2-ticket limit again/);
    assert.match(limit(), /keep it until it is changed/);
  });

  it('points to a TOOL6 ticket that exists', () => {
    assert.doesNotThrow(() => readFileSync(resolve(ROOT, TOOL6_PATH)), `${TOOL6_PATH} is missing`);
  });

  it('says to merge one at a time, then update the next branch from main and check it again', () => {
    assert.match(oneAtATime(), /After each merge, update the next pull request's branch from `main`/);
    assert.match(oneAtATime(), /check it again before it merges/);
    assert.match(oneAtATime(), /\bCI\b/);
    assert.match(oneAtATime(), /in-person check if it changes what the user sees/);
  });

  it('is pointed to from the e2e section of testing.md', () => {
    const e2e = flat(section(read(TESTING_PATH), /^###\s+End-to-end \(e2e\) tests/));
    assert.match(e2e, /in parallel on one machine, run them with `npm run test:e2e -- --workers=1`/);
    assert.match(
      e2e,
      /treat CI as the gate \(\[standards 5\.4\]\(standards\/standards\.md#54-pull-requests-and-merging\)\)/,
    );
  });
});
