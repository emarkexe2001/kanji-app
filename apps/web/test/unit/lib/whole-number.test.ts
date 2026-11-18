import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseWholeNumber, type WholeNumberRules } from '../../../src/lib/whole-number';

// CHORE10: the one whole-number check behind the card limit and Cards to shuffle in fields.

const RULES: WholeNumberRules = {
  min: 2,
  max: 9,
  messages: { empty: 'empty', notWhole: 'not whole', tooSmall: 'too small', tooBig: 'too big' },
};

const errorOf = (raw: string) => {
  const result = parseWholeNumber(raw, RULES);
  assert.equal(result.ok, false, `"${raw}" should be rejected`);
  return result.ok ? '' : result.error;
};

test('empty or blank input gives the empty message', () => {
  assert.equal(errorOf(''), 'empty');
  assert.equal(errorOf('   '), 'empty');
});

test('anything but digits gives the not-whole message', () => {
  for (const raw of ['abc', '-5', '+5', '5.5', '1e2', '5 5']) assert.equal(errorOf(raw), 'not whole');
});

test('below min gives the too-small message, above max the too-big message', () => {
  assert.equal(errorOf('1'), 'too small');
  assert.equal(errorOf('0'), 'too small');
  assert.equal(errorOf('10'), 'too big');
  assert.equal(errorOf('99999999999999999999999'), 'too big');
});

test('min, max and values between are accepted, trimmed, leading zeros allowed', () => {
  assert.deepEqual(parseWholeNumber('2', RULES), { ok: true, value: 2 });
  assert.deepEqual(parseWholeNumber('9', RULES), { ok: true, value: 9 });
  assert.deepEqual(parseWholeNumber(' 5 ', RULES), { ok: true, value: 5 });
  assert.deepEqual(parseWholeNumber('05', RULES), { ok: true, value: 5 });
});

test('tabs, newlines and other whitespace around the number are trimmed; whitespace alone counts as empty', () => {
  assert.deepEqual(parseWholeNumber('\t7\n', RULES), { ok: true, value: 7 });
  assert.deepEqual(parseWholeNumber('\r\n 3 \t', RULES), { ok: true, value: 3 });
  assert.equal(errorOf('\t\n '), 'empty');
});

test('whitespace inside the number is not trimmed and gives the not-whole message', () => {
  assert.equal(errorOf('1 0'), 'not whole');
  assert.equal(errorOf('4\t5'), 'not whole');
});

test('leading zeros are read as the number they spell, then checked against min and max', () => {
  assert.deepEqual(parseWholeNumber('007', RULES), { ok: true, value: 7 });
  assert.deepEqual(parseWholeNumber('0009', RULES), { ok: true, value: 9 });
  assert.equal(errorOf('00'), 'too small');
  assert.equal(errorOf('01'), 'too small');
  assert.equal(errorOf('010'), 'too big');
});

test('the boundaries: min − 1 is too small, min and max are accepted, max + 1 is too big', () => {
  const rules: WholeNumberRules = { ...RULES, min: 1, max: 150 };
  const result = (raw: string) => parseWholeNumber(raw, rules);
  assert.deepEqual(result('0'), { ok: false, error: 'too small' });
  assert.deepEqual(result('1'), { ok: true, value: 1 });
  assert.deepEqual(result('150'), { ok: true, value: 150 });
  assert.deepEqual(result('151'), { ok: false, error: 'too big' });
});

test('when min and max are the same, only that number is accepted', () => {
  const rules: WholeNumberRules = { ...RULES, min: 1, max: 1 };
  assert.deepEqual(parseWholeNumber('1', rules), { ok: true, value: 1 });
  assert.deepEqual(parseWholeNumber('0', rules), { ok: false, error: 'too small' });
  assert.deepEqual(parseWholeNumber('2', rules), { ok: false, error: 'too big' });
});

test('only plain 0–9 digits count: full-width digits, signs and hex give the not-whole message', () => {
  assert.equal(errorOf('５'), 'not whole');
  assert.equal(errorOf('-0'), 'not whole');
  assert.equal(errorOf('0x5'), 'not whole');
});

test('the checks run in order: empty, then not whole, then too small, then too big', () => {
  // Blank is "empty", not "not whole"; "-0" is "not whole", not "too small".
  assert.equal(errorOf(' '), 'empty');
  assert.equal(errorOf('-0'), 'not whole');
  // With min above max, a number fails "too small" before "too big" is checked.
  assert.deepEqual(parseWholeNumber('5', { ...RULES, min: 6, max: 4 }), { ok: false, error: 'too small' });
});

test('each message is passed through exactly as given', () => {
  const messages = { empty: 'A b.', notWhole: "C — d's", tooSmall: 'e 1 f', tooBig: 'g, h.' };
  const rules: WholeNumberRules = { min: 1, max: 3, messages };
  assert.deepEqual(parseWholeNumber('', rules), { ok: false, error: 'A b.' });
  assert.deepEqual(parseWholeNumber('x', rules), { ok: false, error: "C — d's" });
  assert.deepEqual(parseWholeNumber('0', rules), { ok: false, error: 'e 1 f' });
  assert.deepEqual(parseWholeNumber('4', rules), { ok: false, error: 'g, h.' });
});
