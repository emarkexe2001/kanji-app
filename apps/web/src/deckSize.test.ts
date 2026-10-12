import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampDeckSize, parseDeckSizeInput, MIN_DECK_SIZE, MAX_DECK_SIZE } from './deckSize';

test('accepts a valid card limit, e.g. 5', () => {
  assert.deepEqual(parseDeckSizeInput('5'), { ok: true, value: 5 });
});

test('card deck size shown should match the limit that was set', () => {
  const result = parseDeckSizeInput('42');
  assert.equal(result.ok, true);
  assert.equal((result as { ok: true; value: number }).value, 42);
});

test('rejects a card limit of 0', () => {
  const result = parseDeckSizeInput('0');
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /can't be 0/);
});

test('rejects a card limit higher than 150', () => {
  const result = parseDeckSizeInput('151');
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /150/);
});

test('accepts the boundary limits, 1 and 150', () => {
  assert.deepEqual(parseDeckSizeInput('1'), { ok: true, value: 1 });
  assert.deepEqual(parseDeckSizeInput('150'), { ok: true, value: 150 });
});

test('rejects empty or blank input', () => {
  assert.equal(parseDeckSizeInput('').ok, false);
  assert.equal(parseDeckSizeInput('   ').ok, false);
});

test('rejects non-numeric input', () => {
  assert.equal(parseDeckSizeInput('abc').ok, false);
});

test('rejects negative and decimal input', () => {
  assert.equal(parseDeckSizeInput('-5').ok, false);
  assert.equal(parseDeckSizeInput('5.5').ok, false);
});

test('clampDeckSize keeps in-range sizes unchanged', () => {
  assert.equal(clampDeckSize(42), 42);
});

test('clampDeckSize floors out-of-range sizes to the minimum of 1', () => {
  assert.equal(clampDeckSize(0), MIN_DECK_SIZE);
  assert.equal(clampDeckSize(-10), MIN_DECK_SIZE);
});

test('clampDeckSize caps out-of-range sizes to the maximum of 150', () => {
  assert.equal(clampDeckSize(1000), MAX_DECK_SIZE);
});
