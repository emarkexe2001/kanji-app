import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_HISTORY, goBack, rememberCard } from '../../../src/features/deck/utils/card-history';

const deck = ['a', 'b', 'c', 'd', 'e'];

test('Back goes to the last card seen and takes it off the history', () => {
  assert.deepEqual(goBack(['a', 'c'], deck, 3), { index: 2, history: ['a'] });
  assert.deepEqual(goBack(['a'], deck, 2), { index: 0, history: [] });
});

test('with an empty history Back goes to the card before in deck order, wrapping from the first to the last', () => {
  assert.deepEqual(goBack([], deck, 3), { index: 2, history: [] });
  assert.deepEqual(goBack([], deck, 0), { index: 4, history: [] });
});

test('cards that are no longer in the deck are skipped, and Back goes to the card before them in the history', () => {
  assert.deepEqual(goBack(['b', 'x', 'y'], deck, 0), { index: 1, history: [] });
  // Every card in the history is gone: Back goes on in deck order.
  assert.deepEqual(goBack(['x', 'y'], deck, 2), { index: 1, history: [] });
});

test('a history entry for the card already on screen is skipped', () => {
  assert.deepEqual(goBack(['d', 'c'], deck, 2), { index: 3, history: [] });
  assert.deepEqual(goBack(['c'], deck, 2), { index: 1, history: [] });
});

test('in a one-card deck Back stays on that card', () => {
  assert.deepEqual(goBack([], ['a'], 0), { index: 0, history: [] });
  assert.deepEqual(goBack(['a', 'gone'], ['a'], 0), { index: 0, history: [] });
});

test('the history keeps only the last 50 cards seen', () => {
  assert.equal(MAX_HISTORY, 50);
  let history: string[] = [];
  for (let i = 1; i <= 60; i++) history = rememberCard(history, String(i));
  assert.equal(history.length, 50);
  assert.equal(history[0], '11');
  assert.equal(history.at(-1), '60');
});

test('remembering a card does not change the history passed in', () => {
  const history = ['a'];
  assert.deepEqual(rememberCard(history, 'b'), ['a', 'b']);
  assert.deepEqual(history, ['a']);
  const before = ['a', 'b'];
  goBack(before, deck, 0);
  assert.deepEqual(before, ['a', 'b']);
});
