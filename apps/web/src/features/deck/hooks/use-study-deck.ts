import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WordEntry } from '@kanji/core';
import type { Move } from '../components/card-stack';
import { goBack, rememberCard } from '../utils/card-history';
import { otherDecks, type DeckId, type Library } from '../utils/decks';
import { randomOther } from '../utils/random-other';
import {
  loadClearedCards,
  loadRemovedCards,
  loadSavedDeck,
  saveClearedCards,
  loadShuffleChoice,
  loadStudiedDeck,
  saveDeck,
  saveRemovedCards,
  saveShuffleChoice,
  saveStudiedDeck,
  type SavedShuffleChoice,
} from '../utils/saved-deck';
import {
  MIN_TICKED_DECKS,
  addBack,
  choiceSource,
  describeReplaced,
  mergeRecovered,
  recordRemoved,
  resizeCards,
  shuffleIn,
  shuffledOutFrom,
  stillNew,
  takeCards,
  type DeckCard,
  type RemovedCard,
  type ShuffleChoice,
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
  /** The "Shuffle in from" choice, or null when there is no other deck. */
  choice: ShuffleChoice | null;
  /** Ticked decks just unticked because they can't be shuffled in from any more, to tell the user (FEAT3). */
  unticked: DeckId[];
  removed: RemovedCard[];
  /**
   * The list Clear List last cleared, kept so it can be recovered (FEAT2_7), or empty. It is kept
   * until it is recovered or Clear List is pressed again; shuffling cards out doesn't drop it.
   */
  cleared: RemovedCard[];
  /** Ids of the shuffled-in cards that still show "New" (saved with the deck). */
  newIds: string[];
  /** The cards that last moved between the deck and the shuffled-out list, to show them sliding (ADJ3). */
  moved: MovedState | null;
  /**
   * Ids of the cards seen before the one on screen, oldest first, for Back (FEAT6). Not saved, and
   * only cleared when another deck is studied.
   */
  history: string[];
}

/** Cards that moved between the deck and the shuffled-out list, by their saved ids (see CardsMoved). */
type MovedState =
  | { kind: 'out'; onScreen: DeckCard | null; hidden: number; countChange: number }
  | { kind: 'back'; ids: string[]; onScreen: DeckCard; onScreenIsNew: boolean; countChange: number };

interface FittedChoice {
  choice: ShuffleChoice | null;
  unticked: DeckId[];
}

/**
 * A "Shuffle in from" choice that can be used while studying `studied`: null when there is no
 * other deck. The deck under One deck falls back to the first other deck, and ticked decks that
 * can't be shuffled in from any more (gone from the dictionary, or now the studied deck) are
 * unticked. Under Multiple decks those are returned in `unticked` to tell the user. Multiple decks
 * falls back to One deck when there are fewer than two other decks.
 */
function fitChoice(library: Library, studied: DeckId, saved: SavedShuffleChoice | ShuffleChoice | null): FittedChoice {
  const others = otherDecks(library, studied);
  if (!others.length) return { choice: null, unticked: [] };
  const deck = saved?.deck && others.includes(saved.deck) ? saved.deck : others[0];
  const ticked = (saved?.ticked ?? []).filter((d) => others.includes(d));
  const dropped = (saved?.ticked ?? []).filter((d) => !others.includes(d));
  const multiple = saved?.mode === 'multiple';
  const mode = !saved || (multiple && others.length < MIN_TICKED_DECKS) ? 'deck' : saved.mode;
  return { choice: { mode, deck, ticked }, unticked: multiple ? dropped : [] };
}

/**
 * Moving on to another card: the one that was on screen has been seen, so it is no longer new,
 * and Back can return to it (FEAT6). In a one-card deck Next, Deck Shuffle and Back stay on the
 * same card, so it keeps its "New" badge (FEAT2_6).
 */
const moveOn = (s: StudyState, move: Move, index: number): StudyState =>
  index === s.index
    ? { ...s, move, replaced: null, moved: null }
    : {
        ...s,
        move,
        index,
        replaced: null,
        moved: null,
        newIds: stillNew(s.newIds, s.cards, s.cards[s.index].id),
        history: rememberCard(s.history, s.cards[s.index].id),
      };

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
    move: 'deal',
    replaced: null,
    ...fitChoice(library, studied, loadShuffleChoice()),
    removed: recordRemoved(loadRemovedCards(library), [], cards),
    cleared: loadClearedCards(library),
    newIds: stillNew(saved?.newIds ?? [], cards),
    moved: null,
    history: [],
  };
}

