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
