import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { JlptLevel, WordEntry } from '@kanji/core';
import { buildLibrary } from './decks';
import {
  addBack,
  describeReplaced,
  parseShuffleInCount,
  recordRemoved,
  resizeCards,
  shuffleIn,
  takeCards,
  type DeckCard,
  type RemovedCard,
} from './study-deck';

const word = (id: string, jlpt?: JlptLevel, common = false): WordEntry => ({
  id,
  word: id,
  reading: id,
  common,
  jlpt,
  segments: [],
  meaning: id,
});
const level = (jlpt: JlptLevel, n: number) => Array.from({ length: n }, (_, i) => word(`${jlpt}-${i + 1}`, jlpt));
const library = buildLibrary([...level('N5', 10), ...level('N4', 10), ...level('N3', 10)]);
const deck = (n: number): DeckCard[] => takeCards(library, 'N5', n);

/** A "random" source that returns the given values in turn. */
const sequence = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

test('Random takes each new card from a random other deck', () => {
  // 0.0 picks the first live deck (N4), 0.99 the last (N3); card and position picks use 0.
  const result = shuffleIn({
    cards: deck(5),
    index: 0,
    count: 2,
    source: { kind: 'random' },
    library,
    studied: 'N5',
    now: 0,
    random: sequence(0, 0, 0.99, 0, 0),
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(
      result.replaced.map((i) => result.cards[i].deck),
      ['N4', 'N3'],
    );
  }
});

test('Random never uses the studied deck, even when it has cards left', () => {
  for (let i = 0; i < 20; i++) {
    const result = shuffleIn({
      cards: deck(5),
      index: 2,
      count: 5,
      source: { kind: 'random' },
      library,
      studied: 'N5',
      now: 0,
    });
    assert.equal(result.ok, true);
    if (result.ok) for (const c of result.cards) assert.notEqual(c.deck, 'N5');
  }
});

test('the card on screen is replaced first and the first new card takes its place', () => {
  const cards = deck(5);
  const result = shuffleIn({
    cards,
    index: 3,
    count: 2,
    source: { kind: 'deck', deck: 'N4' },
    library,
    studied: 'N5',
    now: 0,
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.replaced[0], 3);
    assert.equal(result.cards[3].deck, 'N4');
    assert.deepEqual(result.removed[0], { ...cards[3], reason: 'shuffled-out', removedAt: 0 });
  }
});

test('lowering the size trims from the end but never the card on screen', () => {
  const cards = deck(6);
  const result = resizeCards(cards, 4, 2, library, 'N5', 5);
  assert.deepEqual(result.cards, [cards[0], cards[4]]);
  assert.equal(result.index, 1);
  assert.deepEqual(
    result.removed.map((r) => [r.id, r.reason]),
    [5, 3, 2, 1].map((i) => [cards[i].id, 'card-limit']),
  );
});

test('raising the size adds cards from the studied deck that are not in it yet', () => {
  const cards: DeckCard[] = [{ id: 'N5-3', deck: 'N5' }];
  const result = resizeCards(cards, 0, 3, library, 'N5', 0);
  assert.deepEqual(
    result.cards.map((c) => c.id),
    ['N5-3', 'N5-1', 'N5-2'],
  );
  assert.deepEqual(result.removed, []);
});

test('the count must be a whole number from 1 to the card limit', () => {
  assert.deepEqual(parseShuffleInCount('3', 10), { ok: true, value: 3 });
  assert.deepEqual(parseShuffleInCount('10', 10), { ok: true, value: 10 });
  assert.equal(parseShuffleInCount('11', 10).ok, false);
  assert.equal(parseShuffleInCount('0', 10).ok, false);
  assert.equal(parseShuffleInCount('1.5', 10).ok, false);
});

test('the summary lists the replaced positions in order', () => {
  assert.equal(describeReplaced([12, 3, 7], 20), 'Shuffled out cards 3, 7 and 12 of 20');
  assert.equal(describeReplaced([5], 20), 'Shuffled out card 5 of 20');
  assert.equal(describeReplaced([2, 1], 4), 'Shuffled out cards 1 and 2 of 4');
});

const out = (id: string, removedAt = 0): RemovedCard => ({ id, deck: 'N4', reason: 'shuffled-out', removedAt });

test('the removed list keeps each card once, at its newest entry, and never a card that is in the deck', () => {
  const list = [out('N4-2', 1), out('N4-3', 1)];
  const result = recordRemoved(list, [out('N4-3', 2), out('N4-4', 2)], [{ id: 'N4-2', deck: 'N4' }]);
  assert.deepEqual(result, [out('N4-3', 2), out('N4-4', 2)]);
});

test('adding back puts the cards where the taken-out cards were, in list order, and shows the first', () => {
  const cards = deck(4);
  const removed = [out('N4-1'), out('N4-2')];
  const result = addBack({ cards, removed, addIds: ['N4-1', 'N4-2'], takeOut: [3, 1], now: 9 });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(
      result.cards.map((c) => c.id),
      ['N5-1', 'N4-1', 'N5-3', 'N4-2'],
    );
    assert.equal(result.index, 1);
    assert.deepEqual(
      result.removed.map((r) => [r.id, r.reason, r.removedAt]),
      [
        ['N5-2', 'swapped-out', 9],
        ['N5-4', 'swapped-out', 9],
      ],
    );
  }
});

test('adding back refuses cards that are not on the list, or deck positions that do not exist', () => {
  const cards = deck(3);
  assert.equal(addBack({ cards, removed: [], addIds: ['N4-1'], takeOut: [0], now: 0 }).ok, false);
  assert.equal(addBack({ cards, removed: [out('N4-1')], addIds: ['N4-1'], takeOut: [5], now: 0 }).ok, false);
  assert.equal(
    addBack({ cards, removed: [out('N4-1'), out('N4-2')], addIds: ['N4-1', 'N4-2'], takeOut: [0, 0], now: 0 }).ok,
    false,
  );
});
