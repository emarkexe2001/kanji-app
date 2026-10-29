// ADJ3 (agreed 2026-10-29): Next's card slides in from the right, the mirror of Back (FEAT6).
import { readFileSync } from 'node:fs';
import { screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { counter, renderApp } from './helpers';

/** Turns the device's "reduce motion" setting on or off (jsdom has no media queries). */
function setReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduce && query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

/** The card on screen's wrapper, which carries the class that draws its slide. */
const arrivingCard = () => screen.getByRole('article').parentElement;

// jsdom doesn't load or run CSS, so the slide itself is checked in the stylesheet, as text.
// (The UI tests run from apps/web.)
const css = readFileSync('src/app/index.css', 'utf8');
/** The body of the first `{ ... }` block after `start` (nested blocks included), with spaces squeezed. */
function block(start: string) {
  const at = css.indexOf(start);
  expect(at).toBeGreaterThanOrEqual(0);
  let depth = 0;
  for (let i = css.indexOf('{', at); i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}' && --depth === 0) {
      return css
        .slice(css.indexOf('{', at) + 1, i)
        .replace(/\s+/g, ' ')
        .trim();
    }
  }
  throw new Error(`${start} is not closed`);
}

describe('Next: the card slides in from the right', () => {
  test('pressing Next gives the card the Next slide', async () => {
    setReducedMotion(false);
    const user = await renderApp();

    await user.click(screen.getByRole('button', { name: 'Next →' }));

    // Animations can't run in jsdom, so this checks the class that draws the slide.
    expect(counter().position).toBe(2);
    expect(arrivingCard()).toHaveClass('deal-next');
  });

  test('pressing the → key gives the card the same slide', async () => {
    setReducedMotion(false);
    const user = await renderApp();

    await user.keyboard('{ArrowRight}');

    expect(counter().position).toBe(2);
    expect(arrivingCard()).toHaveClass('deal-next');
  });

  test('with "reduce motion" on, Next has no slide', async () => {
    setReducedMotion(true);
    const user = await renderApp();

    await user.click(screen.getByRole('button', { name: 'Next →' }));
    await user.keyboard('{ArrowRight}');

    expect(counter().position).toBe(3);
    expect(arrivingCard()).not.toHaveClass('deal-next');
  });

  test('the Next slide comes in from the right: from 40px right, at 95.5% size and 40% opacity', () => {
    expect(block('@keyframes deal-next')).toBe(
      'from { opacity: 0.4; transform: translateX(40px) scale(0.955); } to { opacity: 1; transform: none; }',
    );
  });

  test('it is the exact mirror of Back: the same keyframes from the other side, the same 260ms and easing', () => {
    expect(block('@keyframes deal-next')).toBe(
      block('@keyframes deal-back').replace('translateX(-40px)', 'translateX(40px)'),
    );
    expect(block('.deal-next {')).toBe('animation: deal-next 260ms cubic-bezier(0.22, 1, 0.36, 1);');
    expect(block('.deal-next {')).toBe(block('.deal-back {').replace('deal-back', 'deal-next'));
  });

  test('"reduce motion" still turns the Next slide off', () => {
    const reduce = block('@media (prefers-reduced-motion: reduce)');
    expect(reduce).toMatch(/\.deal-next,[^{]*\{ animation: none; \}/);
  });
});