export interface StudyDeck {
  studied: DeckId;
  /** Every deck that can be studied. */
  decks: DeckId[];
  /** The decks that can be shuffled in from: every deck except the studied one. */
  sources: DeckId[];
  /** The "Shuffle in from" choice (One deck, Random or Multiple decks), or null when there is no other deck. */
  choice: ShuffleChoice | null;
  /** Ticked decks that were unticked because they can't be shuffled in from any more (FEAT3), to tell the user. */
  unticked: DeckId[];
  cards: WordEntry[];
  /**
   * The id of each card in the deck, in the same order as `cards`. Taken from the saved deck, not
   * the card's data, so it is known even when a card's data is missing (FEAT2_6).
   */
  cardIds: string[];
  index: number;
  move: Move;
  /** e.g. "Shuffled out cards 3, 7 and 12 of 20", after a Shuffle In Cards. */
  summary: string | null;
  next: () => void;
  /** Goes back to the last card seen that is still in the deck, or the card before in deck order (FEAT6). */
  back: () => void;
  deckShuffle: () => void;
  chooseDeck: (deck: DeckId) => void;
  setLimit: (limit: number) => void;
  /** Changes the "Shuffle in from" choice. It also clears the unticked notice. */
  setChoice: (choice: ShuffleChoice) => void;
  /** Clears the unticked notice (once the user changes something). */
  clearUnticked: () => void;
  /** Shuffles `count` new cards in. Returns a message for the user if it can't, and the deck doesn't change. */
  shuffleIn: (count: number) => string | null;
  /** The "Shuffled-out cards" list (shuffled out, trimmed by the card limit or swapped out), newest first. */
  shuffledOut: ShuffledOutCard[];
  /**
   * Adds the shuffled-out cards `addIds` back, taking out the deck cards at positions `takeOut`
   * (from 0). Returns a message for the user if it can't, and the deck doesn't change.
   */
  addBack: (addIds: string[], takeOut: number[]) => string | null;
  /** Clears the shuffled-out list, keeping it so it can be recovered (replacing any list cleared before). */
  clearShuffledOut: () => void;
  /** How many cards the last Clear List cleared, while they can be recovered; 0 when there is nothing to recover. */
  clearedCount: number;
  /**
   * Adds the cleared cards to the shuffled-out list, each in its place by when it was shuffled
   * out, skipping any now in the deck or already listed.
   */
  recoverCleared: () => void;
  /** Whether the card at `position` (from 0) was shuffled in and hasn't been seen and moved on from yet. */
  isNew: (position: number) => boolean;
  /** The deck the card at `position` (from 0) came from, e.g. N4 for a card shuffled in from JLPT N4. */
  cardDeck: (position: number) => DeckId;
  /**
   * The cards that last moved between the deck and the shuffled-out list (ADJ3), so they can be
   * shown sliding. A new object each time cards move; null once the user moves on to another card.
   */
  moved: CardsMoved | null;
}

/**
 * Cards that moved between the deck and the shuffled-out list (ADJ3):
 * - `out`: cards shuffled out of the deck, by Shuffle In Cards or a lower card limit. `onScreen` is
 *   the card that was on screen, when it was one of them, and `hidden` how many others there were
 *   (cards inside the deck, not on screen);
 * - `back`: the cards added back, in the order of the list (newest first). The first is the card
 *   the deck now shows. `onScreen` is the card that was on screen before, and `onScreenIsNew`
 *   whether it showed "New" then.
 * `countChange` is how much the length of the shuffled-out list changed.
 */
