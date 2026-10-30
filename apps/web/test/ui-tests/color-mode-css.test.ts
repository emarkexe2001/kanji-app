// @vitest-environment node
// FEAT5: the colour mode colours in the stylesheet. jsdom draws no colours and doesn't run
// Tailwind, so the stylesheet itself is checked: index.css against the tokens in @kanji/core, Light
// against the colours the app used before, and the stylesheet built as the production build builds
// it, so a colour class or a rule that Tailwind doesn't actually generate is caught (a class name
// test can't see that).
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { compile, optimize } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { beforeAll, describe, expect, test } from 'vitest';
import { MODE_COLORS, READING_COLORS, READING_COLORS_BY_MODE, type ModeColorName } from '@kanji/core';
import { INDEX_CSS, blockAfter, colorVariables, tailwindColor } from './mode-colors';

const WEB = resolve(__dirname, '../..');
const DARK_SELECTOR = ":root[data-color-mode='dark']";
const lightBlock = () => colorVariables(blockAfter(INDEX_CSS, '@theme'));
const darkBlock = () => colorVariables(blockAfter(INDEX_CSS, DARK_SELECTOR));

/**
 * What each colour token replaced (FEAT5): the Tailwind colour (or the colour written in
 * index.css) the same parts of the app used before. Light must look exactly as it did.
 */
const LIGHT_WAS: Record<ModeColorName, string> = {
  page: '#f8fafc', // body background in index.css
  ink: '#0f172a', // body text and .meaning-text in index.css
  'ink-strong': tailwindColor('slate-900'),
  'ink-soft': tailwindColor('slate-700'),
  'ink-firm': tailwindColor('slate-800'),
  muted: tailwindColor('slate-500'),
  'muted-strong': tailwindColor('slate-600'),
  faint: tailwindColor('slate-400'),
  card: tailwindColor('white'),
  'card-line': tailwindColor('slate-200'),
  'card-back-near': '#f8fafc', // .deck-back-near in index.css
  'card-back-far': '#f1f5f9', // .deck-back-far and .card-flyer-blank
  'card-back-line': '#e2e8f0', // their ring
  'card-shadow': 'rgb(15 23 42 / 0.35)', // their shadow
  box: tailwindColor('slate-50'),
  'box-line': tailwindColor('slate-200'),
  section: tailwindColor('slate-100'),
  field: tailwindColor('white'),
  'field-line': tailwindColor('slate-300'),
  'field-hover': tailwindColor('slate-50'),
  'seg-line': tailwindColor('slate-300'),
  back: tailwindColor('white'),
  'back-line': tailwindColor('slate-400'),
  'back-hover': tailwindColor('slate-100'),
  next: tailwindColor('slate-900'),
  'next-ink': tailwindColor('white'),
  'next-hover': tailwindColor('slate-700'),
  'shuffle-box': tailwindColor('emerald-50'),
  'shuffle-line': 'transparent', // new: only drawn in Dark
  'ticks-line': tailwindColor('emerald-200'),
  panel: tailwindColor('sky-50'),
  'panel-line': tailwindColor('sky-200'),
  'panel-hover': tailwindColor('sky-100'),
  'from-ink': tailwindColor('sky-800'),
  'success-ink': tailwindColor('emerald-700'),
  'warn-ink': tailwindColor('amber-700'),
  'danger-ink': tailwindColor('rose-600'),
  'danger-ink-strong': tailwindColor('rose-700'),
  'danger-line': tailwindColor('rose-200'),
  'menu-selected': tailwindColor('slate-100'),
};

describe('index.css and the colour tokens in @kanji/core (FEAT5)', () => {
  test('the Light colours in index.css are the ones in MODE_COLORS.light, and nothing is missing', () => {
    const css = lightBlock();
    for (const [name, value] of Object.entries(MODE_COLORS.light)) expect(css[name], name).toBe(value);
  });

  test('the Dark colours in index.css are the ones in MODE_COLORS.dark and READING_COLORS_BY_MODE.dark, and nothing else changes', () => {
    const css = darkBlock();
    const expected: Record<string, string> = {
      ...MODE_COLORS.dark,
      onyomi: READING_COLORS_BY_MODE.dark.onyomi,
      kunyomi: READING_COLORS_BY_MODE.dark.kunyomi,
      okurigana: READING_COLORS_BY_MODE.dark.okurigana,
    };
    expect(css).toEqual(expected);
    // The JLPT headers, the Common badge and the NEW ribbon keep their colours: not in the Dark block.
    expect(Object.keys(css).some((name) => /^(jlpt|common)/.test(name))).toBe(false);
    // The browser's own parts (dropdown lists, number arrows, scrollbars) go dark too.
    expect(blockAfter(INDEX_CSS, DARK_SELECTOR)).toMatch(/color-scheme:\s*dark;/);
  });

  test('the reading colours in Light are still the ones in READING_COLORS', () => {
    const css = lightBlock();
    expect(css.onyomi).toBe(READING_COLORS.onyomi);
    expect(css.kunyomi).toBe(READING_COLORS.kunyomi);
    expect(css.okurigana).toBe(READING_COLORS.okurigana);
  });

  test('Light looks as it did: every colour token is the colour the same part used before', () => {
    expect(Object.keys(LIGHT_WAS).sort()).toEqual(Object.keys(MODE_COLORS.light).sort());
    for (const [name, value] of Object.entries(MODE_COLORS.light)) {
      expect(value, name).toBe(LIGHT_WAS[name as ModeColorName]);
    }
  });

  test('no colours are written straight into index.css rules any more, apart from the tokens themselves', () => {
    // Every colour outside the token blocks comes from a token (var(--color-...)) or is a system
    // colour for forced-colours mode, so Dark covers it.
    const rules = INDEX_CSS.replace(/@theme\s*\{[^}]*\}/, '').replace(
      /:root\[data-color-mode='dark'\]\s*\{[^}]*\}/,
      '',
    );
    expect(rules).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(rules).not.toMatch(/\b(rgb|oklch|hsl)\(/i);
  });
});

