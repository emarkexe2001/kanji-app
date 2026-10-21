import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WordEntry } from '@kanji/core';
import type { Move } from '../components/card-stack';
import { otherDecks, type DeckId, type Library } from '../utils/decks';
import { randomOther } from '../utils/random-other';
import {
  loadRemovedCards,
  loadSavedDeck,
  loadShuffleSource,
  loadStudiedDeck,
  saveDeck,
  saveRemovedCards,
  saveShuffleSource,
  saveStudiedDeck,
} from '../utils/saved-deck';
import {
  addBack,
  describeReplaced,
  recordRemoved,
  resizeCards,
  shuffleIn,
  stillNew,
  takeCards,
  type DeckCard,
  type RemovedCard,
  type ShuffleSource,
} from '../utils/study-deck';

interface StudyState {
  studied: DeckId;
  limit: number;
  cards: DeckCard[];
  /** The position of the card on screen. */
  index: number;
  move: Move;
  /** Positions replaced by the last Shuffle In Cards, until the user moves on. */
  replaced: number[] | null;
  source: ShuffleSource | null;
  removed: RemovedCard[];
  /** Ids of the shuffled-in cards that still show "New" (saved with the deck). */
  newIds: string[];
  /** The card the last Shuffle In Cards took off the screen, while it slides away. */
  leaving: DeckCard | null;
}

/** The default source: the first other deck, or null when there is no other deck. */
function defaultSource(library: Library, studied: DeckId): ShuffleSource | null {
  const [first] = otherDecks(library, studied);
  return first ? { kind: 'deck', deck: first } : null;
}

/** A source that can be used while studying `studied`, falling back to the default. */
function validSource(library: Library, studied: DeckId, source: ShuffleSource | null): ShuffleSource | null {
  const others = otherDecks(library, studied);
  if (!others.length) return null;
  if (source?.kind === 'random') return source;
  if (source?.kind === 'deck' && others.includes(source.deck)) return source;
  return defaultSource(library, studied);
}

/** Moving on to another card: the one that was on screen has been seen, so it is no longer new. */
const moveOn = (s: StudyState, move: Move, index: number): StudyState => ({
  ...s,
  move,
  index,
  replaced: null,
  leaving: null,
  newIds: stillNew(s.newIds, s.cards, s.cards[s.index].id),
});

function loadState(library: Library, studied: DeckId, limit: number): StudyState {
  // A saved deck of the wrong size (e.g. the card limit was saved but the deck wasn't) is fitted
  // to the card limit. That isn't something the user did, so nothing is recorded as removed.
  const saved = loadSavedDeck(library, studied);
  const { cards } = resizeCards(saved?.cards ?? [], 0, limit, library, studied, Date.now());
  return {
    studied,
    limit,
    cards,
    index: 0,
    move: 'next',
    replaced: null,
    source: validSource(library, studied, loadShuffleSource(library, studied)),
    removed: recordRemoved(loadRemovedCards(library), [], cards),
    newIds: stillNew(saved?.newIds ?? [], cards),
    leaving: null,
  };
}

export interface StudyDeck {
  studied: DeckId;
  /** Every deck that can be studied. */
  decks: DeckId[];
  /** The decks that can be shuffled in from: every deck except the studied one. */
  sources: DeckId[];
  source: ShuffleSource | null;
  cards: WordEntry[];
  index: number;
  move: Move;
  /** e.g. "Shuffled out cards 3, 7 and 12 of 20", after a Shuffle In Cards. */
  summary: string | null;
  next: () => void;
  deckShuffle: () => void;
  chooseDeck: (deck: DeckId) => void;
  setLimit: (limit: number) => void;
  setSource: (source: ShuffleSource) => void;
  /** Shuffles `count` new cards in. Returns a message for the user if it can't, and the deck doesn't change. */
  shuffleIn: (count: number) => string | null;
  /** The "Shuffled-out cards" list (shuffled out, trimmed by the card limit or swapped out), newest first. */
  shuffledOut: ShuffledOutCard[];
  /**
   * Adds the shuffled-out cards `addIds` back, taking out the deck cards at positions `takeOut`
   * (from 0). Returns a message for the user if it can't, and the deck doesn't change.
   */
  addBack: (addIds: string[], takeOut: number[]) => string | null;
  clearShuffledOut: () => void;
  /** Whether the card at `position` (from 0) was shuffled in and hasn't been seen and moved on from yet. */
  isNew: (position: number) => boolean;
  /** The deck the card at `position` (from 0) came from, e.g. N4 for a card shuffled in from JLPT N4. */
  cardDeck: (position: number) => DeckId;
  /** The card the last Shuffle In Cards took off the screen, to show it sliding away. */
  leaving: WordEntry | null;
}

