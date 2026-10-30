import type { JlptLevel, ReadingKind } from './types';

/** Reading-type colors from spec section 1. */
export const READING_COLORS: Record<ReadingKind, string> = {
  onyomi: '#1e88e5',
  kunyomi: '#e53935',
  okurigana: '#43a047',
};

/** ★ Common Word badge color. */
export const COMMON_COLOR = '#eba834';

/** Word-card header colors per JLPT level, from spec section 1. */
export const JLPT_COLORS: Record<JlptLevel, string> = {
  N5: '#10b981',
  N4: '#06b6d4',
  N3: '#6366f1',
  N2: '#8b5cf6',
  N1: '#f43f5e',
};

/**
 * Outline and tick colors of a picked card in the lists of cards to pick (FEAT2_5): green for a
 * card being added back to the deck, red for a card being taken out of it.
 */
export const PICK_COLORS = {
  addBack: '#059669',
  takeOut: '#e11d48',
} as const;
export type PickKind = keyof typeof PICK_COLORS;

/** The amber "NEW" ribbon on a shuffled-in card (FEAT2_5, FEAT2_6): the same colour as Tailwind's amber-400. */
export const NEW_COLOR = '#fbbf24';

/**
 * The colour modes the user can choose from (FEAT5). Light is the app as it has always looked;
 * Dark is slate (dark blue-grey). A mode that isn't known (e.g. a broken saved value) falls back
 * to DEFAULT_COLOR_MODE.
 */
export const COLOR_MODES = ['light', 'dark'] as const;
export type ColorMode = (typeof COLOR_MODES)[number];
export const DEFAULT_COLOR_MODE: ColorMode = 'light';

export const isColorMode = (value: unknown): value is ColorMode =>
  typeof value === 'string' && (COLOR_MODES as readonly string[]).includes(value);

/**
 * The reading colours in each mode (FEAT5). Dark mode has brighter versions, so they stay
 * readable (3:1 or more) on the dark cards. The ★ Common Word badge, the JLPT headers and the
 * NEW ribbon keep the same colours in every mode.
 */
export const READING_COLORS_BY_MODE: Record<ColorMode, Record<ReadingKind, string>> = {
  light: READING_COLORS,
  dark: {
    onyomi: '#64b5f6',
    kunyomi: '#f87171',
    okurigana: '#4ade80',
  },
};

/**
 * The outline of a picked card in each mode (FEAT5): brighter in Dark mode so it shows on the dark
 * panel. The tick on a picked card keeps PICK_COLORS (white on green or red) in every mode.
 */
export const PICK_OUTLINE_COLORS: Record<ColorMode, Record<PickKind, string>> = {
  light: PICK_COLORS,
  dark: {
    addBack: '#34d399',
    takeOut: '#fb7185',
  },
};

/**
 * The colours of the page, its boxes and its text in each mode (FEAT5). The web app uses them as
 * Tailwind colours (`bg-card`, `text-ink`, ...): apps/web/src/app/index.css has the same values,
 * the light ones in its @theme and the dark ones under `[data-color-mode='dark']`
 * (apps/web/test/ui-tests/color-mode-css.test.ts checks they match).
 *
 * The light values are exactly the colours the app used before (Tailwind's own colours, written
 * the way Tailwind writes them, e.g. its slate-700 is `oklch(37.2% 0.044 257.287)`), so Light
 * looks the same as it always has. The dark values are the slate palette agreed in the mockup.
 */
