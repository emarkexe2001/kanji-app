// ADJ2_5: fixes to the floating Shuffled-out panel. It never covers the deck controls (the wide
// layout starts at 1100px) or "Shuffled out (N)" (its top is measured from the header), the deck
// card is a slim card under the phone pop-up so the controls stay on screen, the pop-up doesn't
// grow, and a press dragged out of the panel doesn't swallow the next click outside it.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { WordEntry } from '@kanji/core';
import { WIDE_LAYOUT_MIN_WIDTH, WIDE_LAYOUT_QUERY } from '../../src/features/deck/utils/wide-layout';
import { currentWord, makeDecks, makeWords, renderApp, shuffleIn, type User } from './helpers';

const DECKS = makeDecks({ N5: 30, N4: 30 });

const shuffledOutButton = () => screen.getByRole('button', { name: /^Shuffled out \(\d+\)$/ });
const panel = () => screen.queryByRole('region', { name: 'Shuffled-out cards' });
const openPanel = () => panel()!;
const closeButton = () => screen.getByRole('button', { name: 'Close shuffled-out cards' });
const nextButton = () => screen.getByRole('button', { name: 'Next →' });
const title = () => screen.getByRole('heading', { level: 1, name: 'Kanji Reading Highlighter' });
const addBackGroup = () => within(screen.getByRole('group', { name: 'Add back' }));
const takeOutGroup = () => within(screen.getByRole('group', { name: /^Take out of your deck/ }));
const cardOf = (checkbox: HTMLElement) => checkbox.closest('label')!;
/** The card on screen in the deck, the only full card (an article). */
const deckCard = () => screen.getByRole('article');
/** The card stack around it (with the blank cards fanned out behind it, when there are any). */
const cardStack = () => deckCard().closest<HTMLElement>('[data-card-stack]')!;
/** The deck card's space, which is pushed down below the pop-up. */
const cardSpace = () => cardStack().parentElement!.parentElement!;
/** The panel's top, as set from the header (`--panel-top`). */
const panelTop = () => openPanel().style.getPropertyValue('--panel-top');
/** The page's header (not the header of a card). */
const pageHeader = () => document.querySelector<HTMLElement>('main > header')!;

// ---- A made-up screen, as jsdom has no layout or media queries ----

/** The screen's width. The media queries (the wide layout's min-width) answer from it. */
let screenWidth = 360;
/** The media query change listeners, called when the width changes. */
const mediaListeners = new Set<() => void>();
/** Where the bottom of the page's header is (80px: the title on two lines on a 360px phone). */
let headerBottom = 80;
/** Where the deck card's space starts. */
const CARD_SPACE_TOP = 200;

function stubScreen(width: number) {
  screenWidth = width;
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => {
      const min = /\(min-width:\s*(\d+)px\)/.exec(query);
      return {
        get matches() {
          return min ? screenWidth >= Number(min[1]) : false;
        },
        media: query,
        addEventListener: (_: string, listener: () => void) => mediaListeners.add(listener),
        removeEventListener: (_: string, listener: () => void) => mediaListeners.delete(listener),
      };
    }),
  );
}

/** Resizes the window to `width`, with the header's bottom now at `bottom`. */
function resizeTo(width: number, bottom = headerBottom) {
  act(() => {
    screenWidth = width;
    headerBottom = bottom;
    mediaListeners.forEach((l) => l());
    window.dispatchEvent(new Event('resize'));
  });
}

/** A stand-in for ResizeObserver (jsdom has none): `resized(el)` tells whoever watches `el`. */
class FakeResizeObserver {
  static all = new Set<FakeResizeObserver>();
  targets = new Set<Element>();
  constructor(private callback: ResizeObserverCallback) {
    FakeResizeObserver.all.add(this);
  }
  observe(el: Element) {
    this.targets.add(el);
  }
  unobserve(el: Element) {
    this.targets.delete(el);
  }
  disconnect() {
    this.targets.clear();
    FakeResizeObserver.all.delete(this);
  }
  static resized(el: Element) {
    act(() => {
      for (const o of [...FakeResizeObserver.all]) {
        if (o.targets.has(el)) o.callback([], o as unknown as ResizeObserver);
      }
    });
  }
}

