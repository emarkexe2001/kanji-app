/**
 * Saves and loads the study deck through the storage helper. Everything read back is checked,
 * because it may be from an older version, edited by hand or corrupt: anything that doesn't fit
 * is dropped, and the app falls back to a fresh deck. When storage is blocked nothing is
 * remembered, but the app keeps working.
 */
import { readStorage, writeStorage } from '../../../lib/storage';
import { MAX_REMOVED_CARDS, type DeckCard, type RemovedCard, type ShuffleSource } from './study-deck';
import { isDeckId, otherDecks, type DeckId, type Library } from './decks';

const STUDIED_DECK_KEY = 'kanji.studiedDeck';
const SAVED_DECK_KEY = 'kanji.savedDeck';
const SOURCE_KEY = 'kanji.shuffleSource';
const REMOVED_KEY = 'kanji.removedCards';

function readJson(key: string): unknown {
  const raw = readStorage(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const writeJson = (key: string, value: unknown) => writeStorage(key, JSON.stringify(value));

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** The deck being studied: the saved choice if that deck still exists, otherwise the first deck. */
export function loadStudiedDeck(library: Library): DeckId | null {
  const saved = readStorage(STUDIED_DECK_KEY);
  if (isDeckId(saved) && library.decks.has(saved)) return saved;
  return library.decks.keys().next().value ?? null;
}

export const saveStudiedDeck = (deck: DeckId) => writeStorage(STUDIED_DECK_KEY, deck);

/** A card read back from storage, if its id is a known word and its deck a known deck. */
function toDeckCard(v: unknown, library: Library): DeckCard | null {
  if (!isRecord(v) || typeof v.id !== 'string' || !library.byId.has(v.id) || !isDeckId(v.deck)) return null;
  return { id: v.id, deck: v.deck };
}

/**
 * The saved cards for `studied`, without unknown or repeated cards. Returns null when nothing
 * usable is saved (missing, corrupt, saved for another deck, or no valid cards).
 */
export function loadSavedCards(library: Library, studied: DeckId): DeckCard[] | null {
  const saved = readJson(SAVED_DECK_KEY);
  if (!isRecord(saved) || saved.deck !== studied || !Array.isArray(saved.cards)) return null;
  const seen = new Set<string>();
  const cards: DeckCard[] = [];
  for (const item of saved.cards) {
    const card = toDeckCard(item, library);
    if (card && !seen.has(card.id)) {
      seen.add(card.id);
      cards.push(card);
    }
  }
  return cards.length ? cards : null;
}

export const saveCards = (studied: DeckId, cards: DeckCard[]) => writeJson(SAVED_DECK_KEY, { deck: studied, cards });

/** The saved "Shuffle in from" choice, if it is still a valid source for `studied`. */
export function loadShuffleSource(library: Library, studied: DeckId): ShuffleSource | null {
  const saved = readJson(SOURCE_KEY);
  if (!isRecord(saved)) return null;
  if (saved.kind === 'random') return { kind: 'random' };
  if (saved.kind === 'deck' && isDeckId(saved.deck) && otherDecks(library, studied).includes(saved.deck)) {
    return { kind: 'deck', deck: saved.deck };
  }
  return null;
}

export const saveShuffleSource = (source: ShuffleSource) => writeJson(SOURCE_KEY, source);

/** The saved list of removed cards, newest first, without entries that don't fit. */
export function loadRemovedCards(library: Library): RemovedCard[] {
  const saved = readJson(REMOVED_KEY);
  if (!Array.isArray(saved)) return [];
  const removed: RemovedCard[] = [];
  for (const item of saved) {
    const card = toDeckCard(item, library);
    if (!card || !isRecord(item)) continue;
    if (item.reason !== 'shuffled-out' && item.reason !== 'card-limit') continue;
    if (typeof item.removedAt !== 'number' || !Number.isFinite(item.removedAt)) continue;
    removed.push({ ...card, reason: item.reason, removedAt: item.removedAt });
  }
  return removed.slice(0, MAX_REMOVED_CARDS);
}

export const saveRemovedCards = (removed: RemovedCard[]) => writeJson(REMOVED_KEY, removed);
