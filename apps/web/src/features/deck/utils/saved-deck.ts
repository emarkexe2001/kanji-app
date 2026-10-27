/**
 * Saves and loads the study deck through the storage helper. Everything read back is checked,
 * because it may be from an older version, edited by hand or corrupt: anything that doesn't fit
 * is dropped, and the app falls back to a fresh deck. When storage is blocked nothing is
 * remembered, but the app keeps working.
 */
import { readStorage, writeStorage } from '../../../lib/storage';
import {
  MAX_REMOVED_CARDS,
  REMOVED_REASONS,
  SHUFFLE_MODES,
  type DeckCard,
  type RemovedCard,
  type ShuffleChoice,
  type ShuffleMode,
} from './study-deck';
import { isDeckId, type DeckId, type Library } from './decks';

const STUDIED_DECK_KEY = 'kanji.studiedDeck';
const SAVED_DECK_KEY = 'kanji.savedDeck';
const SOURCE_KEY = 'kanji.shuffleSource';
const REMOVED_KEY = 'kanji.removedCards';
const CLEARED_KEY = 'kanji.clearedCards';

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

export interface SavedDeck {
  cards: DeckCard[];
  /** Ids of the shuffled-in cards that still show "New" (FEAT2_5). Each one is in `cards`. */
  newIds: string[];
}

/**
 * The saved cards for `studied`, without unknown or repeated cards, and which of them are still
 * new (ids that aren't in the deck are dropped; a deck saved before FEAT2_5 has none). Returns
 * null when nothing usable is saved (missing, corrupt, saved for another deck, or no valid cards).
 */
export function loadSavedDeck(library: Library, studied: DeckId): SavedDeck | null {
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
  if (!cards.length) return null;
  const savedNew = Array.isArray(saved.newIds) ? saved.newIds : [];
  const newIds = [...new Set(savedNew.filter((id): id is string => typeof id === 'string' && seen.has(id)))];
  return { cards, newIds };
}

export const saveDeck = (studied: DeckId, { cards, newIds }: SavedDeck) =>
  writeJson(SAVED_DECK_KEY, { deck: studied, cards, newIds });

/**
 * The saved "Shuffle in from" choice, as saved: which mode, the deck picked under One deck (null
 * if none) and the decks ticked under Multiple decks (known deck ids only, each once). The hook
 * checks them against the decks that can be shuffled in from now. Choices saved before FEAT3
 * (`{ kind: 'deck', deck }` or `{ kind: 'random' }`) load with nothing ticked.
 */
export interface SavedShuffleChoice {
  mode: ShuffleMode;
  deck: DeckId | null;
  ticked: DeckId[];
}

export function loadShuffleChoice(): SavedShuffleChoice | null {
  const saved = readJson(SOURCE_KEY);
  if (!isRecord(saved)) return null;
  const mode = SHUFFLE_MODES.find((m) => m === saved.kind);
  if (!mode) return null;
  const ticked = Array.isArray(saved.decks) ? [...new Set(saved.decks.filter(isDeckId))] : [];
  return { mode, deck: isDeckId(saved.deck) ? saved.deck : null, ticked };
}

/** Saved as `{ kind, deck, decks }`, so the deck and the ticks are kept whichever mode is chosen. */
export const saveShuffleChoice = ({ mode, deck, ticked }: ShuffleChoice) =>
  writeJson(SOURCE_KEY, { kind: mode, deck, decks: ticked });

/** A saved list of removed cards, newest first, without entries that don't fit. */
function loadRemovedList(key: string, library: Library): RemovedCard[] {
  const saved = readJson(key);
  if (!Array.isArray(saved)) return [];
  const seen = new Set<string>();
  const removed: RemovedCard[] = [];
  for (const item of saved) {
    const card = toDeckCard(item, library);
    // Each card is listed once, at its newest (first) entry.
    if (!card || !isRecord(item) || seen.has(card.id)) continue;
    const reason = REMOVED_REASONS.find((r) => r === item.reason);
    if (!reason) continue;
    if (typeof item.removedAt !== 'number' || !Number.isFinite(item.removedAt)) continue;
    seen.add(card.id);
    removed.push({ ...card, reason, removedAt: item.removedAt });
  }
  return removed.slice(0, MAX_REMOVED_CARDS);
}

/** The saved list of removed cards (the "Shuffled-out cards" list), newest first. */
export const loadRemovedCards = (library: Library) => loadRemovedList(REMOVED_KEY, library);

export const saveRemovedCards = (removed: RemovedCard[]) => writeJson(REMOVED_KEY, removed);

/**
 * The saved list that Clear List last cleared, newest first, kept so it can be recovered
 * (FEAT2_7). It is checked the same way as the shuffled-out list.
 */
export const loadClearedCards = (library: Library) => loadRemovedList(CLEARED_KEY, library);

export const saveClearedCards = (cleared: RemovedCard[]) => writeJson(CLEARED_KEY, cleared);