/**
 * The panel's height where it is laid out: below the wide layout its class fixes it at 260px
 * (h-[min(260px,...)]), so that is what it is; in the wide layout it is as tall as its lists (100px
 * plus 60px per card), the way the browser lays it out. It sits at its `--panel-top`.
 */
function panelHeight(el: HTMLElement) {
  const fixed = el.className.split(/\s+/).some((c) => c.startsWith('h-[min(260px'));
  return fixed && screenWidth < WIDE_LAYOUT_MIN_WIDTH ? 260 : 100 + 60 * el.querySelectorAll('li').length;
}

function fakeLayout() {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const isPageHeader = this.tagName === 'HEADER' && this.parentElement?.tagName === 'MAIN';
    const [top, bottom] = isPageHeader ? [24, headerBottom] : [CARD_SPACE_TOP, CARD_SPACE_TOP + 400];
    return { top, bottom, left: 0, right: 300, width: 300, height: bottom - top, x: 0, y: top, toJSON: () => ({}) };
  });
  vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
    return this.id === 'shuffled-out-panel' ? parseFloat(this.style.getPropertyValue('--panel-top')) || 0 : 0;
  });
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
    return this.id === 'shuffled-out-panel' ? panelHeight(this) : 0;
  });
}

/** How far down the deck card's space is pushed for a pop-up at `top` that is 260px tall. */
const belowPopUp = (top: number) => `${top + 260 + 12 - CARD_SPACE_TOP}px`;

beforeEach(() => {
  headerBottom = 80;
  mediaListeners.clear();
  FakeResizeObserver.all.clear();
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  fakeLayout();
});

afterEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
});

/** Shuffles in one card, then moves on, and returns the word that was shuffled out. */
async function shuffleOutOne(user: User) {
  const word = currentWord();
  await shuffleIn(user, '1');
  await user.click(nextButton());
  return word;
}

/** Renders the app at `width` with `count` cards shuffled out, and returns them, newest first. */
async function appAt(width: number, count = 1, words: WordEntry[] = DECKS) {
  stubScreen(width);
  const user = await renderApp(words);
  const out: (string | null)[] = [];
  for (let i = 0; i < count; i++) out.unshift(await shuffleOutOne(user));
  return { user, out };
}