/** Every Tailwind class in src/ that uses a colour token, e.g. "bg-card", "hover:bg-field-hover". */
function tokenClassesInSource(): string[] {
  const names = [...Object.keys(MODE_COLORS.light)].sort((a, b) => b.length - a.length).join('|');
  const pattern = new RegExp(`(?<![\\w-])((?:[a-z-]+:)*(?:bg|text|border|ring|outline)-(?:${names}))(?![\\w-])`, 'g');
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.tsx?$/.test(entry.name)) files.push(path);
    }
  };
  walk(join(WEB, 'src'));
  const found = new Set<string>();
  for (const file of files) for (const m of readFileSync(file, 'utf8').matchAll(pattern)) found.add(m[1]);
  return [...found].sort();
}

/** A class as Tailwind writes it in a selector: ":" and "/" are escaped. */
const selectorOf = (cls: string) => `.${cls.replace(/[:/[\]]/g, (c) => `\\${c}`)}`;

describe('the built stylesheet (FEAT5)', () => {
  let css = '';

  // Builds index.css the way the production build does (@tailwindcss/vite): Tailwind compiles it,
  // scans the app's files for the classes they use, generates them, and the result is minified.
  // Only the stylesheet is built, not the whole app, so it is quick and doesn't slow other tests.
  beforeAll(async () => {
    const compiler = await compile(INDEX_CSS, { base: join(WEB, 'src/app'), onDependency: () => {} });
    const root =
      compiler.root === 'none' ? [] : compiler.root === null ? [{ base: WEB, pattern: '**/*' }] : [compiler.root];
    const scanner = new Scanner({ sources: [...root.map((s) => ({ ...s, negated: false })), ...compiler.sources] });
    css = optimize(compiler.build(scanner.scan()), { minify: true }).code;
  }, 60_000);

  test('every colour token class used in the code is generated', () => {
    const classes = tokenClassesInSource();
    // A sample of what is used, so the search above can't quietly find nothing.
    expect(classes).toEqual(expect.arrayContaining(['bg-card', 'text-ink', 'bg-panel', 'hover:bg-menu-selected']));
    const missing = classes.filter((cls) => !css.includes(selectorOf(cls)));
    expect(missing).toEqual([]);
  });

  test('every colour token is defined for Light and changed for Dark', () => {
    const dark = /:root\[data-color-mode=(?:'dark'|"dark"|dark)\]\{([^}]*)\}/.exec(css);
    expect(dark).not.toBeNull();
    for (const [name, value] of Object.entries(MODE_COLORS.dark)) {
      expect(css, `--color-${name} in Light`).toMatch(new RegExp(`--color-${name}:`));
      // The build may write a colour more briefly (e.g. #fff), so the value is compared loosely.
      expect(dark![1], `--color-${name} in Dark`).toMatch(new RegExp(`--color-${name}:\\s*${short(value)}[;}]?`));
    }
    expect(dark![1]).toMatch(/color-scheme:\s*dark/);
  });

  test('switching modes turns transitions off for a moment, so nothing fades', () => {
    expect(css).toMatch(/\[data-color-mode-switching\][^{]*\{[^}]*transition:\s*none\s*!important/);
  });
});

/** A regular expression for `value` as a minifier might write it (#aabbcc -> #abc, spaces in rgb()). */
function short(value: string): string {
  const hex = /^#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3$/i.exec(value);
  if (hex) return `(?:${value}|#${hex[1]}${hex[2]}${hex[3]})`;
  if (value.startsWith('rgb(')) return '(?:rgb|#)[^;}]*';
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
