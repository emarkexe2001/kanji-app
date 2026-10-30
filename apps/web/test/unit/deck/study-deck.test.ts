import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { JlptLevel, WordEntry } from '@kanji/core';
import { buildLibrary } from '../../../src/features/deck/utils/decks';
import {
  addBack,
  checkTicked,
  describeReplaced,
  describeUnticked,
  parseShuffleInCount,
  recordRemoved,
  resizeCards,
  shuffleIn,
  shuffledOutFrom,
  stillNew,
  takeCards,
  type DeckCard,
  type RemovedCard,
  type ShuffleSource,
} from '../../../src/features/deck/utils/study-deck';

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

test('a shuffled-in card stays new until the user moves on from it, and only while it is in the deck', () => {
  const cards = deck(3); // N5-1, N5-2, N5-3
  assert.deepEqual(stillNew(['N5-1', 'N5-2'], cards), ['N5-1', 'N5-2']);
  assert.deepEqual(stillNew(['N5-1', 'N5-2'], cards, 'N5-1'), ['N5-2']);
  assert.deepEqual(stillNew(['N5-1', 'N4-9'], cards), ['N5-1']);
});

test('when no card stops being new, the same "New" list is kept, so the deck is not saved again (FEAT2_6)', () => {
  const cards = deck(3);
  const newIds = ['N5-1', 'N5-2'];
  assert.equal(stillNew(newIds, cards), newIds);
  assert.equal(stillNew(newIds, cards, 'N5-3'), newIds);
  assert.notEqual(stillNew(newIds, cards, 'N5-1'), newIds);
});

// FEAT3: Multiple decks.

test('Multiple decks pools the new cards of the ticked decks and picks at random across them all', () => {
  // N4 has 1 card and N3 has 9: pooled (N4 first), 0.15 picks the second card, from N3. Picking a
  // deck evenly first would have picked N4.
  const lib = buildLibrary([...level('N5', 10), ...level('N4', 1), ...level('N3', 9)]);
  const result = shuffleIn({
    cards: takeCards(lib, 'N5', 5),
    index: 0,
    count: 1,
    source: { kind: 'multiple', decks: ['N4', 'N3'] },
    library: lib,
    studied: 'N5',
    now: 0,
    random: () => 0.15,
  });
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.cards[0], { id: 'N3-1', deck: 'N3' });
});

test('Multiple decks only uses the ticked decks, never the studied deck', () => {
  for (let i = 0; i < 20; i++) {
    const result = shuffleIn({
      cards: deck(5),
      index: 1,
      count: 5,
      source: { kind: 'multiple', decks: ['N5', 'N4', 'N3'] },
      library,
      studied: 'N5',
      now: 0,
    });
    assert.equal(result.ok, true);
    if (result.ok) for (const c of result.cards) assert.ok(['N4', 'N3'].includes(c.deck));
  }
});

test('a card in two ticked decks is pooled once, as coming from the first of them', () => {
  const lib = buildLibrary([...level('N5', 10), word('both', 'N4', true), word('common-only', undefined, true)]);
  const source: ShuffleSource = { kind: 'multiple', decks: ['common', 'N4'] };
  const request = { cards: takeCards(lib, 'N5', 5), index: 0, source, library: lib, studied: 'N5' as const, now: 0 };
  assert.deepEqual(shuffleIn({ ...request, count: 3 }), {
    ok: false,
    error: 'The ticked decks only have 2 new cards left. Tick more decks or shuffle in fewer cards.',
  });
  const result = shuffleIn({ ...request, count: 2, random: () => 0 });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(
      result.replaced.map((p) => result.cards[p]),
      [
        { id: 'both', deck: 'N4' },
        { id: 'common-only', deck: 'common' },
      ],
    );
  }
});

test('Multiple decks needs two or more ticked decks', () => {
  const request = { cards: deck(5), index: 0, count: 1, library, studied: 'N5' as const, now: 0 };
  assert.deepEqual(shuffleIn({ ...request, source: { kind: 'multiple', decks: [] } }), {
    ok: false,
    error: 'Tick at least two decks to shuffle in from.',
  });
  // The studied deck doesn't count as a tick.
  assert.deepEqual(shuffleIn({ ...request, source: { kind: 'multiple', decks: ['N5', 'N4'] } }), {
    ok: false,
    error: 'Tick at least two decks, or choose One deck instead.',
  });
  assert.equal(checkTicked(['N4', 'N3']), null);
});

test('the unticked notice names each deck, with "is" for one and "are" for several', () => {
  assert.equal(describeUnticked(['N1']), 'JLPT N1 is no longer available, so it has been unticked.');
  assert.equal(
    describeUnticked(['N2', 'N1']),
    'JLPT N2 and JLPT N1 are no longer available, so they have been unticked.',
  );
  assert.equal(
    describeUnticked(['N2', 'N1', 'common']),
    'JLPT N2, JLPT N1 and Common words are no longer available, so they have been unticked.',
  );
});

// ADJ3: which shuffled-out cards slide from the screen and which peel off the back of the deck.

test('a multi-card Shuffle In replaces the card on screen first, then cards from inside the deck', () => {
  for (const index of [0, 2, 4]) {
    const cards = deck(5);
    const result = shuffleIn({
      cards,
      index,
      count: 3,
      source: { kind: 'deck', deck: 'N4' },
      library,
      studied: 'N5',
      now: 0,
    });
    assert.equal(result.ok, true);
    if (!result.ok) continue;
    assert.equal(result.replaced[0], index);
    // One card slides from the screen and the other two from inside the deck.
    assert.deepEqual(shuffledOutFrom(cards, index, result.replaced), { onScreen: cards[index], hidden: 2 });
  }
});

test('shuffledOutFrom counts the cards from inside the deck whatever order the positions come in', () => {
  const cards = deck(5);
  assert.deepEqual(shuffledOutFrom(cards, 2, [4, 2, 0]), { onScreen: cards[2], hidden: 2 });
  assert.deepEqual(shuffledOutFrom(cards, 2, [2]), { onScreen: cards[2], hidden: 0 });
});

test('shuffledOutFrom: when the card on screen stays, every card shuffled out was inside the deck', () => {
  const cards = deck(5);
  assert.deepEqual(shuffledOutFrom(cards, 1, [0, 3]), { onScreen: null, hidden: 2 });
  assert.deepEqual(shuffledOutFrom(cards, 1, []), { onScreen: null, hidden: 0 });
});

test('shuffledOutFrom counts a position given twice once', () => {
  const cards = deck(5);
  assert.deepEqual(shuffledOutFrom(cards, 0, [0, 3, 3]), { onScreen: cards[0], hidden: 1 });
});
