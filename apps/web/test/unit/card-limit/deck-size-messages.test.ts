import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDeckSizeInput } from '../../../src/features/card-limit/utils/deck-size';

// CHORE10: the card limit keeps its exact messages now that it uses the shared whole-number check.

test('an empty or blank card limit says "Enter a card limit."', () => {
  assert.deepEqual(parseDeckSizeInput(''), { ok: false, error: 'Enter a card limit.' });
  assert.deepEqual(parseDeckSizeInput('  \t '), { ok: false, error: 'Enter a card limit.' });
});

test('a non-numeric card limit says "Card limit must be a whole number."', () => {
  for (const raw of ['abc', '5.5', '-5', '+5', '1e2']) {
    assert.deepEqual(parseDeckSizeInput(raw), { ok: false, error: 'Card limit must be a whole number.' }, raw);
  }
});

test('a card limit of 0 says "Card limit can\'t be 0 — enter at least 1."', () => {
  for (const raw of ['0', '00', ' 0 ']) {
    assert.deepEqual(parseDeckSizeInput(raw), { ok: false, error: "Card limit can't be 0 — enter at least 1." }, raw);
  }
});

test('a card limit over 150 says "Card limit can\'t be more than 150."', () => {
  for (const raw of ['151', '1000', '99999999999999999999999']) {
    assert.deepEqual(parseDeckSizeInput(raw), { ok: false, error: "Card limit can't be more than 150." }, raw);
  }
});

test('a valid card limit gives its number, trimmed and with leading zeros allowed', () => {
  assert.deepEqual(parseDeckSizeInput('1'), { ok: true, value: 1 });
  assert.deepEqual(parseDeckSizeInput('42'), { ok: true, value: 42 });
  assert.deepEqual(parseDeckSizeInput('150'), { ok: true, value: 150 });
  assert.deepEqual(parseDeckSizeInput(' 25 '), { ok: true, value: 25 });
  assert.deepEqual(parseDeckSizeInput('007'), { ok: true, value: 7 });
});
