// FEAT5: the colour modes and the Dark palette, with the contrast the ticket asks for.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COLOR_MODES,
  COMMON_COLOR,
  DEFAULT_COLOR_MODE,
  JLPT_COLORS,
  MODE_COLORS,
  NEW_COLOR,
  PICK_COLORS,
  PICK_OUTLINE_COLORS,
  READING_COLORS,
  READING_COLORS_BY_MODE,
  isColorMode,
  modeColor,
  CARD_COLORS_BY_MODE,
  FALLBACK_HEADER,
  FALLBACK_INK,
  HIGH_CONTRAST_COLORS,
  JLPT_COLORS_BY_MODE,
  PICK_TICK_COLORS,
  type ColorMode,
  type ModeColorName,
} from '../../src/tokens';
import type { ReadingKind } from '../../src/types';

/** sRGB (0-255) from a #rrggbb colour. The Dark values are all written this way. */
function rgb(hex: string): [number, number, number] {
  assert.match(hex, /^#[0-9a-f]{6}$/, `${hex} should be a #rrggbb colour`);
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

const luminance = (c: [number, number, number]) => {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** The WCAG contrast ratio between two colours (#rrggbb or rgb triples). */
function contrast(a: string | [number, number, number], b: string | [number, number, number]) {
  const [x, y] = [luminance(typeof a === 'string' ? rgb(a) : a), luminance(typeof b === 'string' ? rgb(b) : b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** `fg` drawn at `alpha` over `bg`, as the tinted Reading Breakdown pills are. */
const over = (fg: string, alpha: number, bg: string) =>
  rgb(fg).map((c, i) => Math.round(c * alpha + rgb(bg)[i] * (1 - alpha))) as [number, number, number];

const dark = MODE_COLORS.dark;

test('there are three modes, Light, Dark and High contrast (FEAT5_5), in that order, and Light is the default', () => {
  assert.deepEqual([...COLOR_MODES], ['light', 'dark', 'high-contrast']);
  assert.equal(DEFAULT_COLOR_MODE, 'light');
});

test('only the exact names of the modes are modes; anything else (e.g. a broken saved value) is not', () => {
  for (const mode of COLOR_MODES) assert.equal(isColorMode(mode), true);
  for (const bad of ['Dark', 'LIGHT', ' dark', 'black', 'slate', '', '"dark"', '{"mode":"dark"}', null, undefined, 1]) {
    assert.equal(isColorMode(bad), false, String(bad));
  }
});

test('every mode has a colour for every part of the app', () => {
  const names = Object.keys(MODE_COLORS.light).sort();
  for (const mode of COLOR_MODES) {
    assert.deepEqual(Object.keys(MODE_COLORS[mode]).sort(), names, mode);
    for (const value of Object.values(MODE_COLORS[mode])) assert.ok(value.length > 0);
  }
});

test('Dark is the agreed slate palette: page #0f172a, cards and boxes #1e293b, borders #334155, text #f1f5f9, muted text #94a3b8', () => {
  assert.equal(dark.page, '#0f172a');
  assert.equal(dark.card, '#1e293b');
  assert.equal(dark.section, '#1e293b');
  assert.equal(dark['card-line'], '#334155');
  assert.equal(dark['box-line'], '#334155');
  assert.equal(dark.ink, '#f1f5f9');
  assert.equal(dark.muted, '#94a3b8');
  // Slate (dark blue-grey), not true black, so it can be told apart from High contrast (FEAT5_5).
  assert.notEqual(dark.page, '#000000');
});

test('in Dark the reading colours and pick outlines are the brighter versions from the ticket; Light keeps today’s', () => {
  assert.deepEqual(READING_COLORS_BY_MODE.dark, { onyomi: '#64b5f6', kunyomi: '#f87171', okurigana: '#4ade80' });
  assert.deepEqual(PICK_OUTLINE_COLORS.dark, { addBack: '#34d399', takeOut: '#fb7185' });
  assert.equal(READING_COLORS_BY_MODE.light, READING_COLORS);
  assert.deepEqual(READING_COLORS, { onyomi: '#1e88e5', kunyomi: '#e53935', okurigana: '#43a047' });
  assert.equal(PICK_OUTLINE_COLORS.light, PICK_COLORS);
  assert.deepEqual(PICK_COLORS, { addBack: '#059669', takeOut: '#e11d48' });
});

test('in Dark, Next is light with dark text and Back keeps an outline', () => {
  assert.equal(dark.next, '#f1f5f9');
  assert.equal(dark['next-ink'], '#0f172a');
  assert.equal(dark.back, 'transparent');
  assert.ok(contrast(dark['back-line'], dark.page) >= 3, 'the outline shows on the page');
});

/** [text, background] pairs of Dark colours as they are used in the app. */
const TEXT_PAIRS: [ModeColorName, ModeColorName][] = [
  ['ink', 'page'],
  ['ink', 'card'],
  ['ink', 'section'],
  ['ink', 'box'],
  ['ink', 'field'],
  ['ink', 'panel'],
  ['ink', 'shuffle-box'],
  ['ink', 'menu-selected'],
  ['ink-strong', 'page'],
  ['ink-strong', 'box'],
  ['ink-strong', 'panel-hover'],
  ['ink-soft', 'page'],
  ['ink-soft', 'section'],
  ['ink-soft', 'panel'],
  ['ink-soft', 'shuffle-box'],
  ['ink-soft', 'field'],
  ['ink-soft', 'card'],
  ['ink-firm', 'field'],
  ['muted', 'page'],
  ['muted', 'card'],
  ['muted', 'box'],
  ['muted', 'panel'],
  ['muted-strong', 'card'],
  ['muted-strong', 'box'],
  ['muted-strong', 'panel'],
  ['muted-strong', 'shuffle-box'],
  ['muted-strong', 'section'],
  ['faint', 'page'],
  ['faint', 'card'],
  ['faint', 'box'],
  ['from-ink', 'card'],
  ['success-ink', 'page'],
  ['warn-ink', 'shuffle-box'],
  ['danger-ink', 'page'],
  ['danger-ink', 'panel'],
  ['danger-ink', 'shuffle-box'],
  ['danger-ink', 'section'],
  ['danger-ink-strong', 'card'],
  ['next-ink', 'next'],
];

test('in Dark every text colour is at least 4.5:1 on what it sits on', () => {
  for (const [fg, bg] of TEXT_PAIRS) {
    const ratio = contrast(dark[fg], dark[bg]);
    assert.ok(ratio >= 4.5, `${fg} on ${bg}: ${ratio.toFixed(2)}:1`);
  }
});

test('in Dark the reading words are at least 3:1 on the card, the Reading Breakdown box and their tinted pills', () => {
  for (const color of Object.values(READING_COLORS_BY_MODE.dark)) {
    for (const bg of [dark.card, dark.box]) assert.ok(contrast(color, bg) >= 3, `${color} on ${bg}`);
    // The pill behind a Root Meaning or Grammar line: the reading colour at 16% over the box.
    assert.ok(contrast(color, over(color, 0x29 / 255, dark.box)) >= 3, `${color} on its pill`);
  }
});

test('in Dark the pick outlines are at least 3:1 on the panel and on the cards they go round', () => {
  for (const color of Object.values(PICK_OUTLINE_COLORS.dark)) {
    for (const bg of [dark.panel, dark.card]) assert.ok(contrast(color, bg) >= 3, `${color} on ${bg}`);
  }
});

test('in Dark the reading colours, the pick outlines, the JLPT headers, the NEW ribbon and the danger colour can still be told apart', () => {
  const readings = Object.values(READING_COLORS_BY_MODE.dark);
  const picks = Object.values(PICK_OUTLINE_COLORS.dark);
  assert.equal(new Set(readings).size, 3);
  assert.equal(new Set(picks).size, 2);
  // The colour-coded parts that keep today's colours are unchanged: JLPT headers, the Common badge
  // and the NEW ribbon (and the coloured buttons, which are Tailwind colours in the web app).
  assert.deepEqual(JLPT_COLORS, { N5: '#10b981', N4: '#06b6d4', N3: '#6366f1', N2: '#8b5cf6', N1: '#f43f5e' });
  assert.equal(COMMON_COLOR, '#eba834');
  assert.equal(NEW_COLOR, '#fbbf24');
  // The Common badge and the NEW ribbon still show on a dark card.
  assert.ok(contrast(COMMON_COLOR, dark.card) >= 3);
  assert.ok(contrast(NEW_COLOR, dark.card) >= 3);
  // Error messages (danger) aren't drawn in the same red as Kunyomi.
  assert.notEqual(dark['danger-ink'], READING_COLORS_BY_MODE.dark.kunyomi);
});

test('modeColor gives the colour for the mode, or the fallback when it is missing, and never throws (FEAT5_5)', () => {
  assert.equal(modeColor(READING_COLORS_BY_MODE, 'high-contrast', 'kunyomi', '#ffffff'), '#ff8a8a');
  // A key missing from the mode's entry.
  const noKunyomi: Record<ColorMode, Partial<Record<ReadingKind, string>>> = {
    ...READING_COLORS_BY_MODE,
    'high-contrast': { onyomi: '#6cb8ff', okurigana: '#5ce67c' },
  };
  assert.equal(modeColor(noKunyomi, 'high-contrast', 'kunyomi', FALLBACK_INK['high-contrast']), '#ffffff');
  // A whole mode missing, or no table at all.
  const noHighContrast: Partial<typeof READING_COLORS_BY_MODE> = { light: READING_COLORS };
  assert.equal(modeColor(noHighContrast, 'high-contrast', 'onyomi', '#ffffff'), '#ffffff');
  assert.equal(modeColor(undefined, 'high-contrast', 'onyomi', '#ffffff'), '#ffffff');
  // A mode that isn't in the table even by name (e.g. a table written before High contrast).
  assert.equal(modeColor({ light: { a: '#111111' } }, 'nope' as ColorMode, 'a', '#ffffff'), '#ffffff');
});

test('the fallback text colour is the main text colour of each mode, white in High contrast (FEAT5_5)', () => {
  for (const mode of COLOR_MODES) assert.equal(FALLBACK_INK[mode], MODE_COLORS[mode].ink, mode);
  assert.equal(FALLBACK_INK['high-contrast'], '#ffffff');
});

// ---- High contrast (FEAT5_5): the agreed palette, 7:1 contrast, no greys, colours that stay apart,
// and Light and Dark left as they were. ----

const hc = MODE_COLORS['high-contrast'];
const BLACK = '#000000';
const WHITE = '#ffffff';

test('High contrast uses the agreed palette A (agreed 2026-11-09)', () => {
  assert.deepEqual(READING_COLORS_BY_MODE['high-contrast'], {
    onyomi: '#6cb8ff',
    kunyomi: '#ff8a8a',
    okurigana: '#5ce67c',
  });
  assert.deepEqual(JLPT_COLORS_BY_MODE['high-contrast'], {
    N5: '#3ee8a5',
    N4: '#3dd9f5',
    N3: '#a8b4ff',
    N2: '#d4a8ff',
    N1: '#ff9eb1',
  });
  assert.deepEqual(PICK_OUTLINE_COLORS['high-contrast'], { addBack: '#5ce67c', takeOut: '#ff8a9e' });
  // The tick is the pick colour (with a black ✓, set in the web app).
  assert.deepEqual(PICK_TICK_COLORS['high-contrast'], { addBack: '#5ce67c', takeOut: '#ff8a9e' });
  assert.deepEqual(CARD_COLORS_BY_MODE['high-contrast'], {
    noLevel: '#d0d7e0',
    newRibbon: '#ffd23f',
    common: '#ffc94d',
  });
  for (const name of ['danger-ink', 'danger-ink-strong', 'danger-line'] as const) {
    assert.equal(hc[name], '#ff8a9e', name);
  }
  // Filled in from the agreed rules (agreed 2026-11-09): warning text is the NEW ribbon's yellow.
  assert.equal(hc['warn-ink'], '#ffd23f');
  assert.equal(hc['success-ink'], '#5ce67c');
  // The coloured buttons' outlines, the hover fill of black controls and the yellow focus ring.
  assert.deepEqual(HIGH_CONTRAST_COLORS, {
    'hc-sky': '#6cb8ff',
    'hc-indigo': '#a8b4ff',
    'hc-emerald': '#5ce67c',
    'hc-rose': '#ff8a9e',
    'hc-hover': '#262626',
    'hc-focus': '#ffff00',
  });
});

test('High contrast is black with white text and white lines, with no greys (agreed 2026-11-09)', () => {
  // All text is white: "Card 1 of 10", the 【reading】, READING BREAKDOWN, "From JLPT", the card
  // numbers and the footer use these tokens.
  const text = ['ink', 'ink-strong', 'ink-soft', 'ink-firm', 'muted', 'muted-strong', 'faint', 'from-ink'] as const;
  for (const name of text) assert.equal(hc[name], WHITE, name);
  const fills = [
    'page',
    'card',
    'card-back-near',
    'card-back-far',
    'box',
    'section',
    'field',
    'back',
    'shuffle-box',
    'panel',
  ] as const;
  for (const name of fills) assert.equal(hc[name], BLACK, name);
  const lines = [
    'card-line',
    'card-back-line',
    'box-line',
    'field-line',
    'seg-line',
    'back-line',
    'shuffle-line',
    'ticks-line',
    'panel-line',
  ] as const;
  for (const name of lines) assert.equal(hc[name], WHITE, name);
  // Next is white with black text; there are no shadows.
  assert.equal(hc.next, WHITE);
  assert.equal(hc['next-ink'], BLACK);
  assert.equal(hc['card-shadow'], 'transparent');
});

test('in High contrast black controls fill with #262626 under the pointer, and Next turns #d4d4d4 (agreed 2026-11-09)', () => {
  for (const name of ['field-hover', 'back-hover', 'panel-hover', 'menu-selected'] as const) {
    assert.equal(hc[name], '#262626', name);
  }
  assert.equal(HIGH_CONTRAST_COLORS['hc-hover'], '#262626');
  assert.equal(hc['next-hover'], '#d4d4d4');
});

type Pair = [what: string, colour: string, background: string];

/**
 * Every text (or line) colour and what it sits on in High contrast, as the app uses them
 * (FEAT5_5). The ticket asks for at least 7:1.
 */
const HIGH_CONTRAST_PAIRS: Pair[] = [
  // The Dark text pairs, now in High contrast.
  ...TEXT_PAIRS.map(([fg, bg]): Pair => [`${fg} on ${bg}`, hc[fg], hc[bg]]),
  // White text on the hover fills, and Next's black text on its hover.
  ...(['field-hover', 'back-hover', 'panel-hover', 'menu-selected'] as const).map((bg): Pair => [
    `ink on ${bg}`,
    hc.ink,
    hc[bg],
  ]),
  ['white text on a coloured button under the pointer (hc-hover)', WHITE, HIGH_CONTRAST_COLORS['hc-hover']],
  ['next-ink on next-hover', hc['next-ink'], hc['next-hover']],
  // Palette A on black, and black text on palette A (the JLPT headers, the tick, the NEW ribbon).
  ...Object.entries(READING_COLORS_BY_MODE['high-contrast']).flatMap(([kind, c]): Pair[] => [
    [`${kind} on the card`, c, hc.card],
    [`${kind} on the Reading Breakdown box (no tint)`, c, hc.box],
  ]),
  ...Object.entries(JLPT_COLORS_BY_MODE['high-contrast']).flatMap(([level, c]): Pair[] => [
    [`JLPT ${level} on black`, c, BLACK],
    [`black text on the JLPT ${level} header`, BLACK, c],
  ]),
  ['no-level header on black', CARD_COLORS_BY_MODE['high-contrast'].noLevel, BLACK],
  ['black text on the no-level header', BLACK, CARD_COLORS_BY_MODE['high-contrast'].noLevel],
  ['black text on the NEW ribbon', BLACK, CARD_COLORS_BY_MODE['high-contrast'].newRibbon],
  ['★ Common Word on the card', CARD_COLORS_BY_MODE['high-contrast'].common, hc.card],
  ...Object.entries(PICK_OUTLINE_COLORS['high-contrast']).flatMap(([kind, c]): Pair[] => [
    [`${kind} outline on the panel`, c, hc.panel],
    [`${kind} outline on the card`, c, hc.card],
  ]),
  ...Object.entries(PICK_TICK_COLORS['high-contrast']).map(([kind, c]): Pair => [
    `black ✓ on the ${kind} tick`,
    BLACK,
    c,
  ]),
  // The coloured buttons' outlines and Clear List's red text, on the black button.
  ...(['hc-sky', 'hc-indigo', 'hc-emerald', 'hc-rose'] as const).map((name): Pair => [
    `${name} on black`,
    HIGH_CONTRAST_COLORS[name],
    BLACK,
  ]),
  // Under the pointer Clear List's text turns white on the #262626 fill (agreed 2026-11-09: its red
  // on #262626 would only be 6.76:1, so that pair is never drawn).
  ['Clear List text under the pointer (white on hc-hover)', WHITE, HIGH_CONTRAST_COLORS['hc-hover']],
  ['danger-line on the card', hc['danger-line'], hc.card],
  ['the yellow focus ring on black', HIGH_CONTRAST_COLORS['hc-focus'], BLACK],
  ['the yellow focus ring on a hover fill', HIGH_CONTRAST_COLORS['hc-focus'], HIGH_CONTRAST_COLORS['hc-hover']],
  // The fallback when a colour is missing (white on black).
  ['the fallback header', FALLBACK_HEADER.ink, FALLBACK_HEADER.background],
  ['the fallback text on the card', FALLBACK_INK['high-contrast'], hc.card],
];

test('in High contrast every agreed colour pair is at least 7:1 (FEAT5_5)', () => {
  assert.ok(HIGH_CONTRAST_PAIRS.length >= 80, 'the list of pairs is filled in');
  for (const [what, fg, bg] of HIGH_CONTRAST_PAIRS) {
    const ratio = contrast(fg, bg);
    assert.ok(ratio >= 7, `${what}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1`);
  }
});

test('in High contrast the colour coding can still be told apart (FEAT5_5)', () => {
  const readings = READING_COLORS_BY_MODE['high-contrast'];
  assert.equal(new Set(Object.values(readings)).size, 3, 'the three reading colours');
  assert.notEqual(PICK_OUTLINE_COLORS['high-contrast'].addBack, PICK_OUTLINE_COLORS['high-contrast'].takeOut);
  assert.notEqual(PICK_TICK_COLORS['high-contrast'].addBack, PICK_TICK_COLORS['high-contrast'].takeOut);
  const jlpt = Object.values(JLPT_COLORS_BY_MODE['high-contrast']);
  assert.equal(new Set(jlpt).size, 5, 'the five JLPT colours');
  assert.ok(!jlpt.includes(CARD_COLORS_BY_MODE['high-contrast'].noLevel), 'no level is not a JLPT colour');
  // Error messages aren't the Kunyomi red, and the NEW ribbon isn't the Common badge's yellow.
  assert.notEqual(hc['danger-ink'], readings.kunyomi);
  assert.notEqual(CARD_COLORS_BY_MODE['high-contrast'].newRibbon, CARD_COLORS_BY_MODE['high-contrast'].common);
});

test('Light and Dark are unchanged by High contrast (FEAT5_5)', () => {
  // Dark as it was agreed in FEAT5 (Light is checked against the colours it always had in
  // color-mode-css.test.ts).
  assert.deepEqual(MODE_COLORS.dark, {
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
  });
  // The new tables keep the colours Light and Dark always had.
  for (const mode of ['light', 'dark'] as const) {
    assert.deepEqual(PICK_TICK_COLORS[mode], PICK_COLORS, mode);
    assert.deepEqual(JLPT_COLORS_BY_MODE[mode], JLPT_COLORS, mode);
    assert.deepEqual(
      CARD_COLORS_BY_MODE[mode],
      { noLevel: '#64748b', newRibbon: NEW_COLOR, common: COMMON_COLOR },
      mode,
    );
  }
});
