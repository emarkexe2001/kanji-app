// Checks the pull request template (PROC1, with the Standards Check section and the
// Requirements group from PROC2) and the standards bullet that points to it.
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
      'Standards Check',
      'Test Scenarios',
      'Test counts',
      'Break-and-restore',
      'Browser check',
      'In-person check',
      'After merging',
    ]);
  });

  describe('Standards Check (PROC2)', () => {
    const standardsCheck = () => section(template(), 'Standards Check');
    /** The text of each `- [ ]` box in the section, flattened. */
    const boxes = () => [...standardsCheck().matchAll(/^\s*- \[ \]\s+(.+)$/gm)].map((m) => flat(m[1]!));
    /** The `## N. Heading` sections of the standards, e.g. 1 → "UI Standards". */
    const standardsHeadings = () =>
      new Map([...read(STANDARDS_PATH).matchAll(/^##\s+(\d+)\.\s+(.+?)\s*$/gm)].map((m) => [m[1]!, m[2]!]));
    /** The boxes that name a standards section, as [number, name, what it covers]. */
    const sectionBoxes = () =>
      boxes()
        .map((box) => box.match(/^§(\d+)\s+(.+?)\s+[–-]\s+(.+)$/))
        .filter((m) => m !== null)
        .map((m) => [m[1]!, m[2]!, m[3]!] as const);

    it('has a Standards Check section', () => {
      assert.ok(headings(template()).includes('Standards Check'), `headings: ${headings(template()).join(', ')}`);
    });

    it('comes right after Summary', () => {
      const found = headings(template());
      assert.equal(found[found.indexOf('Summary') + 1], 'Standards Check', `headings: ${found.join(', ')}`);
    });

    it('has six boxes: one for each of standards sections 1 to 5, and one for questions', () => {
      assert.equal(boxes().length, 6, boxes().join('\n'));
      assert.deepEqual(
        sectionBoxes().map(([n]) => n),
        ['1', '2', '3', '4', '5'],
      );
    });

    it('names UI, Code, Folder Structure, Test and Git standards in its boxes', () => {
      const names = sectionBoxes().map(([, name]) => name);
      for (const name of ['UI Standards', 'Code Standards', 'Folder Structure Standards', 'Test Standards']) {
        assert.ok(names.includes(name), `no box for "${name}": ${names.join(', ')}`);
      }
      assert.ok(
        names.some((name) => name.startsWith('Git')),
        `no box for the Git standards: ${names.join(', ')}`,
      );
    });

    it('names each § with the real heading of that section in standards.md', () => {
      const real = standardsHeadings();
      for (const [n, name] of sectionBoxes()) {
        assert.equal(name, real.get(n), `§${n} is "${name}" in the template but "${real.get(n)}" in standards.md`);
      }
    });

    it('gives a few words on what each standards box covers', () => {
      for (const [n, , covers] of sectionBoxes()) {
        assert.ok(covers.split(' ').length >= 3, `§${n} says only "${covers}"`);
      }
    });

    it('covers the key points of the ticket in the UI, Test, Folder and Git boxes', () => {
      const covers = new Map(sectionBoxes().map(([n, , c]) => [n, c]));
      assert.match(covers.get('1')!, /header/i);
      assert.match(covers.get('1')!, /colour-coded buttons/i);
      assert.match(covers.get('1')!, /only shows what the user needs/i);
      assert.match(covers.get('3')!, /src\//);
      assert.match(covers.get('3')!, /test\//);
      assert.match(covers.get('3')!, /docs\//);
      assert.match(covers.get('4')!, /validation messages/i);
      assert.match(covers.get('4')!, /all tests pass/i);
      for (const point of [/branch prefix/i, /commit messages/i, /one change per PR/i, /ticket moved/i]) {
        assert.match(covers.get('5')!, point);
      }
    });

    it('has a questions box that works with or without questions (standards 5.1)', () => {
      const questions = boxes().find((box) => /questions/i.test(box));
      assert.ok(questions, 'no box about questions');
      assert.match(questions, /asked and answered before starting/i);
      assert.match(questions, /or none were needed/i);
      assert.match(questions, /standards 5\.1/);
    });

    it('says in its comment that a box left unticked needs a short reason', () => {
      const guidance = comments(standardsCheck());
      assert.match(guidance, /unticked/i);
      assert.match(guidance, /short reason/i);
      assert.match(guidance, /standards\.md/);
    });

    it('has no "N/A" option (a box that does not apply is left unticked with a reason)', () => {
      assert.doesNotMatch(standardsCheck(), /\bN\/?A\b/);
    });
  });

  describe('Requirements group (PROC2)', () => {
    const scenarios = () => section(template(), 'Test Scenarios');
    const labels = () => [...scenarios().matchAll(/^\*\*([^*\n]+)\*\*\s*$/gm)].map((m) => m[1]!.trim());

    it('is the first group in Test Scenarios', () => {
      assert.equal(labels()[0], 'Requirements', `groups: ${labels().join(', ')}`);
    });

    it('has a checkbox, for the ticket\'s "Feature Requirements / Expected Behaviours"', () => {
      const requirements = group(scenarios(), 'Requirements');
      assert.ok(checkboxes(requirements).length >= 1, 'no "- [ ]" checkbox under "Requirements"');
      assert.match(comments(requirements), /Feature Requirements \/ Expected Behaviours/);
    });

    it('asks for the test that covers each requirement, or how it was checked', () => {
      const guidance = comments(group(scenarios(), 'Requirements'));
      assert.match(guidance, /test that covers it/i);
      assert.match(guidance, /how it was checked/i);
    });

    it('can be deleted when the ticket lists no requirements', () => {
      assert.match(comments(group(scenarios(), 'Requirements')), /Delete if the ticket lists none/);
    });
  });

  describe('Ticket', () => {
    it('has a Ticket field linking to where the ticket ends up on main', () => {
      const field = section(template(), 'Ticket').match(/^\*\*Ticket:\*\*\s*\[([^\]]+)\]\(([^)]+)\)/m);
      assert.ok(field, 'no "**Ticket:** [CODE](link)" field');
      assert.ok(
        /^\.\.\/blob\/main\/docs\/tickets\/completed_tickets\/[^/]+\//.test(field[2]!),
        `the link is "${field[2]}", not ../blob/main/docs/tickets/completed_tickets/<type>/...`,
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
      ['Requirements', (t) => group(section(t, 'Test Scenarios'), 'Requirements')],
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
        ['Standards Check', section(t, 'Standards Check')],
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

  it('says to tick each Standards Check box, or give a short reason for one left unticked (PROC2)', () => {
    const bullet = pullRequests()
      .split('\n')
      .find((line) => line.includes('.github/pull_request_template.md'));
    assert.ok(bullet, 'no bullet in 5.4 mentions .github/pull_request_template.md');
    assert.match(flat(bullet), /Tick each Standards Check box/);
    assert.match(flat(bullet), /short reason/);
    assert.match(flat(bullet), /unticked/);
  });
});
