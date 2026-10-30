import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

/**
 * Helpers for the colour mode checks (FEAT5). jsdom draws no colours, so the colours themselves
 * are checked here: the tokens in @kanji/core against Tailwind's own colours (Light must look as
 * it always has) and against index.css, and the contrast between them.
 */

const require = createRequire(resolve(__dirname, 'mode-colors.ts'));

/** Tailwind's own colour variables, e.g. `slate-700` -> `oklch(37.2% 0.044 257.287)`. */
const TAILWIND_THEME = readFileSync(require.resolve('tailwindcss/theme.css'), 'utf8');

/** One of Tailwind's own colours, written the way Tailwind writes it (e.g. "slate-700"). */
export function tailwindColor(name: string): string {
  const found = new RegExp(`--color-${name}:\\s*([^;]+);`).exec(TAILWIND_THEME);
  if (!found) throw new Error(`No Tailwind colour "${name}"`);
  return found[1].trim();
}

/** The app's stylesheet, src/app/index.css. */
export const INDEX_CSS = readFileSync(resolve(__dirname, '../../src/app/index.css'), 'utf8');

/** The `--color-*` variables set in a block of CSS, by name (without `--color-`). */
export function colorVariables(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

/** The text of the first `{ ... }` block after `selector` in `css` (no nested blocks). */
export function blockAfter(css: string, selector: string): string {
  const at = css.indexOf(selector);
  if (at < 0) throw new Error(`No "${selector}" in the CSS`);
  const open = css.indexOf('{', at);
  return css.slice(open + 1, css.indexOf('}', open));
}

type Rgb = [number, number, number];

/** sRGB (0-255) from a #hex, rgb() or oklch() colour, as CSS would draw it (clamped to sRGB). */
export function toRgb(color: string): Rgb {
  const c = color.trim().toLowerCase();
  if (c === '#fff' || c === 'white') return [255, 255, 255];
  const hex = /^#([0-9a-f]{6})$/.exec(c);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  }
  const rgb = /^rgb\((\d+) (\d+) (\d+)/.exec(c);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  const ok = /^oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\)$/.exec(c);
  if (ok) {
    const [l, chroma, hue] = [Number(ok[1]) / 100, Number(ok[2]), (Number(ok[3]) * Math.PI) / 180];
    const [a, b] = [chroma * Math.cos(hue), chroma * Math.sin(hue)];
    const l3 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m3 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s3 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const linear = [
      4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
      -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
      -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
    ];
    return linear.map((x) => {
      const v = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
      return Math.round(Math.min(1, Math.max(0, v)) * 255);
    }) as Rgb;
  }
  throw new Error(`Can't read the colour "${color}"`);
}

const luminance = ([r, g, b]: Rgb) => {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
};

/** The WCAG contrast ratio between two colours, e.g. 4.5 for 4.5:1. */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(toRgb(a)), luminance(toRgb(b))];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