describe('One wide-layout breakpoint (ADJ2_5, requirements 1 and 6)', () => {
  test('the wide layout starts at 1100px, the same width in the code and in the styles', () => {
    const styles = /--breakpoint-wide:\s*(\d+)px/.exec(
      readFileSync(resolve(__dirname, '../../src/app/index.css'), 'utf8'),
    );
    expect(styles).not.toBeNull();
    expect(Number(styles![1])).toBe(WIDE_LAYOUT_MIN_WIDTH);
    expect(WIDE_LAYOUT_MIN_WIDTH).toBe(1100);
    expect(WIDE_LAYOUT_QUERY).toBe('(min-width: 1100px)');
  });

  test('the panel, its cards and the deck use the wide breakpoint, not the old lg one', async () => {
    const { user, out } = await appAt(360);
    await user.click(shuffledOutButton());
    await user.click(cardOf(addBackGroup().getByRole('checkbox', { name: out[0]! })));
    // The styles' breakpoints can only be seen in the classes: nothing on the page uses lg: now,
    // and the panel and its cards switch with wide:.
    const classes = [...document.querySelectorAll<HTMLElement>('[class]')].flatMap((el) => [...el.classList]);
    expect(classes.filter((c) => /^(max-)?lg:/.test(c))).toEqual([]);
    expect(classes).toEqual(expect.arrayContaining(['wide:w-[300px]', 'wide:right-6', 'wide:text-base']));
  });

  test.each([1024, 1064, 1099])(
    'at %ipx the panel pops up over the page and the deck card moves below it, so it covers no deck control or the deck card',
    async (width) => {
      const { user } = await appAt(width);
      await user.click(shuffledOutButton());

      // The deck card's space starts 12px below the pop-up, and Back, Next, Deck Shuffle and
      // Shuffle In Cards all come after it on the page, so they are below the pop-up too.
      expect(cardSpace().style.paddingTop).toBe(belowPopUp(92));
      expect(cardSpace()).toHaveClass('items-start');
      for (const name of ['Back', 'Next →', 'Deck Shuffle', 'Shuffle In Cards']) {
        const control = screen.getByRole('button', { name });
        expect(cardSpace().compareDocumentPosition(control) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(openPanel()).not.toContainElement(control);
      }
      // It is the slim card, the same as on a phone.
      expect(within(deckCard()).queryByText('READING BREAKDOWN')).not.toBeInTheDocument();
    },
  );

  test.each([1100, 1280])('at %ipx the panel floats beside the deck, which stays as it is', async (width) => {
    const { user } = await appAt(width);
    const before = cardSpace().className;
    await user.click(shuffledOutButton());

    expect(openPanel()).toBeInTheDocument();
    expect(cardSpace().style.paddingTop).toBe('');
    expect(cardSpace().className).toBe(before);
    expect(within(deckCard()).getByText('READING BREAKDOWN')).toBeInTheDocument();
    expect(cardStack().querySelectorAll('.deck-back')).toHaveLength(2);
  });
});

describe('The panel sits below the header, measured from it (ADJ2_5, requirement 2)', () => {
  test('the panel opens just below the bottom of the header, not at a fixed height', async () => {
    const { user } = await appAt(360);
    await user.click(shuffledOutButton());

    // 12px below the header's bottom edge (80px down on a 360px phone, where the title wraps).
    expect(panelTop()).toBe('92px');
    expect(openPanel()).toHaveClass('top-(--panel-top)');
    expect(openPanel().className).not.toMatch(/(^|\s)(\w+:)?top-\[/);
  });

  test('it is measured as if the page were scrolled to the top, where the panel opens', async () => {
    const { user } = await appAt(360);
    // Scrolled 40px down, the header's bottom is 40px up the screen.
    Object.defineProperty(window, 'scrollY', { value: 40, configurable: true });
    headerBottom = 40;
    await user.click(shuffledOutButton());
    expect(panelTop()).toBe('92px');
  });

  test('when the header gets taller (e.g. the title on three lines, larger text or zoom), the panel moves down with it and does not cover "Shuffled out (N)", and the deck card moves down too', async () => {
    const { user } = await appAt(360);
    await user.click(shuffledOutButton());
    expect(panelTop()).toBe('92px');

    // The title wraps onto three lines: the header now ends 136px down.
    headerBottom = 136;
    FakeResizeObserver.resized(pageHeader());

    expect(panelTop()).toBe('148px');
    // "Shuffled out (N)" is in the header, so it ends above the header's bottom, above the panel.
    expect(pageHeader()).toContainElement(shuffledOutButton());
    expect(cardSpace().style.paddingTop).toBe(belowPopUp(148));
  });

  test('when I resize the window with the panel open, it stays below the header and the deck adjusts', async () => {
    const { user } = await appAt(360);
    await user.click(shuffledOutButton());
    expect(cardSpace().style.paddingTop).toBe(belowPopUp(92));

    // Wider: the title fits on one line, so the header ends at 60px.
    resizeTo(640, 60);
    expect(panelTop()).toBe('72px');
    expect(cardSpace().style.paddingTop).toBe(belowPopUp(72));

    // Wide: the panel floats beside the deck, which goes back to normal.
    resizeTo(1200);
    expect(panelTop()).toBe('72px');
    expect(cardSpace().style.paddingTop).toBe('');
    expect(within(deckCard()).getByText('READING BREAKDOWN')).toBeInTheDocument();

    // Narrower again: the pop-up, with the deck card below it.
    resizeTo(800);
    expect(cardSpace().style.paddingTop).toBe(belowPopUp(72));
    expect(within(deckCard()).queryByText('READING BREAKDOWN')).not.toBeInTheDocument();
  });

  test('a closed panel stops following the header, and picks it up again when it opens', async () => {
    const { user } = await appAt(360);
    await user.click(shuffledOutButton());
    await user.click(closeButton());
    expect([...FakeResizeObserver.all].some((o) => o.targets.has(pageHeader()))).toBe(false);

    headerBottom = 100;
    resizeTo(360, 100);
    await user.click(shuffledOutButton());
    expect(panelTop()).toBe('112px');
  });
});

describe('The deck under the phone pop-up (ADJ2_5, requirements 3 and 4)', () => {
  test('while the panel is open on a phone, the deck card is the slim card: its header, word, reading and one-line meaning, at its normal size', async () => {
    // Common words, so the card has a ★ Common Word badge.
    const { user } = await appAt(360, 0, makeWords(30));
    const meaning = () => within(deckCard()).getByText(/^word number \d+$/);
    const badge = () => within(deckCard()).getByText('★ Common Word');
    const label = () => within(deckCard()).getByRole('heading', { name: 'Full Word Meaning' });
    expect(within(deckCard()).getByText('READING BREAKDOWN')).toBeInTheDocument();
    expect(badge()).not.toHaveClass('sr-only');
    expect(label()).not.toHaveClass('sr-only');
    expect(cardStack().querySelectorAll('.deck-back')).toHaveLength(2);
    expect(cardStack()).toHaveClass('pb-8');

    await user.click(shuffledOutButton());

    // Still there: its header, word, reading and meaning.
    expect(within(deckCard()).getByText('Vocabulary')).toBeVisible();
    expect(within(deckCard()).getByRole('heading', { level: 2 })).toHaveTextContent(currentWord()!);
    expect(meaning()).toBeVisible();
    // No Reading Breakdown.
    expect(within(deckCard()).queryByText('READING BREAKDOWN')).not.toBeInTheDocument();
    // jsdom has no layout, so the classes are checked: the badge and the "Full Word Meaning"
    // label are hidden from view (sr-only: screen readers still hear them), the meaning is kept to
    // one line (line-clamp-1), and there are no blank cards fanned out behind it or room for them.
    expect(badge()).toHaveClass('sr-only');
    expect(label()).toHaveClass('sr-only');
    expect(meaning()).toHaveClass('line-clamp-1');
    expect(cardStack().querySelectorAll('.deck-back')).toHaveLength(0);
    expect(cardStack()).not.toHaveClass('pb-8');

    // It goes back to the full card when the panel closes.
    await user.click(closeButton());
    expect(within(deckCard()).getByText('READING BREAKDOWN')).toBeInTheDocument();
    expect(badge()).not.toHaveClass('sr-only');
    expect(label()).not.toHaveClass('sr-only');
    expect(meaning()).not.toHaveClass('line-clamp-1');
    expect(cardStack().querySelectorAll('.deck-back')).toHaveLength(2);
  });

  test('a long meaning on the slim card is drawn on one line, but all of it is still there for screen readers', async () => {
    const long = 'to take, to pick up; to pass, to hand; to hold, to have; to keep, to guard; to remove, to get rid of';
    const words = makeWords(30).map((w) => ({ ...w, meaning: `${long} (${w.word})` }));
    const { user } = await appAt(360, 0, words);
    await user.click(shuffledOutButton());

    const meaning = within(deckCard()).getByText((text) => text.startsWith(long));
    expect(meaning).toHaveTextContent(`${long} (${currentWord()!.replace(/【.*$/, '')})`);
    // Cut on screen only (line-clamp-1 draws "…"; jsdom can't show it), never in the text.
    expect(meaning).toHaveClass('line-clamp-1');
    expect(meaning).not.toHaveAttribute('aria-hidden');
  });

  test('when I pick a card to add back on a phone, the panel does not grow and the deck card does not move', async () => {
    const { user, out } = await appAt(360, 2);
    await user.click(shuffledOutButton());
    const before = cardSpace().style.paddingTop;
    expect(before).toBe(belowPopUp(92));

    await user.click(cardOf(addBackGroup().getByRole('checkbox', { name: out[0]! })));
    // The Take out list appears inside the panel. If the browser told us the panel changed size,
    // the deck card would be measured again; it is fixed at 260px, so the card stays where it is.
    expect(takeOutGroup().getAllByRole('checkbox').length).toBeGreaterThan(0);
    FakeResizeObserver.resized(openPanel());
    expect(cardSpace().style.paddingTop).toBe(before);
    await user.click(cardOf(takeOutGroup().getByRole('checkbox', { name: /^Card 1: / })));
    FakeResizeObserver.resized(openPanel());
    expect(cardSpace().style.paddingTop).toBe(before);
  });

  test('on a screen too short for it (e.g. a phone on its side), the 260px pop-up stops 8px above the bottom of the screen', async () => {
    const { user } = await appAt(640);
    await user.click(shuffledOutButton());
    // jsdom has no layout, so the class is checked; it is checked at 640x360 in a real browser too.
    expect(openPanel()).toHaveClass('h-[min(260px,calc(100dvh-var(--panel-top)-8px))]');
  });
});

describe('A press dragged out of the panel (ADJ2_5, requirement 5)', () => {
  test('when I press inside the panel, drag outside and let go, the panel stays open, and the next click outside still closes it', async () => {
    const { user } = await appAt(360);
    await user.click(shuffledOutButton());
    const inside = within(openPanel()).getByRole('heading', { name: 'Shuffled-out cards' });

    await user.pointer([{ keys: '[MouseLeft>]', target: inside }, { target: title() }, { keys: '[/MouseLeft]' }]);
    expect(openPanel()).toBeInTheDocument();

    await user.click(title());
    expect(panel()).not.toBeInTheDocument();
  });

  test('when a press inside the panel ends outside it without a click, the next click outside (e.g. Enter on Next) still closes it', async () => {
    const { user } = await appAt(360);
    await user.click(shuffledOutButton());
    const inside = within(openPanel()).getByRole('heading', { name: 'Shuffled-out cards' });
    const before = currentWord();

    // Pressed inside and let go outside, with no click (e.g. the browser started a drag).
    fireEvent.pointerDown(inside);
    fireEvent.pointerUp(title());
    // Then Next is used from the keyboard: a click that isn't the end of a press.
    nextButton().focus();
    await user.keyboard('{Enter}');

    expect(panel()).not.toBeInTheDocument();
    expect(currentWord()).not.toBe(before);
  });

  test.each(['pointerCancel', 'dragStart'] as const)(
    'when a press inside the panel is ended by the browser (%s), the next click outside still closes it',
    async (ending) => {
      const { user } = await appAt(360);
      await user.click(shuffledOutButton());
      const inside = within(openPanel()).getByRole('heading', { name: 'Shuffled-out cards' });

      fireEvent.pointerDown(inside);
      fireEvent[ending](inside);
      // A click outside, from a press (detail 1) whose own pointerdown the browser didn't send.
      fireEvent.click(title(), { detail: 1 });

      expect(panel()).not.toBeInTheDocument();
    },
  );
});

describe('Checks on the compact cards and the panel footer (ADJ2_5, from the ADJ2 review)', () => {
  test('the pinned footer of the panel has a sky-200 top border', async () => {
    const { user } = await appAt(360);
    await user.click(shuffledOutButton());
    // jsdom has no borders or colours, so the classes are checked.
    const footer = screen.getByRole('button', { name: 'Add Back Cards' }).parentElement!.parentElement!;
    expect(openPanel()).toContainElement(footer);
    expect(footer).toHaveClass('border-t', 'border-sky-200', 'shrink-0');
  });

  test('a compact card that is new keeps the 11px "New" ribbon text', async () => {
    const { user, out } = await appAt(360);
    // A card shuffled in and still on screen is new, so it shows "New" in the Take out list.
    await shuffleIn(user, '1');
    await user.click(shuffledOutButton());
    await user.click(cardOf(addBackGroup().getByRole('checkbox', { name: out[0]! })));

    const ribbons = takeOutGroup().getAllByText('New');
    expect(ribbons.length).toBeGreaterThan(0);
    // jsdom has no font sizes, so the class is checked: 11px, the same as on the deck card.
    for (const ribbon of ribbons) expect(ribbon).toHaveClass('text-[11px]');
    expect(within(deckCard()).getByText('New')).toHaveClass('text-[11px]');
  });
});
