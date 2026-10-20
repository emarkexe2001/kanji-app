import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WordEntry } from '@kanji/core';
import type { Move } from '../components/card-stack';
import { otherDecks, type DeckId, type Library } from '../utils/decks';
import { randomOther } from '../utils/random-other';
import {
  loadRemovedCards,
  loadSavedCards,
  loadShuffleSource,
  loadStudiedDeck,
  saveCards,
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

function loadState(library: Library, studied: DeckId, limit: number): StudyState {
  // A saved deck of the wrong size (e.g. the card limit was saved but the deck wasn't) is fitted
  // to the card limit. That isn't something the user did, so nothing is recorded as removed.
  const saved = loadSavedCards(library, studied) ?? [];
  const { cards } = resizeCards(saved, 0, limit, library, studied, Date.now());
  return {
    studied,
    limit,
    cards,
    index: 0,
    move: 'next',
    replaced: null,
    source: validSource(library, studied, loadShuffleSource(library, studied)),
    removed: recordRemoved(loadRemovedCards(library), [], cards),
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
  useEffect(() => saveCards(state.studied, state.cards), [state.studied, state.cards]);
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
  const next = useCallback(
    () => setState((s) => ({ ...s, move: 'next', replaced: null, index: (s.index + 1) % s.cards.length })),
    [],
  );
  const deckShuffle = useCallback(
    () => setState((s) => ({ ...s, move: 'shuffle', replaced: null, index: randomOther(s.index, s.cards.length) })),
    [],
  );

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
        move: 'shuffle',
        replaced: result.replaced,
        removed: recordRemoved(s.removed, result.removed, result.cards),
      }));
      return null;
    },

    shuffledOut,

    addBack: (addIds, takeOut) => {
      const result = addBack({ cards: state.cards, removed: state.removed, addIds, takeOut, now: Date.now() });
      if (!result.ok) return result.error;
      setState((s) => ({
        ...s,
        cards: result.cards,
        index: result.index,
        move: 'shuffle',
        replaced: null,
        removed: result.removed,
      }));
      return null;
    },

    clearShuffledOut: () => setState((s) => ({ ...s, removed: [] })),
  };
}