const LIGHT_MODE_COLORS = {
  /** The page behind everything. */
  page: '#f8fafc',
  /** Main text: the page's text and the word's meaning. */
  ink: '#0f172a',
  /** The Back button's text, the kanji in a Reading Breakdown row, and the × button under the pointer. */
  'ink-strong': 'oklch(20.8% 0.042 265.755)',
  /** Labels and headings in boxes ("Deck", "Card limit", "Shuffle in from", the panel's headings). */
  'ink-soft': 'oklch(37.2% 0.044 257.287)',
  /** The names of the decks to tick under Multiple decks. */
  'ink-firm': 'oklch(27.9% 0.041 260.031)',
  /** Quieter text: "Card 1 of 10", the reading in 【】, "Full Word Meaning", the card numbers. */
  muted: 'oklch(55.4% 0.046 257.417)',
  /** Hints and messages ("No cards have been shuffled out yet."), the reading in a breakdown row. */
  'muted-strong': 'oklch(44.6% 0.043 257.281)',
  /** The faintest text: the footer, "READING BREAKDOWN", the keyboard hint, a disabled choice. */
  faint: 'oklch(70.4% 0.04 256.788)',
  /** A card, the colour mode button and its menu. */
  card: '#fff',
  /** The thin line around a card and the menu. */
  'card-line': 'oklch(92.9% 0.013 255.508)',
  /** The two blank cards fanned out behind the card on screen (near, far, and the line round them), and a blank card sliding. */
  'card-back-near': '#f8fafc',
  'card-back-far': '#f1f5f9',
  'card-back-line': '#e2e8f0',
  /** The shadow under the blank cards. */
  'card-shadow': 'rgb(15 23 42 / 0.35)',
  /** The Reading Breakdown box on a card. */
  box: 'oklch(98.4% 0.003 247.858)',
  'box-line': 'oklch(92.9% 0.013 255.508)',
  /** The grey rows behind "Deck" and "Card limit". */
  section: 'oklch(96.8% 0.007 247.896)',
  /** Text fields, dropdowns, the − / + buttons, Cancel, and the "Shuffle in from" switch. */
  field: '#fff',
  'field-line': 'oklch(86.9% 0.022 252.894)',
  'field-hover': 'oklch(98.4% 0.003 247.858)',
  /** The lines around and between the choices of the "Shuffle in from" switch. */
  'seg-line': 'oklch(86.9% 0.022 252.894)',
  /** The Back button: an outline button. */
  back: '#fff',
  'back-line': 'oklch(70.4% 0.04 256.788)',
  'back-hover': 'oklch(96.8% 0.007 247.896)',
  /** The Next button: dark with white text in Light, light with dark text in Dark. */
  next: 'oklch(20.8% 0.042 265.755)',
  'next-ink': '#fff',
  'next-hover': 'oklch(37.2% 0.044 257.287)',
  /** The Shuffle In Cards box, and the line around it (only drawn in Dark). */
  'shuffle-box': 'oklch(97.9% 0.021 166.113)',
  'shuffle-line': 'transparent',
  /** The line around the decks to tick under Multiple decks. */
  'ticks-line': 'oklch(90.5% 0.093 164.15)',
  /** The Shuffled-out cards panel, its lines, and the × button under the pointer. */
  panel: 'oklch(97.7% 0.013 236.62)',
  'panel-line': 'oklch(90.1% 0.058 230.902)',
  'panel-hover': 'oklch(95.1% 0.026 236.824)',
  /** "From JLPT N4" on the cards in the panel. */
  'from-ink': 'oklch(44.3% 0.11 240.79)',
  /** The line under the counter after Shuffle In Cards or Add Back Cards. */
  'success-ink': 'oklch(50.8% 0.118 165.612)',
  /** A warning, e.g. ticked decks that are no longer there. */
  'warn-ink': 'oklch(55.5% 0.163 48.998)',
  /** Error messages. */
  'danger-ink': 'oklch(58.6% 0.253 17.585)',
  /** The Clear List question, and the line around it. */
  'danger-ink-strong': 'oklch(51.4% 0.222 16.935)',
  'danger-line': 'oklch(89.2% 0.058 10.001)',
  /** The current mode's row in the colour mode menu. */
  'menu-selected': 'oklch(96.8% 0.007 247.896)',
};
export type ModeColorName = keyof typeof LIGHT_MODE_COLORS;

export const MODE_COLORS: Record<ColorMode, Record<ModeColorName, string>> = {
  light: LIGHT_MODE_COLORS,
  dark: {
    page: '#0f172a',
    ink: '#f1f5f9',
    'ink-strong': '#f1f5f9',
    'ink-soft': '#e2e8f0',
    'ink-firm': '#e2e8f0',
    muted: '#94a3b8',
    'muted-strong': '#94a3b8',
    faint: '#94a3b8',
    card: '#1e293b',
    'card-line': '#334155',
    'card-back-near': '#1a2436',
    'card-back-far': '#162032',
    'card-back-line': '#334155',
    'card-shadow': 'rgb(0 0 0 / 0.6)',
    box: '#162032',
    'box-line': '#334155',
    section: '#1e293b',
    field: '#0f172a',
    'field-line': '#475569',
    'field-hover': '#1e293b',
    'seg-line': '#334155',
    back: 'transparent',
    'back-line': '#64748b',
    'back-hover': '#1e293b',
    next: '#f1f5f9',
    'next-ink': '#0f172a',
    'next-hover': '#cbd5e1',
    'shuffle-box': '#06261f',
    'shuffle-line': '#065f46',
    'ticks-line': '#065f46',
    panel: '#132136',
    'panel-line': '#1e3a5f',
    'panel-hover': '#1e3a5f',
    'from-ink': '#7dd3fc',
    'success-ink': '#34d399',
    'warn-ink': '#fcd34d',
    'danger-ink': '#fb7185',
    'danger-ink-strong': '#fda4af',
    'danger-line': '#9f1239',
    'menu-selected': '#334155',
  },
};

export const JLPT_LABELS: Record<JlptLevel, string> = {
  N5: 'Beginner',
  N4: 'Elementary',
  N3: 'Intermediate',
  N2: 'Upper-Intermediate',
  N1: 'Advanced',
};

export const READING_LABELS: Record<ReadingKind, string> = {
  onyomi: 'Onyomi',
  kunyomi: 'Kunyomi',
  okurigana: 'Okurigana',
};
