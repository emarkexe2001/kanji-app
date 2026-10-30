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
  type ModeColorName,
} from '../../src/tokens';

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

test('there are two modes, Light and Dark, and Light is the default', () => {
  assert.deepEqual([...COLOR_MODES], ['light', 'dark']);
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