export interface ShuffledOutCard {
  id: string;
  /** The deck the card came from. */
  deck: DeckId;
  word: WordEntry;
}

/**
 * The deck being studied: which deck it is, its cards (saved, so shuffled-in cards survive a
 * reload), the card on screen, the "Shuffle in from" choice and the cards removed so far.
 * `library` must have at least one deck.
 */
export function useStudyDeck(library: Library, limit: number): StudyDeck {
  const [state, setState] = useState(() => loadState(library, loadStudiedDeck(library)!, limit));

  useEffect(() => saveStudiedDeck(state.studied), [state.studied]);
  useEffect(
    () => saveDeck(state.studied, { cards: state.cards, newIds: state.newIds }),
    [state.studied, state.cards, state.newIds],
  );
  useEffect(() => {
    if (state.source) saveShuffleSource(state.source);
  }, [state.source]);
  useEffect(() => saveRemovedCards(state.removed), [state.removed]);

  const cards = useMemo(() => state.cards.map((c) => library.byId.get(c.id)!), [state.cards, library]);
  const shuffledOut = useMemo(
    () => state.removed.map((r) => ({ id: r.id, deck: r.deck, word: library.byId.get(r.id)! })),
    [state.removed, library],
  );

  // Stable, so the keyboard shortcuts aren't re-attached on every render.
  const next = useCallback(() => setState((s) => moveOn(s, 'next', (s.index + 1) % s.cards.length)), []);
  const deckShuffle = useCallback(
    () => setState((s) => moveOn(s, 'shuffle', randomOther(s.index, s.cards.length))),
    [],
  );
  const newIds = useMemo(() => new Set(state.newIds), [state.newIds]);

  return {
    studied: state.studied,
    decks: [...library.decks.keys()],
    sources: otherDecks(library, state.studied),
    source: state.source,
    cards,
    index: state.index,
    move: state.move,
    summary:
      state.replaced &&
      describeReplaced(
        state.replaced.map((i) => i + 1),
        state.cards.length,
      ),

    next,
    deckShuffle,

    chooseDeck: (deck) =>
      setState((s) => {
        const cards = takeCards(library, deck, s.limit);
        return {
          ...s,
          studied: deck,
          cards,
          index: 0,
          move: 'next',
          replaced: null,
          source: validSource(library, deck, s.source),
          removed: recordRemoved(s.removed, [], cards),
          newIds: [],
          leaving: null,
        };
      }),

    setLimit: (newLimit) => {
      const resized = resizeCards(state.cards, state.index, newLimit, library, state.studied, Date.now());
      setState((s) => ({
        ...s,
        limit: newLimit,
        cards: resized.cards,
        index: resized.index,
        replaced: null,
        removed: recordRemoved(s.removed, resized.removed, resized.cards),
        newIds: stillNew(s.newIds, resized.cards),
        leaving: null,
      }));
    },

    setSource: (source) => setState((s) => ({ ...s, source })),

    shuffleIn: (count) => {
      if (!state.source) return "There's no other deck to shuffle in from.";
      const result = shuffleIn({
        cards: state.cards,
        index: state.index,
        count,
        source: state.source,
        library,
        studied: state.studied,
        now: Date.now(),
      });
      if (!result.ok) return result.error;
      setState((s) => ({
        ...s,
        cards: result.cards,
        move: 'shuffle-in',
        replaced: result.replaced,
        removed: recordRemoved(s.removed, result.removed, result.cards),
        newIds: [...stillNew(s.newIds, result.cards), ...result.replaced.map((p) => result.cards[p].id)],
        leaving: s.cards[s.index],
      }));
      return null;
    },

    shuffledOut,

    addBack: (addIds, takeOut) => {
      const result = addBack({ cards: state.cards, removed: state.removed, addIds, takeOut, now: Date.now() });
      if (!result.ok) return result.error;
      // The deck moves on to the first card added back, so the card that was on screen has been seen.
      setState((s) => ({
        ...moveOn(s, 'shuffle', result.index),
        cards: result.cards,
        removed: result.removed,
        newIds: stillNew(s.newIds, result.cards, s.cards[s.index].id),
      }));
      return null;
    },

    clearShuffledOut: () => setState((s) => ({ ...s, removed: [] })),

    isNew: (position) => newIds.has(state.cards[position]?.id ?? ''),
    cardDeck: (position) => state.cards[position].deck,
    leaving: state.leaving && library.byId.get(state.leaving.id)!,
  };
}
