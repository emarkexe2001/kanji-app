// Checks the ticket clarification step (PROC3): the Questions / Clarifications section in the
// ticket format, the standards that describe it, and the two fixes it found (the minimum deck
// size and the card limit ticket's Feature Name). These are docs, so the tests check key
// phrases, not exact wording or whitespace.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const STANDARDS_PATH = resolve(ROOT, 'docs/standards/standards.md');
const EXAMPLE_TICKET_PATH = resolve(ROOT, 'docs/tickets/example_ticket.md');
const CARD_LIMIT_TICKET_PATH = resolve(ROOT, 'docs/tickets/selectable-card_limit_ticket.md');
const DECK_SIZE_PATH = resolve(ROOT, 'apps/web/src/features/card-limit/utils/deck-size.ts');

const SECTION = 'Questions / Clarifications';

const read = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

/** Collapses runs of whitespace, so line breaks in the prose don't matter. */
const flat = (text: string) => text.replace(/\s+/g, ' ').trim();

/**
 * The text of a ticket field, e.g. "Feature Name:", up to the next field. A field is a line
 * that is only a label ending in a colon, so lines like "Answer (agreed ...): ..." stay inside.
 */
function field(ticket: string, label: string): string {
  const lines = ticket.split('\n');
  const start = lines.findIndex((line) => line.trim() === `${label}:`);
  assert.ok(start !== -1, `the ticket has no "${label}:" field`);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^[A-Z][^:\n]{0,60}:\s*$/.test(line));
  return (end === -1 ? rest : rest.slice(0, end)).join('\n');
}

/** The numbered questions in a Questions / Clarifications field, each with the lines under it. */
function questions(text: string): { question: string; answer: string }[] {
  return text
    .split(/^\s*(?=\d+\.\s)/m)
    .filter((part) => /^\d+\.\s/.test(part))
    .map((part) => {
      const [question = '', ...under] = part.split('\n');
      return { question: flat(question), answer: flat(under.join(' ')) };
    });
}

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

/** The one bullet that starts with the given bold label, e.g. "Decks can never be empty." */
function bullet(text: string, label: string): string {
  const found = bullets(text).filter((b) => b.startsWith(`**${label}**`));
  assert.equal(found.length, 1, `expected one "**${label}**" bullet, found ${found.length}`);
  return found[0]!;
}

const standards = () => read(STANDARDS_PATH);
const beforeStarting = () => section(standards(), /^###\s+5\.1\s+Before starting/);
const testRules = () => section(standards(), /^###\s+4\.2\s+Rules/);
const openQuestions = () => section(standards(), /^##\s+6\.\s+Open Questions/);
const cardLimitTicket = () => read(CARD_LIMIT_TICKET_PATH);

/** MIN_DECK_SIZE from the app, read from its source so the scripts don't import app code. */
function minDeckSize(): number {
  const match = read(DECK_SIZE_PATH).match(/export const MIN_DECK_SIZE\s*=\s*(\d+)\s*;/);
  assert.ok(match, 'no "export const MIN_DECK_SIZE = <number>;" in deck-size.ts');
  return Number(match[1]);
}

describe('ticket format (example_ticket.md)', () => {
  it('has a Questions / Clarifications section', () => {
    field(read(EXAMPLE_TICKET_PATH), SECTION);
  });

  it('shows a question with the agreed answer and its date under it', () => {
    const found = questions(field(read(EXAMPLE_TICKET_PATH), SECTION));
    assert.ok(found.length >= 1, 'no numbered question');
    for (const { question, answer } of found) {
      assert.match(question, /\?/, `"${question}" is not a question`);
      assert.match(answer, /^Answer \(agreed [^)]+\):\s*\S/, `no "Answer (agreed <date>): ..." under "${question}"`);
    }
  });

  it('says to check the ticket against the standards and write the answers back with the date', () => {
    const guide = flat(field(read(EXAMPLE_TICKET_PATH), SECTION));
    assert.match(guide, /against docs\/standards\/standards\.md/);
    assert.match(guide, /conflict/i);
    assert.match(guide, /unclear/i);
    assert.match(guide, /agreed answer and its date/i);
  });
});

describe('standards 5.1 "Before starting"', () => {
  const step = () => bullet(beforeStarting(), 'Check the ticket against these standards.');

  it('says to read the ticket against the standards before starting', () => {
    assert.match(step(), /Before starting, read the ticket against these standards/);
  });

  it('says to write conflicts and unclear points in the Questions / Clarifications section and ask', () => {
    assert.match(step(), /disagrees/);
    assert.match(step(), /isn't clear/);
    assert.match(step(), /"Questions \/ Clarifications" section/);
    assert.match(step(), /example_ticket\.md/);
    assert.match(step(), /\band ask\b/);
  });

  it('says to write the agreed answer and its date back into the ticket', () => {
    assert.match(step(), /Write the agreed answer and its date under each question/);
    assert.match(step(), /kept in the ticket/);
  });

  it('keeps the existing "respond with questions" bullet', () => {
    assert.ok(
      bullets(beforeStarting()).some((b) => /respond with questions before starting/.test(b)),
      'the "respond with questions before starting" bullet is gone',
    );
  });
});

describe('standards 4.2 agreed answers', () => {
  it('says answers in a Questions / Clarifications section need a test too', () => {
    const rule = bullet(testRules(), 'Every agreed answer needs a test too.');
    assert.match(rule, /"Questions \/ Clarifications" sections/);
    assert.match(rule, /covered by a test/);
  });

  it('(addition) is not said again in 5.1', () => {
    assert.doesNotMatch(bullet(beforeStarting(), 'Check the ticket against these standards.'), /test/i);
  });
});

describe('minimum deck size (agreed 2026-11-04: 1 card)', () => {
  it('is 1 card in the app', () => {
    assert.equal(minDeckSize(), 1);
  });

  it('is the same in standards 4.2 as in the app', () => {
    const rule = bullet(testRules(), 'Decks can never be empty.');
    const match = rule.match(/at least (\d+) cards? in a deck/);
    assert.ok(match, `no "at least <n> card(s) in a deck" in: ${rule}`);
    assert.equal(Number(match[1]), minDeckSize());
  });

  it('no longer says "1–5 cards" anywhere in the standards', () => {
    assert.doesNotMatch(standards(), /1\s*[–-]\s*5 cards/);
  });

  it('is no longer an open question in standards section 6', () => {
    assert.doesNotMatch(openQuestions(), /Minimum deck size/i);
  });

  it('is recorded, with the date, in the card limit ticket and matches the app', () => {
    const found = questions(field(cardLimitTicket(), SECTION)).find((q) => /minimum deck size/i.test(q.question));
    assert.ok(found, 'no question about the minimum deck size');
    const match = found.answer.match(/^Answer \(agreed 2026-11-04\):\s*(\d+) cards?\b/);
    assert.ok(match, `the answer is "${found.answer}", not "Answer (agreed 2026-11-04): <n> card"`);
    assert.equal(Number(match[1]), minDeckSize());
  });
});

describe('card limit ticket Feature Name', () => {
  it('is "Selectable Card Limit"', () => {
    assert.equal(flat(field(cardLimitTicket(), 'Feature Name')), 'Selectable Card Limit');
  });

  it('is recorded, with the date, in the ticket', () => {
    const found = questions(field(cardLimitTicket(), SECTION)).find((q) => /Feature Name/.test(q.question));
    assert.ok(found, 'no question about the Feature Name');
    assert.match(found.answer, /^Answer \(agreed 2026-11-04\b[^)]*\):\s*"Selectable Card Limit"/);
  });
});
