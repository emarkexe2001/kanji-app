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
import {
  HIGH_CONTRAST_COLORS,
  MODE_COLORS,
  READING_COLORS,
  READING_COLORS_BY_MODE,
  type ModeColorName,
} from '@kanji/core';
import { INDEX_CSS, blockAfter, colorVariables, tailwindColor } from './mode-colors';

const WEB = resolve(__dirname, '../..');
const DARK_SELECTOR = ":root[data-color-mode='dark']";
const HIGH_CONTRAST_SELECTOR = ":root[data-color-mode='high-contrast'] {";
const lightBlock = () => colorVariables(blockAfter(INDEX_CSS, '@theme'));
const darkBlock = () => colorVariables(blockAfter(INDEX_CSS, DARK_SELECTOR));
const highContrastBlock = () => colorVariables(blockAfter(INDEX_CSS, HIGH_CONTRAST_SELECTOR));

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

  test('the High contrast colours in index.css are the ones in MODE_COLORS and READING_COLORS_BY_MODE, and none is missing (FEAT5_5)', () => {
    const css = highContrastBlock();
    const expected: Record<string, string> = {
      ...MODE_COLORS['high-contrast'],
      onyomi: READING_COLORS_BY_MODE['high-contrast'].onyomi,
      kunyomi: READING_COLORS_BY_MODE['high-contrast'].kunyomi,
      okurigana: READING_COLORS_BY_MODE['high-contrast'].okurigana,
    };
    // Every colour token (ModeColorName) must be in the block: one left out would show its Light
    // colour in High contrast.
    expect(css).toEqual(expected);
    expect(blockAfter(INDEX_CSS, HIGH_CONTRAST_SELECTOR)).toMatch(/color-scheme:\s*dark;/);
  });

  test('the fixed High contrast colours in the @theme are the ones in HIGH_CONTRAST_COLORS (FEAT5_5)', () => {
    const css = lightBlock();
    for (const [name, value] of Object.entries(HIGH_CONTRAST_COLORS)) expect(css[name], name).toBe(value);
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
    // colour for forced-colours mode, so Dark covers it. High contrast's safety net (white on black
    // even if a token is left out, FEAT5_5) has to write its colours out, so it is left out too.
    const rules = INDEX_CSS.replace(/@theme\s*\{[^}]*\}/, '')
      .replace(/:root\[data-color-mode='dark'\]\s*\{[^}]*\}/, '')
      .replace(/:root\[data-color-mode='high-contrast'\]\s*\{[^}]*\}/, '')
      .replace(/:root\[data-color-mode='high-contrast'\] body\s*\{\s*background: #000000;\s*color: #ffffff;\s*\}/, '');
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

/** Any class as it appears in a selector: every character other than a letter, digit, - or _ is escaped. */
const escapedSelector = (cls: string) => `.${cls.replace(/[^\w-]/g, (c) => `\\${c}`)}`;

describe('the built stylesheet (FEAT5)', () => {
  let css = '';

  // Builds index.css the way the production build does (@tailwindcss/vite): Tailwind compiles it,
  // scans the app's files for the classes they use, generates them, and the result is minified.
  // Only the stylesheet is built, not the whole app, so it is quick and doesn't slow other tests.
  // Only src/ is scanned (FEAT5_5): the production scan also reads test/, so a class removed from
  // the app but still named in a test would otherwise stay generated and a check here couldn't
  // catch it. index.html has no classes.
  beforeAll(async () => {
    const compiler = await compile(INDEX_CSS, { base: join(WEB, 'src/app'), onDependency: () => {} });
    const root =
      compiler.root === 'none'
        ? []
        : compiler.root === null
          ? [{ base: join(WEB, 'src'), pattern: '**/*' }]
          : [compiler.root];
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

  test('every class on the colour mode start page is generated (FEAT5_1)', () => {
    // The start page brings new classes (arbitrary sizes such as h-[112px] and w-[55%], the press-in
    // active:scale-[0.98]); a class Tailwind doesn't generate would quietly do nothing.
    const source = readFileSync(join(WEB, 'src/features/color-mode/components/color-mode-start-page.tsx'), 'utf8');
    const tile = /const TILE = \[([\s\S]*?)\]\.join/.exec(source)![1];
    // The tiles' layouts (FEAT5_5: High contrast's wide tile) and the classes chosen in code.
    const layouts = /const TILE_LAYOUT[^=]*= \{([\s\S]*?)\};/.exec(source)![1];
    const templates = [...source.matchAll(/className=\{`([^`]+)`\}/g)].map((m) => m[1]);
    const strings = [
      ...[...source.matchAll(/className="([^"]+)"/g)].map((m) => m[1]),
      ...[...tile.matchAll(/'([^']+)'/g)].map((m) => m[1]),
      ...[...layouts.matchAll(/: '([^']+)'/g)].map((m) => m[1]),
      ...[...source.matchAll(/const [A-Z_]+ = '([^']+)'/g)].map((m) => m[1]),
      ...templates.map((t) => t.replace(/\$\{[\s\S]*?\}/g, ' ')),
      ...templates.flatMap((t) => [...t.matchAll(/'([^']+)'/g)].map((m) => m[1])),
    ];
    const classes = [...new Set(strings.flatMap((s) => s.split(/\s+/)).filter(Boolean))].sort();
    // A sample, so the search above can't quietly find nothing.
    expect(classes).toEqual(
      expect.arrayContaining([
        'h-[112px]',
        'w-[55%]',
        'w-4/5',
        'text-[8px]',
        'active:scale-[0.98]',
        'hover:bg-menu-selected',
        'forced-colors:border-[color:ButtonText]',
        'justify-center',
        // FEAT5_5: High contrast's wide tile and its preview.
        'col-span-2',
        'h-[88px]',
        'h-[66px]',
        'w-[calc(50%-17px)]',
        'text-black',
      ]),
    );
    const missing = classes.filter((cls) => !css.includes(escapedSelector(cls)));
    expect(missing).toEqual([]);
  });

  test('switching modes turns transitions off for a moment, so nothing fades', () => {
    expect(css).toMatch(/\[data-color-mode-switching\][^{]*\{[^}]*transition:\s*none\s*!important/);
  });

  // ---- High contrast (FEAT5_5). jsdom has no forced-colours mode, screen widths, outlines or
  // hover, so these are checked in the stylesheet as it is built. ----

  test('the hc: classes only apply in High contrast and never in a forced-colours mode, so the device’s colours still win (FEAT5_5)', () => {
    // The variant in index.css: High contrast on <html>, and not in forced colours.
    expect(INDEX_CSS).toMatch(
      /@custom-variant hc\s*\{\s*@media not \(forced-colors: active\)\s*\{\s*&:where\(\[data-color-mode='high-contrast'\], \[data-color-mode='high-contrast'\] \*\)\s*\{\s*@slot;/,
    );
    const hcRules = css.match(/\.hc\\:[^{]*\{/g) ?? [];
    expect(hcRules.length).toBeGreaterThanOrEqual(40);
    // Every one is inside `@media not all and (forced-colors:active)`: none is left once those
    // blocks are taken out.
    const forcedColorsOff = /@media not all and \(forced-colors:\s*active\)\s*\{/g;
    expect(css).toMatch(forcedColorsOff);
    expect(withoutBlocks(css, forcedColorsOff)).not.toMatch(/\.hc\\:/);
    // And every one is for High contrast only, so Light and Dark are unchanged.
    for (const rule of hcRules) expect(rule).toContain('[data-color-mode=high-contrast]');
  });

  test('every hc: class in the code is generated (FEAT5_5)', () => {
    const classes = classesInSource(/(?<![\w-])hc:[^\s'"`]+/g);
    // A sample, so the search above can't quietly find nothing.
    expect(classes).toEqual(
      expect.arrayContaining([
        'hc:ring-2',
        'hc:shadow-none',
        'hc:ring-hc-sky',
        'hc:has-checked:ring-3',
        'hc:disabled:outline-dashed',
        'hc:has-disabled:outline-dashed',
        'hc:shadow-[0_0_0_2px_#000]',
        'hc:hover:bg-hc-hover',
      ]),
    );
    const missing = classes.filter((cls) => !css.includes(escapedSelector(cls)));
    expect(missing).toEqual([]);
  });

  test('the High contrast name on the colour mode button is hidden below 375px and shown from 375px up (FEAT5_5)', () => {
    // jsdom has no screen widths: the built rules are checked. `hidden` comes first, so the
    // min-width rule wins from 375px.
    const hidden = css.indexOf('.hidden{display:none}');
    const shown = css.search(
      /@media \((?:min-width:\s*375px|width>=375px)\)\s*\{\s*\.min-\\\[375px\\\]\\:inline\{display:inline\}/,
    );
    expect(hidden).toBeGreaterThan(-1);
    expect(shown).toBeGreaterThan(hidden);
  });

  test('the High contrast classes win over the classes they replace: they come later with the same weight (FEAT5_5)', () => {
    // [the class used in Light and Dark, the hc: class that replaces it in High contrast]
    const pairs: [string, string][] = [
      ['opacity-40', 'hc:opacity-100'],
      ['disabled:opacity-40', 'hc:disabled:opacity-100'],
      ['has-checked:bg-emerald-700', 'hc:has-checked:bg-white'],
      ['has-checked:text-white', 'hc:has-checked:text-black'],
      ['has-disabled:bg-section', 'hc:has-disabled:bg-page'],
      ['has-disabled:text-faint', 'hc:has-disabled:text-ink'],
      ['has-checked:ring-2', 'hc:has-checked:ring-3'],
      ['has-focus-visible:outline-offset-2', 'hc:has-focus-visible:outline-offset-[5px]'],
      ['has-focus-visible:outline-ink-soft', 'hc:has-focus-visible:outline-hc-focus'],
      ['has-focus-visible:outline-2', 'hc:has-focus-visible:outline-3'],
      ['bg-sky-600', 'hc:bg-page'],
      ['bg-emerald-600', 'hc:bg-page'],
      ['text-white', 'hc:text-black'],
      ['text-white', 'hc:text-ink'],
      ['text-white', 'hc:text-hc-rose'],
      ['hover:bg-sky-500', 'hc:hover:bg-hc-hover'],
      ['hover:bg-rose-500', 'hc:hover:bg-hc-hover'],
      ['bg-menu-selected', 'hc:bg-card'],
      ['ring-1', 'hc:ring-2'],
      ['shadow-sm', 'hc:shadow-none'],
      ['shadow-lg', 'hc:shadow-none'],
      ['shadow-xl', 'hc:shadow-none'],
    ];
    for (const [base, hc] of pairs) {
      const [at, hcAt] = [firstRule(css, base), firstRule(css, hc)];
      expect(at, base).toBeGreaterThan(-1);
      expect(hcAt, `${hc} after ${base}`).toBeGreaterThan(at);
    }
  });

  test('Clear List’s text turns white under the pointer in High contrast, inside the forced-colours guard (FEAT5_5, agreed 2026-11-09)', () => {
    // Red #ff8a9e on the #262626 hover fill is only 6.76:1, so the text turns white on hover. The
    // hover class must come after the red text class (same weight), and only outside forced colours.
    const red = firstRule(css, 'hc:text-hc-rose');
    const hoverWhite = firstRule(css, 'hc:hover:text-ink');
    expect(red).toBeGreaterThan(-1);
    expect(hoverWhite).toBeGreaterThan(red);
    const guard = /@media not all and \(forced-colors:\s*active\)\s*\{/g;
    const outside = withoutBlocks(css, guard);
    expect(firstRule(outside, 'hc:text-hc-rose')).toBe(-1);
    expect(firstRule(outside, 'hc:hover:text-ink')).toBe(-1);
    expect(css).toMatch(
      /\.hc\\:hover\\:text-ink:where\(\[data-color-mode=high-contrast\][^{]*:hover[^{]*\{color:var\(--color-ink\)\}/,
    );
  });

  test('the High contrast colours, focus ring, blank-card outlines and white-on-black safety net are in the built CSS, outside Tailwind’s layers so they win (FEAT5_5)', () => {
    const unlayered = withoutBlocks(css, /@layer [\w-]+\s*\{/g);
    const tokens = /:root\[data-color-mode=(?:'high-contrast'|"high-contrast"|high-contrast)\]\{([^}]*)\}/.exec(
      unlayered,
    );
    expect(tokens).not.toBeNull();
    for (const [name, value] of Object.entries(MODE_COLORS['high-contrast'])) {
      expect(tokens![1], `--color-${name}`).toMatch(new RegExp(`--color-${name}:\\s*${short(value)}[;}]?`));
    }
    expect(tokens![1]).toMatch(/color-scheme:\s*dark/);
    // Focus: a 3px yellow outline 2px out; menu items keep theirs inside the row. Both only outside
    // a forced-colours mode, so the device's focus wins there (review R3).
    expect(unlayered).toContain(
      '@media not all and (forced-colors:active){:root[data-color-mode=high-contrast] :focus-visible{outline:3px solid var(--color-hc-focus);outline-offset:2px}:root[data-color-mode=high-contrast] [role=menuitemradio]:focus-visible{outline-offset:-3px}}',
    );
    // The fanned and sliding blank cards: a 2px white ring and no shadow (one box-shadow only).
    expect(unlayered).toContain(
      ':root[data-color-mode=high-contrast] :is(.deck-back,.card-flyer-blank){box-shadow:0 0 0 2px var(--color-card-back-line)}',
    );
    // White on black even if a token is left out.
    // (The minifier may write the two in either order.)
    const safetyNet = /:root\[data-color-mode=high-contrast\] body\{([^}]*)\}/.exec(unlayered);
    expect(safetyNet).not.toBeNull();
    expect(safetyNet![1].split(';').sort()).toEqual([
      expect.stringMatching(/^background:(?:#000000|#000)$/),
      expect.stringMatching(/^color:(?:#ffffff|#fff)$/),
    ]);
  });

  test('no element has two hc: classes in the same variant that set the same CSS property (FEAT5_5, review R2)', () => {
    // Two such classes would be decided by their order in the built CSS, not by the order they are
    // written in (e.g. a shared hc:text-ink beating Clear List's hc:text-hc-rose). Each element's
    // classes are read from its className (with the class constants it uses filled in), and what
    // each hc: class sets is read from the built CSS.
    const clashes = hcClassClashes(css);
    expect(clashes.checked).toBeGreaterThan(20);
    expect(clashes.found).toEqual([]);
  });

  test('the forced-colours (Windows high contrast) classes are all still there, unchanged, and generated (FEAT5_5)', () => {
    // The ones from FEAT2_6 and FEAT5 (and FEAT5_1's tiles). High contrast adds none and changes none.
    const forced = classesInSource(/(?<![\w-])forced-colors:[^\s'"`]+/g);
    const missing = forced.filter((cls) => !css.includes(escapedSelector(cls)));
    expect(missing).toEqual([]);
    expect(forced).toEqual(
      sorted([
        'forced-colors:bg-[color:Canvas]',
        'forced-colors:bg-[color:Canvas]!',
        'forced-colors:border-[color:ButtonText]',
        'forced-colors:border-[color:Highlight]',
        'forced-colors:border-2',
        'forced-colors:forced-color-adjust-none',
        'forced-colors:has-checked:[&>div]:bg-[color:Highlight]!',
        'forced-colors:has-checked:[&>div]:outline-[color:Highlight]',
        'forced-colors:has-checked:[&>div]:outline-3',
        'forced-colors:has-checked:[&>div]:outline-offset-2',
        'forced-colors:has-checked:[&>div]:outline-solid',
        'forced-colors:has-checked:[&>div]:text-[color:HighlightText]!',
        'forced-colors:has-checked:[&>div_*]:bg-[color:Highlight]!',
        'forced-colors:has-checked:[&>div_*]:text-[color:HighlightText]!',
        'forced-colors:has-checked:bg-[color:Highlight]',
        'forced-colors:has-checked:text-[color:HighlightText]',
        'forced-colors:has-disabled:text-[color:GrayText]',
        'forced-colors:has-focus-visible:outline-[color:CanvasText]',
        'forced-colors:has-focus-visible:outline-2',
        'forced-colors:has-focus-visible:outline-dashed',
        'forced-colors:has-focus-visible:outline-offset-[5px]',
        'forced-colors:text-[color:CanvasText]',
        'forced-colors:text-[color:Highlight]',
      ]),
    );
    // The blank card's border in forced colours (index.css) is still there too.
    expect(css).toMatch(/@media \(forced-colors:\s*active\)\s*\{\s*\.card-flyer-blank\{border:1px solid canvastext\}/i);
  });
});

const sorted = (list: string[]) => [...list].sort();

/** Every class in src/ matching `pattern` (with the g flag), sorted, each once. */
function classesInSource(pattern: RegExp): string[] {
  const found = new Set<string>();
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.tsx?$/.test(entry.name))
        for (const m of readFileSync(path, 'utf8').matchAll(pattern)) found.add(m[0]);
    }
  };
  walk(join(WEB, 'src'));
  return [...found].sort();
}

/** `css` with every block that `opener` (a g regex ending at the block's `{`) starts taken out, nested blocks and all. */
function withoutBlocks(css: string, opener: RegExp): string {
  let out = '';
  let from = 0;
  for (const m of css.matchAll(opener)) {
    if (m.index < from) continue;
    out += css.slice(from, m.index);
    let depth = 1;
    let i = m.index + m[0].length;
    for (; i < css.length && depth > 0; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') depth--;
    }
    from = i;
  }
  return out + css.slice(from);
}

/** Where the first rule for `cls` is in `css` (its selector, not a longer class that starts the same), or -1. */
function firstRule(css: string, cls: string): number {
  const selector = escapedSelector(cls).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.search(new RegExp(`${selector}(?![\\w\\\\-])`));
}

/** A regular expression for `value` as a minifier might write it (#aabbcc -> #abc, spaces in rgb()). */
function short(value: string): string {
  const hex = /^#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3$/i.exec(value);
  if (hex) return `(?:${value}|#${hex[1]}${hex[2]}${hex[3]})`;
  if (value.startsWith('rgb(')) return '(?:rgb|#)[^;}]*';
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Two hc: classes on one element may set the same property only when the browser combines them:
 * a shadow and a ring both write box-shadow from their own variables, and an outline width and
 * outline-dashed both write outline-style (the same dashed style).
 */
const HARMLESS_CLASHES: { property: string; classes: RegExp }[] = [
  { property: 'box-shadow', classes: /(?:^|:)(?:shadow-|ring-\d)/ },
  { property: 'outline-style', classes: /(?:^|:)outline-(?:\d|dashed)/ },
];

/** The CSS properties the rule for `cls` sets in the built `css` (empty if it isn't there). */
function propertiesOf(css: string, cls: string): string[] {
  const selector = escapedSelector(cls);
  let at = css.indexOf(`${selector}:where(`);
  if (at < 0) at = firstRule(css, cls);
  if (at < 0) return [];
  const open = css.indexOf('{', at);
  return css
    .slice(open + 1, css.indexOf('}', open))
    .split(';')
    .map((d) => d.slice(0, d.indexOf(':')).trim())
    .filter(Boolean);
}

/**
 * Every element's hc: classes, by className in src/ (`className="…"`, ``className={`…`}`` or
 * `className={NAME}`), with the class constants it uses (`${NAME}`) filled in, plus each class
 * constant on its own. Returns how many sets of classes were checked and every clash found.
 */
function hcClassClashes(css: string): { checked: number; found: string[] } {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.tsx?$/.test(entry.name)) files.push(path);
    }
  };
  walk(join(WEB, 'src'));
  const sources = files.map((file) => ({ file, text: readFileSync(file, 'utf8') }));
  const constants: Record<string, string> = {};
  for (const { text } of sources) {
    for (const m of text.matchAll(
      /const ([A-Za-z_][A-Za-z0-9_]*)\s*(?::[^=\n]+)?=\s*(\[[^\]]*?\]\.join\(' '\)|'[^'\n]*'|`[^`]*`)/g,
    )) {
      constants[m[1]] = m[2];
    }
  }
  const expand = (text: string, depth = 0): string =>
    depth > 4
      ? text
      : text.replace(/\$\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}/g, (_, name: string) =>
          constants[name] ? expand(constants[name], depth + 1) : ' ',
        );
  const groups: { where: string; text: string }[] = [];
  for (const { file, text } of sources) {
    const name = file.slice(file.lastIndexOf('src'));
    for (const m of text.matchAll(/className=(\{`[\s\S]*?`\}|"[^"]*"|\{([A-Za-z_][A-Za-z0-9_]*)\})/g)) {
      groups.push({ where: name, text: expand(m[2] ? (constants[m[2]] ?? '') : m[1]) });
    }
  }
  for (const [name, value] of Object.entries(constants)) groups.push({ where: name, text: expand(value) });

  let checked = 0;
  const found = new Set<string>();
  for (const { where, text } of groups) {
    const classes = [...new Set(text.match(/(?<![\w-])hc:[^\s'"`${}]+/g) ?? [])];
    if (!classes.length) continue;
    checked++;
    const byProperty: Record<string, string[]> = {};
    for (const cls of classes) {
      const variant = cls.slice(0, cls.lastIndexOf(':') + 1);
      for (const property of propertiesOf(css, cls)) (byProperty[`${variant} ${property}`] ??= []).push(cls);
    }
    for (const [key, list] of Object.entries(byProperty)) {
      if (list.length < 2) continue;
      const property = key.slice(key.indexOf(' ') + 1);
      const harmless = HARMLESS_CLASHES.some(
        (h) => h.property === property && list.every((cls) => h.classes.test(cls.slice(cls.lastIndexOf(':') + 1))),
      );
      if (!harmless) found.add(`${where}: ${list.join(' and ')} both set ${key}`);
    }
  }
  return { checked, found: [...found].sort() };
}