export type CardsMoved =
  | { kind: 'out'; onScreen: WordEntry | null; hidden: number; countChange: number }
  | {
      kind: 'back';
      ids: string[];
      cards: WordEntry[];
      onScreen: WordEntry;
      onScreenIsNew: boolean;
      countChange: number;
    };

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
    if (state.choice) saveShuffleChoice(state.choice);
  }, [state.choice]);
  useEffect(() => saveRemovedCards(state.removed), [state.removed]);
  useEffect(() => saveClearedCards(state.cleared), [state.cleared]);

  const cards = useMemo(() => state.cards.map((c) => library.byId.get(c.id)!), [state.cards, library]);
  const cardIds = useMemo(() => state.cards.map((c) => c.id), [state.cards]);
  const shuffledOut = useMemo(
    () => state.removed.map((r) => ({ id: r.id, deck: r.deck, word: library.byId.get(r.id)! })),
    [state.removed, library],
  );

  // Stable, so the keyboard shortcuts aren't re-attached on every render.
  const next = useCallback(() => setState((s) => moveOn(s, 'next', (s.index + 1) % s.cards.length)), []);
  // Going back counts as moving on from the card on screen, but it takes the card gone back to off
  // the history instead of adding the one on screen to it.
  const back = useCallback(
    () =>
      setState((s) => {
        const step = goBack(
          s.history,
          s.cards.map((c) => c.id),
          s.index,
        );
        return { ...moveOn(s, 'back', step.index), history: step.history };
      }),
    [],
  );
  const deckShuffle = useCallback(
    () => setState((s) => moveOn(s, 'shuffle', randomOther(s.index, s.cards.length))),
    [],
  );
  const newIds = useMemo(() => new Set(state.newIds), [state.newIds]);
  // The same object until cards move again, so each move is shown sliding once.
  const moved = useMemo((): CardsMoved | null => {
    const m = state.moved;
    if (!m) return null;
    const word = (id: string) => library.byId.get(id)!;
    return m.kind === 'out'
      ? { ...m, onScreen: m.onScreen && word(m.onScreen.id) }
      : { ...m, cards: m.ids.map(word), onScreen: word(m.onScreen.id) };
  }, [state.moved, library]);

  return {
    studied: state.studied,
    decks: [...library.decks.keys()],
    sources: otherDecks(library, state.studied),
    choice: state.choice,
    unticked: state.unticked,
    cards,
    cardIds,
    index: state.index,
    move: state.move,
    summary:
      state.replaced &&
      describeReplaced(
        state.replaced.map((i) => i + 1),
        state.cards.length,
      ),

    next,
    back,
    deckShuffle,

    chooseDeck: (deck) =>
      setState((s) => {
        const cards = takeCards(library, deck, s.limit);
        return {
          ...s,
          studied: deck,
          cards,
          index: 0,
          move: 'deal',
          replaced: null,
          // A ticked deck that is now the studied one is unticked, and under Multiple decks the user is told.
          ...fitChoice(library, deck, s.choice),
          removed: recordRemoved(s.removed, [], cards),
          newIds: [],
          moved: null,
          // Back only goes through the cards seen in the deck being studied.
          history: [],
        };
      }),

    setLimit: (newLimit) => {
      const resized = resizeCards(state.cards, state.index, newLimit, library, state.studied, Date.now());
      setState((s) => {
        const removed = recordRemoved(s.removed, resized.removed, resized.cards);
        return {
          ...s,
          limit: newLimit,
          cards: resized.cards,
          index: resized.index,
          replaced: null,
          removed,
          newIds: stillNew(s.newIds, resized.cards),
          // A lower limit never takes out the card on screen, only cards inside the deck.
          moved: resized.removed.length
            ? {
                kind: 'out',
                onScreen: null,
                hidden: resized.removed.length,
                countChange: removed.length - s.removed.length,
              }
            : null,
        };
      });
    },

    setChoice: (choice) => setState((s) => ({ ...s, ...fitChoice(library, s.studied, choice), unticked: [] })),

    clearUnticked: () => setState((s) => (s.unticked.length ? { ...s, unticked: [] } : s)),

    shuffleIn: (count) => {
      if (!state.choice) return "There's no other deck to shuffle in from.";
      const result = shuffleIn({
        cards: state.cards,
        index: state.index,
        count,
        source: choiceSource(state.choice),
        library,
        studied: state.studied,
        now: Date.now(),
      });
      if (!result.ok) return result.error;
      setState((s) => {
        const removed = recordRemoved(s.removed, result.removed, result.cards);
        return {
          ...s,
          cards: result.cards,
          move: 'shuffle-in',
          replaced: result.replaced,
          removed,
          newIds: [...stillNew(s.newIds, result.cards), ...result.replaced.map((p) => result.cards[p].id)],
          moved: {
            kind: 'out',
            ...shuffledOutFrom(s.cards, s.index, result.replaced),
            countChange: removed.length - s.removed.length,
          },
        };
      });
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
        moved: {
          kind: 'back',
          ids: addIds,
          onScreen: s.cards[s.index],
          onScreenIsNew: s.newIds.includes(s.cards[s.index].id),
          countChange: result.removed.length - s.removed.length,
        },
      }));
      return null;
    },

    // The newer clear replaces any cleared list kept from before.
    clearShuffledOut: () => setState((s) => (s.removed.length ? { ...s, removed: [], cleared: s.removed } : s)),

    clearedCount: state.cleared.length,

    // Adds to the list, never replacing it; cards in the deck or already listed are skipped.
    recoverCleared: () =>
      setState((s) => ({ ...s, removed: mergeRecovered(s.removed, s.cleared, s.cards), cleared: [] })),

    isNew: (position) => newIds.has(state.cards[position]?.id ?? ''),
    cardDeck: (position) => state.cards[position].deck,
    moved,
  };
}
