// Checks the pull request template (PROC1) and the standards bullet that points to it.
// GitHub only pre-fills a new PR from the template once it is on `main`, so that part is
// checked by hand after merging. These tests check what a reader of the template sees:
// its headings, fields and key phrases, not its exact wording or whitespace.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const TEMPLATE_PATH = resolve(ROOT, '.github/pull_request_template.md');
const STANDARDS_PATH = resolve(ROOT, 'docs/standards/standards.md');

const read = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const template = () => read(TEMPLATE_PATH);

/** Collapses runs of whitespace, so line breaks in the prose don't matter. */
const flat = (text: string) => text.replace(/\s+/g, ' ');

/** The `## ` headings of a markdown file, in order. */
const headings = (text: string) => [...text.matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1]!);

/** The text under a `## ` heading, up to the next `## ` heading. */
function section(text: string, name: string): string {
  const parts = text.split(/^##\s+/m);
  const found = parts.find((part) => part.split('\n')[0]!.trim() === name);
  assert.ok(found !== undefined, `the template has no "## ${name}" section`);
  return found.slice(found.indexOf('\n') + 1);
}

/** The text under a bold group label (e.g. `**Agreed answers**`), up to the next label. */
function group(text: string, label: string): string {
  const parts = text.split(/^\*\*([^*\n]+)\*\*\s*$/m);
  const index = parts.findIndex((part, i) => i % 2 === 1 && part.trim() === label);
  assert.ok(index !== -1, `the Test Scenarios section has no "**${label}**" group`);
  return parts[index + 1]!;
}

/** The text of the HTML comments (the guidance the rendered PR hides), flattened. */
const comments = (text: string) => flat([...text.matchAll(/<!--([\s\S]*?)-->/g)].map((m) => m[1]).join(' '));

const checkboxes = (text: string) => text.match(/^\s*- \[ \]\s+\S/gm) ?? [];

describe('pull request template', () => {
  it('exists at .github/pull_request_template.md', () => {
    assert.ok(existsSync(TEMPLATE_PATH), 'no .github/pull_request_template.md');
  });

  it('has the Ticket and Test Scenarios sections', () => {
    const found = headings(template());
    assert.ok(found.includes('Ticket'), `headings: ${found.join(', ')}`);
    assert.ok(found.includes('Test Scenarios'), `headings: ${found.join(', ')}`);
  });

  it('has the other sections, in order', () => {
    assert.deepEqual(headings(template()), [
      'Ticket',
      'Summary',
      'Test Scenarios',
      'Test counts',
      'Break-and-restore',
      'Browser check',
      'In-person check',
      'After merging',
    ]);
  });

  describe('Ticket', () => {
    it('has a Ticket field linking to where the ticket ends up on main', () => {
      const field = section(template(), 'Ticket').match(/^\*\*Ticket:\*\*\s*\[([^\]]+)\]\(([^)]+)\)/m);
      assert.ok(field, 'no "**Ticket:** [CODE](link)" field');
      assert.ok(
        field[2]!.startsWith('../blob/main/docs/tickets/completed_tickets/'),
        `the link is "${field[2]}", not ../blob/main/docs/tickets/completed_tickets/...`,
      );
    });

    it('says in its comment that the ticket is in "Files changed" until merged', () => {
      const guidance = comments(section(template(), 'Ticket'));
      assert.match(guidance, /Files changed/);
      assert.match(guidance, /merged/i);
    });
  });

  describe('Test Scenarios', () => {
    it('asks for the test file and test name for each scenario', () => {
      const scenarios = section(template(), 'Test Scenarios');
      assert.match(comments(scenarios), /test file/i);
      assert.match(comments(scenarios), /test name/i);
      assert.ok(checkboxes(scenarios).length >= 1, 'no "- [ ]" checkbox');
    });

    it('asks for a reason when a scenario has no test', () => {
      const guidance = comments(section(template(), 'Test Scenarios'));
      assert.match(guidance, /no test, say why/i);
      assert.match(guidance, /follow-up ticket/i);
    });

    it('has a checkbox group for the scenarios, the agreed answers and the "left out" items', () => {
      const scenarios = section(template(), 'Test Scenarios');
      for (const label of ['Possible Test Scenarios', 'Agreed answers', 'Left out ("no X")']) {
        assert.ok(checkboxes(group(scenarios, label)).length >= 1, `no "- [ ]" checkbox under "${label}"`);
      }
      assert.match(comments(scenarios), /agreed answer/i);
      assert.match(comments(scenarios), /left out/i);
    });
  });

  describe('sections that can be deleted', () => {
    const deletable: [string, (text: string) => string][] = [
      ['Agreed answers', (t) => group(section(t, 'Test Scenarios'), 'Agreed answers')],
      ['Left out', (t) => group(section(t, 'Test Scenarios'), 'Left out ("no X")')],
      ['Browser check', (t) => section(t, 'Browser check')],
      ['In-person check', (t) => section(t, 'In-person check')],
      ['After merging', (t) => section(t, 'After merging')],
    ];

    for (const [name, get] of deletable) {
      it(`${name} says "Delete if" in its comment`, () => {
        assert.match(comments(get(template())), /Delete if/);
      });
    }

    it('Browser check and In-person check can be deleted when nothing changes on screen', () => {
      for (const name of ['Browser check', 'In-person check']) {
        assert.match(comments(section(template(), name)), /Delete if the PR changes nothing on screen/, name);
      }
    });

    it('the sections every PR fills in do not say "Delete if"', () => {
      const t = template();
      const required = [
        ['Ticket', section(t, 'Ticket')],
        ['Summary', section(t, 'Summary')],
        ['Possible Test Scenarios', group(section(t, 'Test Scenarios'), 'Possible Test Scenarios')],
        ['Test counts', section(t, 'Test counts')],
        ['Break-and-restore', section(t, 'Break-and-restore')],
      ];
      for (const [name, text] of required) {
        assert.doesNotMatch(comments(text!), /Delete if/, name);
      }
    });
  });

  it('asks for the test counts before and after, and the checks that must pass', () => {
    const counts = flat(section(template(), 'Test counts'));
    assert.match(counts, /Before/);
    assert.match(counts, /After/);
    for (const suite of ['@kanji/core', 'web unit', 'web UI', 'scripts']) {
      assert.ok(counts.includes(suite), `no "${suite}" row`);
    }
    for (const command of ['format:check', 'lint', 'typecheck', 'npm test', 'check:commits']) {
      assert.ok(counts.includes(command), `no "${command}"`);
    }
  });

  it('asks for break-and-restore with the code quoted, not a line number', () => {
    const breaks = section(template(), 'Break-and-restore');
    assert.match(comments(breaks), /Quote the code/i);
    assert.match(comments(breaks), /not a line number/i);
    assert.match(flat(breaks), /Restored, tree clean/);
  });

  it('asks who did the in-person check, on which commit, and the result', () => {
    const inPerson = section(template(), 'In-person check');
    for (const field of ['Checked by:', 'Commit:', 'Result:']) {
      assert.ok(inPerson.includes(`**${field}**`), `no "**${field}**" field`);
    }
  });

  describe('left out', () => {
    it('has no Standards Check section (that is PROC2)', () => {
      assert.doesNotMatch(template(), /Standards Check/i);
    });

    it('has no "Generated with Claude Code" line', () => {
      assert.doesNotMatch(template(), /Generated with/i);
      assert.ok(!template().includes('🤖'), 'the template has a 🤖 line');
    });
  });
});

describe('standards 5.4', () => {
  const pullRequests = () => section(read(STANDARDS_PATH).replace(/^###\s+/gm, '## '), '5.4 Pull requests and merging');

  it('says every pull request uses the template, deleting only the sections that can be deleted', () => {
    const bullet = pullRequests()
      .split('\n')
      .find((line) => line.includes('.github/pull_request_template.md'));
    assert.ok(bullet, 'no bullet in 5.4 mentions .github/pull_request_template.md');
    assert.match(flat(bullet), /can be deleted/);
    assert.doesNotMatch(flat(bullet), /marked optional/i);
  });
});
