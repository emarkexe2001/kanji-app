import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseShuffleInCount } from '../../../src/features/deck/utils/study-deck';

// CHORE10: Cards to shuffle in keeps its exact messages now that it uses the shared whole-number check.

test('an empty or blank count says "Enter how many cards to shuffle in."', () => {
  assert.deepEqual(parseShuffleInCount('', 10), { ok: false, error: 'Enter how many cards to shuffle in.' });
  assert.deepEqual(parseShuffleInCount('   ', 10), { ok: false, error: 'Enter how many cards to shuffle in.' });
});

test('a non-numeric count says "Cards to shuffle in must be a whole number."', () => {
  for (const raw of ['abc', '2.5', '-1', '+3', '1e1']) {
    assert.deepEqual(
      parseShuffleInCount(raw, 10),
      { ok: false, error: 'Cards to shuffle in must be a whole number.' },
      raw,
    );
  }
});

test('a count of 0 says "Shuffle in at least 1 card."', () => {
  for (const raw of ['0', '000']) {
    assert.deepEqual(parseShuffleInCount(raw, 10), { ok: false, error: 'Shuffle in at least 1 card.' }, raw);
  }
});

test('a count over the card limit names the limit, with "cards" for more than one', () => {
  assert.deepEqual(parseShuffleInCount('11', 10), {
    ok: false,
    error: "You can't shuffle in more than 10 cards, your card limit.",
  });
  assert.deepEqual(parseShuffleInCount('151', 150), {
    ok: false,
    error: "You can't shuffle in more than 150 cards, your card limit.",
  });
});

test('a count over a card limit of 1 says "1 card", not "1 cards"', () => {
  assert.deepEqual(parseShuffleInCount('2', 1), {
    ok: false,
    error: "You can't shuffle in more than 1 card, your card limit.",
  });
});

test('a valid count gives its number, from 1 up to the card limit, trimmed and with leading zeros allowed', () => {
  assert.deepEqual(parseShuffleInCount('1', 10), { ok: true, value: 1 });
  assert.deepEqual(parseShuffleInCount('10', 10), { ok: true, value: 10 });
  assert.deepEqual(parseShuffleInCount('1', 1), { ok: true, value: 1 });
  assert.deepEqual(parseShuffleInCount(' 4 ', 10), { ok: true, value: 4 });
  assert.deepEqual(parseShuffleInCount('04', 10), { ok: true, value: 4 });
});
