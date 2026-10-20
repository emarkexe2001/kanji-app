/**
 * The rules for the deck being studied (FEAT1): building it, changing its size when the card
 * limit changes, and shuffling new cards in from other decks. Plain functions so they are easy
 * to test; the hook in hooks/use-study-deck.ts keeps the state and saves it.
 */
import { DECK_LABELS, cardId, otherDecks, type DeckId, type Library } from './decks';

/** A card in the saved deck, and the deck it came from (shown by FEAT2 once it is shuffled out). */
export interface DeckCard {
  id: string;
  deck: DeckId;
}

/**
 * Where Shuffle In Cards takes new cards from: one chosen deck, or a random other deck for each
 * card. Kept as its own type so FEAT3 can add a "multiple decks" kind.
 */
export type ShuffleSource = { kind: 'deck'; deck: DeckId } | { kind: 'random' };

/** A card that left the deck, newest first in the list. FEAT2 shows these. */
export interface RemovedCard extends DeckCard {
  reason: 'shuffled-out' | 'card-limit';
  /** When it was removed (ms since the epoch). */
  removedAt: number;
}

/** Only the newest removed cards are kept (FEAT2 answer). */
export const MAX_REMOVED_CARDS = 100;

export type Random = () => number;

const randomIndex = (length: number, random: Random) => Math.floor(random() * length);

/** The first `count` cards of `deck` that aren't in `exclude`. */
export function takeCards(library: Library, deck: DeckId, count: number, exclude = new Set<string>()): DeckCard[] {
  const cards: DeckCard[] = [];
  for (const word of library.decks.get(deck) ?? []) {
    if (cards.length >= count) break;
    const id = cardId(word);
    if (!exclude.has(id)) cards.push({ id, deck });
  }
  return cards;
}

/** Adds removed cards to the front of the list, keeping only the newest MAX_REMOVED_CARDS. */
export function recordRemoved(list: RemovedCard[], removed: RemovedCard[]): RemovedCard[] {
  return [...removed, ...list].slice(0, MAX_REMOVED_CARDS);
}

export interface ResizeResult {
  cards: DeckCard[];
  index: number;
  removed: RemovedCard[];
}

/**
 * Changes the deck to `size` cards. Lowering it removes cards from the end, but never the card
 * on screen (`index`). Raising it adds cards from the studied deck that aren't in it yet, as many
 * as there are.
 */
export function resizeCards(
  cards: DeckCard[],
  index: number,
  size: number,
  library: Library,
  studied: DeckId,
  now: number,
): ResizeResult {
  if (size > cards.length) {
    const added = takeCards(library, studied, size - cards.length, new Set(cards.map((c) => c.id)));
    return { cards: [...cards, ...added], index, removed: [] };
  }

  const trimmed = new Set<number>();
  for (let i = cards.length - 1; i >= 0 && cards.length - trimmed.size > size; i--) {
    if (i !== index) trimmed.add(i);
  }
  const onScreen = cards[index];
  const kept = cards.filter((_, i) => !trimmed.has(i));
  return {
    cards: kept,
    index: Math.max(0, kept.indexOf(onScreen)),
    removed: [...trimmed].map((i) => ({ ...cards[i], reason: 'card-limit', removedAt: now })),
  };
}

export type CountResult = { ok: true; value: number } | { ok: false; error: string };

const cardsWord = (n: number) => (n === 1 ? 'card' : 'cards');

/** Validates the "Cards to shuffle in" field: a whole number from 1 up to the card limit. */
export function parseShuffleInCount(raw: string, cardLimit: number): CountResult {
  const trimmed = raw.trim();
  if (trimmed === '') return { ok: false, error: 'Enter how many cards to shuffle in.' };
  if (!/^\d+$/.test(trimmed)) return { ok: false, error: 'Cards to shuffle in must be a whole number.' };
  const value = Number(trimmed);
  if (value < 1) return { ok: false, error: 'Shuffle in at least 1 card.' };
  if (value > cardLimit) {
    return {
      ok: false,
      error: `You can't shuffle in more than ${cardLimit} ${cardsWord(cardLimit)}, your card limit.`,
    };
  }
  return { ok: true, value };
}

export type ShuffleInResult =
  { ok: true; cards: DeckCard[]; replaced: number[]; removed: RemovedCard[] } | { ok: false; error: string };

export interface ShuffleInRequest {
  cards: DeckCard[];
  /** The card on screen. It is always the first one removed, and the first new card takes its place. */
  index: number;
  count: number;
  source: ShuffleSource;
  library: Library;
  /** The deck being studied. It is never a source. */
  studied: DeckId;
  now: number;
  random?: Random;
}

/**
 * Swaps `count` cards in the deck for new ones from the source. The card on screen goes first,
 * the others are picked at random. New cards are never already in the deck, so no card is in it
 * twice, and the deck size doesn't change. If the source doesn't have enough new cards, nothing
 * changes and the error says how many there are.
 */
export function shuffleIn({
  cards,
  index,
  count,
  source,
  library,
  studied,
  now,
  random = Math.random,
}: ShuffleInRequest): ShuffleInResult {
  const check = parseShuffleInCount(String(count), cards.length);
  if (!check.ok) return check;

  const inDeck = new Set(cards.map((c) => c.id));
  const sourceDecks = (source.kind === 'deck' ? [source.deck] : otherDecks(library, studied)).filter(
    (d) => d !== studied,
  );
  const pools = sourceDecks.map((deck) => ({
    deck,
    ids: (library.decks.get(deck) ?? []).map(cardId).filter((id) => !inDeck.has(id)),
  }));

  const available = new Set(pools.flatMap((p) => p.ids)).size;
  if (available < count) {
    const where = source.kind === 'deck' ? DECK_LABELS[source.deck] : 'the other decks';
    const left = available === 0 ? 'no new cards' : `only ${available} new ${cardsWord(available)}`;
    return { ok: false, error: `There ${available === 1 ? 'is' : 'are'} ${left} left in ${where} to shuffle in.` };
  }

  // Each new card comes from a random source deck that still has a card to give (just one deck for 'deck').
  const added: DeckCard[] = [];
  while (added.length < count) {
    const live = pools.filter((p) => p.ids.length);
    const pool = live[randomIndex(live.length, random)];
    const id = pool.ids[randomIndex(pool.ids.length, random)];
    // A word can be in more than one deck (e.g. N4 and Common words), so take it out of every pool.
    for (const p of pools) {
      const at = p.ids.indexOf(id);
      if (at >= 0) p.ids.splice(at, 1);
    }
    added.push({ id, deck: pool.deck });
  }

  // The card on screen first, then random other positions.
  const others = cards.map((_, i) => i).filter((i) => i !== index);
  for (let i = others.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1, random);
    [others[i], others[j]] = [others[j], others[i]];
  }
  const replaced = [index, ...others.slice(0, count - 1)];

  const next = [...cards];
  replaced.forEach((position, i) => (next[position] = added[i]));
  return {
    ok: true,
    cards: next,
    replaced,
    removed: replaced.map((position) => ({ ...cards[position], reason: 'shuffled-out', removedAt: now })),
  };
}

/** "Shuffled out card 5 of 20" or "Shuffled out cards 3, 7 and 12 of 20" (positions start at 1). */
export function describeReplaced(positions: number[], total: number): string {
  const sorted = [...positions].sort((a, b) => a - b);
  if (sorted.length === 1) return `Shuffled out card ${sorted[0]} of ${total}`;
  const list = `${sorted.slice(0, -1).join(', ')} and ${sorted[sorted.length - 1]}`;
  return `Shuffled out cards ${list} of ${total}`;
}
