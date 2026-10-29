// ADJ3: cards slide between the deck and the shuffled-out list (the "Shuffled out (N)" button or the panel).
import { StrictMode, type ComponentProps } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import App from '../../src/app/app';
import type { CardStack as RealCardStack } from '../../src/features/deck/components/card-stack';
import {
  COUNTER,
  counter,
  currentWord,
  deckContents,
  enterCardLimit,
  makeDecks,
  renderApp,
  serveDeck,
  shuffleIn,
  type User,
} from './helpers';

/** Set to make the deck card fail to draw, to crash the deck while cards are sliding. */
const crash = vi.hoisted(() => ({ deckCard: false }));

vi.mock('../../src/features/deck/components/card-stack', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/features/deck/components/card-stack')>();
  return {
    ...real,
    CardStack: (props: ComponentProps<typeof RealCardStack>) => {
      if (crash.deckCard) throw new TypeError('The card could not be drawn');
      return <real.CardStack {...props} />;
    },
  };
});

const DECKS = makeDecks({ N5: 30, N4: 30 });

const shuffledOutButton = () => screen.getByRole('button', { name: /^Shuffled out \(\d+\)$/ });
const shownCount = () => Number(/\((\d+)\)/.exec(shuffledOutButton().textContent ?? '')![1]);
const panel = () => screen.queryByRole('region', { name: 'Shuffled-out cards' });
const addBackButton = () => screen.getByRole('button', { name: 'Add Back Cards' });
const addBackGroup = () => within(screen.getByRole('group', { name: 'Add back' }));
const takeOutGroup = () => within(screen.getByRole('group', { name: /^Take out of your deck/ }));
const cardOf = (checkbox: HTMLElement) => checkbox.closest('label')!;
const nextButton = () => screen.getByRole('button', { name: 'Next →' });
const onScreenIsNew = () => within(screen.getByRole('article')).queryByText('New') !== null;
const savedRemoved = () => (JSON.parse(localStorage.getItem('kanji.removedCards') ?? '[]') as unknown[]).length;

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

// ---- A stand-in for the Web Animations API, which jsdom doesn't have ----
// The slides are drawn with element.animate(). jsdom can't run (or even show) them, so the tests
// give it a fake animate() that records each slide and lets the test say when each one finishes.

interface FakeAnimation {
  el: HTMLElement;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  onfinish: (() => void) | null;
  cancelled: boolean;
  finish: () => void;
  cancel: () => void;
}
let animations: FakeAnimation[] = [];

function fakeAnimate() {
  animations = [];
  function animate(this: HTMLElement, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    const a: FakeAnimation = {
      el: this,
      keyframes,
      options,
      onfinish: null,
      cancelled: false,
      finish: () => a.onfinish?.(),
      cancel: () => (a.cancelled = true),
    };
    animations.push(a);
    return a;
  }
  Object.defineProperty(Element.prototype, 'animate', { value: animate, configurable: true, writable: true });
}

/** The slides still running, oldest first. */
const sliding = () => animations.filter((a) => !a.cancelled && a.el.isConnected);

/** Finishes the oldest slide still running, `times` times: the cards land one by one. */
function landNext(times = 1) {
  for (let i = 0; i < times; i++) act(() => sliding()[0].finish());
}

/** The cards drawn sliding, in the order they started. */
const flyers = () => [...document.querySelectorAll<HTMLElement>('[data-card-flights] .card-flyer')];
/** The word on a sliding card, or null for a blank card back. */
const flyerWord = (el: HTMLElement) => el.querySelector('h2')?.textContent ?? null;
const slideOf = (el: HTMLElement) => sliding().find((a) => a.el === el)!;

// ---- A made-up layout, as jsdom has none ----
const STACK = { x: 20, y: 200, w: 384, h: 432 }; // the card stack: the front card is 400px tall, with 32px below it
const FRONT = { x: 20, y: 200, w: 384, h: 400 };
const BUTTON = { x: 260, y: 16, w: 120, h: 36 };
const PANEL_BODY = { x: 600, y: 100, w: 280, h: 300 };
/** The compact cards in the panel's lists: two per row. */
const pickCardBox = (i: number) => ({ x: 610 + (i % 2) * 135, y: 110 + Math.floor(i / 2) * 170, w: 125, h: 160 });
/** How tall a sliding card is when laid out (the same as the front card). */
const FLYER_HEIGHT = 400;

function fakeLayout() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    let r = { x: 0, y: 0, w: 0, h: 0 };
    if (this.matches('[data-card-stack]')) r = STACK;
    else if (this.matches('[aria-controls="shuffled-out-panel"]')) r = BUTTON;
    else if (this.matches('[data-flight-clip]')) r = PANEL_BODY;
    else if (this.matches('[data-flight-source]')) {
      const li = this.closest('li')!;
      r = pickCardBox([...li.parentElement!.children].indexOf(li));
    }
    return {
      x: r.x,
      y: r.y,
      left: r.x,
      top: r.y,
      width: r.w,
      height: r.h,
      right: r.x + r.w,
      bottom: r.y + r.h,
    } as DOMRect;
  });
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
    return this.matches('[data-card-stack]') ? STACK.w : 0;
  });
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
    return this.matches('.card-flyer') ? FLYER_HEIGHT : 0;
  });
}

/** Where a sliding card is drawn by a keyframe's transform: "translate(x, y) scale(sx, sy)" of its laid-out size. */
function boxOf(el: HTMLElement, keyframe: Keyframe) {
  const [x, y, sx, sy] = String(keyframe.transform)
    .match(/-?[\d.]+(?:e-?\d+)?/g)!
    .map(Number);
  const width = parseFloat(el.style.width);
  const height = parseFloat(el.style.height) || FLYER_HEIGHT;
  return { x, y, w: sx * width, h: sy * height };
}
const startBox = (el: HTMLElement) => boxOf(el, slideOf(el).keyframes[0]);
const endBox = (el: HTMLElement) => boxOf(el, slideOf(el).keyframes.at(-1)!);
const endOpacity = (el: HTMLElement) => slideOf(el).keyframes.at(-1)!.opacity;
const centreOf = (b: { x: number; y: number; w: number; h: number }) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

function expectBox(actual: { x: number; y: number; w: number; h: number }, expected: typeof actual) {
  for (const k of ['x', 'y', 'w', 'h'] as const) expect(actual[k]).toBeCloseTo(expected[k], 5);
}

/** Shuffles in one card, then moves on, and returns the word that was shuffled out. */
async function shuffleOutOne(user: User) {
  const word = currentWord();
  await shuffleIn(user, '1');
  await user.click(nextButton());
  return word;
}

/** Renders the app with `count` cards shuffled out (before any slides are watched), newest first. */
async function appWithShuffledOut(count: number) {
  const user = await renderApp(DECKS);
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.unshift((await shuffleOutOne(user))!);
  return { user, out };
}

/**
 * Opens the panel and picks `words` to add back, and as many deck cards to take out: `takeOut`, by
 * their numbers in the list (Card 1, 2, ... by default).
 */
async function pickToAddBack(user: User, words: string[], takeOut = words.map((_, i) => i + 1)) {
  await user.click(shuffledOutButton());
  for (const w of words) await user.click(cardOf(addBackGroup().getByRole('checkbox', { name: w })));
  for (const i of takeOut) {
    await user.click(cardOf(takeOutGroup().getByRole('checkbox', { name: new RegExp(`^Card ${i}: `) })));
  }
}

/** The words in the shuffled-out list, by opening the panel (and closing it again). */
async function listedWords(user: User) {
  await user.click(shuffledOutButton());
  const words = addBackGroup()
    .getAllByRole('checkbox')
    .map((c) => c.getAttribute('aria-label'));
  await user.click(screen.getByRole('button', { name: 'Close shuffled-out cards' }));
  return words;
}

beforeEach(() => {
  setReducedMotion(false);
  fakeLayout();
});

afterEach(() => {
  delete (Element.prototype as { animate?: unknown }).animate;
  crash.deckCard = false;
});

describe('Shuffle In Cards: the card shuffled out slides into the "Shuffled out (N)" button', () => {
  test('it shrinks and slides up into the button, fading as it arrives, while the new card drops on', async () => {
    const user = await renderApp(DECKS);
    const before = currentWord();
    fakeAnimate();

    await shuffleIn(user, '1');

    const [flyer] = flyers();
    expect(flyers()).toHaveLength(1);
    expect(flyerWord(flyer)).toBe(before);
    // It starts where the card was and lands on the middle of the button, at 18% of its size.
    expectBox(startBox(flyer), FRONT);
    expect(centreOf(endBox(flyer))).toEqual(centreOf(BUTTON));
    expect(endBox(flyer).w).toBeCloseTo(FRONT.w * 0.18, 5);
    expect(endBox(flyer).h).toBeCloseTo(FRONT.h * 0.18, 5);
    expect(endOpacity(flyer)).toBe(0.2);
    // The new card still drops on (FEAT2_5). The animation is only visible as a class in jsdom.
    expect(currentWord()).not.toBe(before);
    expect(screen.getByRole('article').parentElement).toHaveClass('drop-in');
    // It no longer slides down and away.
    expect(document.querySelector('.slide-out')).toBeNull();

    landNext();
    expect(flyers()).toHaveLength(0);
  });

  test('each slide takes 400ms, and several cards start 90ms apart', async () => {
    const user = await renderApp(DECKS);
    fakeAnimate();

    await shuffleIn(user, '3');

    // How long a slide takes can't be seen in jsdom; the options it was started with are checked.
    expect(sliding().map((a) => a.options.duration)).toEqual([400, 400, 400]);
    expect(sliding().map((a) => a.options.delay)).toEqual([0, 90, 180]);
  });

  test('when it takes more than one card, the others peel off the back of the deck as blank cards into the button', async () => {
    const user = await renderApp(DECKS);
    const before = currentWord();
    fakeAnimate();

    await shuffleIn(user, '3');

    const [onScreen, ...hidden] = flyers();
    expect(flyerWord(onScreen)).toBe(before);
    expect(hidden).toHaveLength(2);
    for (const blank of hidden) {
      expect(flyerWord(blank)).toBeNull(); // a blank card back: nothing on it
      expect(blank).toHaveClass('card-flyer-blank');
      // From just inside the back of the deck to the middle of the button, shrinking and fading.
      expectBox(startBox(blank), { x: STACK.x + 8, y: STACK.y + 20, w: STACK.w - 16, h: STACK.h - 40 });
      expect(centreOf(endBox(blank))).toEqual(centreOf(BUTTON));
      expect(endBox(blank).w).toBeCloseTo((STACK.w - 16) * 0.18, 5);
      expect(endOpacity(blank)).toBe(0.2);
    }
  });

  test('the count changes as each card lands, one step at a time, with a bump on the button', async () => {
    const user = await renderApp(DECKS);
    fakeAnimate();

    await shuffleIn(user, '3');

    // The count waits for the cards to land.
    expect(shownCount()).toBe(0);
    // The bump can't be seen in jsdom; its class is checked.
    expect(shuffledOutButton()).not.toHaveClass('count-bump');
    landNext();
    expect(shownCount()).toBe(1);
    expect(shuffledOutButton()).toHaveClass('count-bump');
    landNext();
    expect(shownCount()).toBe(2);
    expect(shuffledOutButton()).toHaveClass('count-bump-again');
    landNext();
    expect(shownCount()).toBe(3);
    expect(shuffledOutButton()).toHaveClass('count-bump');
    expect(flyers()).toHaveLength(0);
  });

  test('the deck, the list and what is saved change straight away; only the count shown waits', async () => {
    const user = await renderApp(DECKS);
    const before = currentWord();
    fakeAnimate();

    await shuffleIn(user, '3');

    expect(shownCount()).toBe(0);
    expect(savedRemoved()).toBe(3);
    expect(currentWord()).not.toBe(before);
    expect((await deckContents(user)).map((c) => c.word)).not.toContain(before);
    expect(shownCount()).toBe(3); // pressing Next (to look through the deck) landed the cards
    expect(await listedWords(user)).toHaveLength(3);
  });

  test('screen readers hear the same summary as before, straight away, and nothing from the sliding cards', async () => {
    const user = await renderApp(DECKS);
    fakeAnimate();

    await shuffleIn(user, '1');

    expect(screen.getByRole('status')).toHaveTextContent(/^Shuffled out card 1 of \d+$/);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.queryByRole('alert')).toBeNull();
    // The sliding card isn't announced or read: it isn't in the accessibility tree at all.
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
  });

  test('the cards end up in the shuffled-out list, the same as before', async () => {
    const user = await renderApp(DECKS);
    const out: (string | null)[] = [];
    fakeAnimate();
    for (let i = 0; i < 2; i++) {
      out.unshift(currentWord());
      await shuffleIn(user, '1');
      landNext();
      await user.click(nextButton());
    }

    expect(await listedWords(user)).toEqual(out.map((w) => expect.stringContaining(w!)));
    const deck = (await deckContents(user)).map((c) => c.word);
    for (const w of out) expect(deck).not.toContain(w);
  });
});

describe('Lowering the card limit', () => {
  test('cards taken out from inside the deck peel off the back as blank cards into the button, 90ms apart', async () => {
    const user = await renderApp(DECKS);
    const { total } = counter();
    fakeAnimate();

    await enterCardLimit(user, String(total - 3));

    expect(counter().total).toBe(total - 3);
    expect(flyers()).toHaveLength(3);
    expect(flyers().map(flyerWord)).toEqual([null, null, null]);
    expect(sliding().map((a) => a.options.delay)).toEqual([0, 90, 180]);
    expect(sliding().map((a) => a.options.duration)).toEqual([400, 400, 400]);
    for (const f of flyers()) expect(centreOf(endBox(f))).toEqual(centreOf(BUTTON));
    expect(shownCount()).toBe(0);
    landNext(3);
    expect(shownCount()).toBe(3);
  });

  test('raising the card limit slides nothing', async () => {
    const user = await renderApp(DECKS);
    const { total } = counter();
    fakeAnimate();

    await enterCardLimit(user, String(total + 2));

    expect(counter().total).toBe(total + 2);
    expect(flyers()).toHaveLength(0);
    expect(animations).toHaveLength(0);
  });
});

describe('Add Back Cards: the cards slide down out of the panel into the deck', () => {
  test('the cards picked slide from their place in the open panel to the deck card, growing to its size, 90ms apart', async () => {
    const { user, out } = await appWithShuffledOut(3);
    await pickToAddBack(user, [out[0], out[1]]);
    fakeAnimate();

    await user.click(addBackButton());

    // In the order of the list, from each card's place in the panel to the deck card.
    expect(flyers().map(flyerWord)).toEqual([out[0], out[1]]);
    flyers().forEach((f, i) => {
      expectBox(startBox(f), pickCardBox(i));
      expectBox(endBox(f), FRONT);
      expect(endOpacity(f)).toBe(1);
    });
    expect(sliding().map((a) => a.options.delay)).toEqual([0, 90]);
    expect(sliding().map((a) => a.options.duration)).toEqual([400, 400]);
    // The panel is still open, with the places of the cards that left it empty (an invisible card
    // can only be told by its class in jsdom), and can't be used until it closes.
    expect(panel()).toBeInTheDocument();
    expect(panel()).toHaveAttribute('inert');
    expect(cardOf(addBackGroup().getByRole('checkbox', { name: out[0] }))).toHaveClass('invisible');
    expect(cardOf(addBackGroup().getByRole('checkbox', { name: out[1] }))).toHaveClass('invisible');
    expect(cardOf(addBackGroup().getByRole('checkbox', { name: out[2] }))).not.toHaveClass('invisible');
  });

  test('the panel lifts away only after the last card has left it, and the deck then shows the first card added back', async () => {
    const { user, out } = await appWithShuffledOut(3);
    const before = currentWord();
    await pickToAddBack(user, [out[0], out[1]]);
    fakeAnimate();

    await user.click(addBackButton());

    // Until the first card lands, the deck still shows the card that was on screen.
    expect(currentWord()).toBe(before);
    landNext();
    expect(currentWord()).toBe(out[0]);
    // It isn't dealt in as well: it has just slid in.
    expect(screen.getByRole('article').parentElement).not.toHaveClass('deal-shuffle');
    expect(panel()).toBeInTheDocument();
    expect(panel()).not.toHaveClass('panel-lift');
    landNext();
    // The lift can only be seen as a class in jsdom.
    expect(panel()).toHaveClass('panel-lift');
    await waitFor(() => expect(panel()).not.toBeInTheDocument());
    expect(shuffledOutButton()).toHaveFocus();
    expect(currentWord()).toBe(out[0]);
  });

  test('the count stays the same, as many cards are taken out of the deck as are added back', async () => {
    const { user, out } = await appWithShuffledOut(3);
    await pickToAddBack(user, [out[0], out[1]]);
    fakeAnimate();

    await user.click(addBackButton());

    expect(shownCount()).toBe(3);
    landNext(2);
    expect(shownCount()).toBe(3);
    expect(shuffledOutButton()).not.toHaveClass('count-bump');
  });

  test('a picked card scrolled out of view in the panel starts sliding from the edge of the panel', async () => {
    const { user, out } = await appWithShuffledOut(3);
    await pickToAddBack(user, [out[2]]); // the third card, on the second row, below the part of the panel that shows
    fakeAnimate();

    await user.click(addBackButton());

    const [flyer] = flyers();
    expectBox(startBox(flyer), { ...pickCardBox(2), y: PANEL_BODY.y + PANEL_BODY.h - pickCardBox(2).h });
  });

  test('the cards end up in the deck and out of the list, the same as before', async () => {
    const { user, out } = await appWithShuffledOut(3);
    await pickToAddBack(user, [out[0], out[1]]);
    const takenOut = [1, 2].map((i) =>
      takeOutGroup()
        .getByRole('checkbox', { name: new RegExp(`^Card ${i}: `) })
        .getAttribute('aria-label')!
        .replace(/^Card \d+: /, ''),
    );
    fakeAnimate();

    await user.click(addBackButton());
    landNext(2);
    await waitFor(() => expect(panel()).not.toBeInTheDocument());

    const deck = (await deckContents(user)).map((c) => c.word);
    expect(deck).toContain(out[0]);
    expect(deck).toContain(out[1]);
    const listed = await listedWords(user);
    expect(listed).toHaveLength(3);
    expect(listed).toContain(out[2]);
    for (const w of takenOut) expect(listed).toContain(w);
  });
});

describe('with reduced motion on', () => {
  beforeEach(() => setReducedMotion(true));

  test('Shuffle In Cards: nothing slides, and the count changes at once', async () => {
    const user = await renderApp(DECKS);
    const before = currentWord();
    fakeAnimate();

    await shuffleIn(user, '3');

    expect(currentWord()).not.toBe(before);
    expect(animations).toHaveLength(0);
    expect(flyers()).toHaveLength(0);
    expect(shownCount()).toBe(3);
    expect(shuffledOutButton()).not.toHaveClass('count-bump');
    expect(screen.getByRole('status')).toHaveTextContent(/^Shuffled out cards \d+, \d+ and \d+ of \d+$/);
  });

  test('lowering the card limit: nothing slides, and the count changes at once', async () => {
    const user = await renderApp(DECKS);
    const { total } = counter();
    fakeAnimate();

    await enterCardLimit(user, String(total - 2));

    expect(animations).toHaveLength(0);
    expect(shownCount()).toBe(2);
  });

  test('Add Back Cards: nothing slides, the panel closes at once and the deck shows the first card added back', async () => {
    const { user, out } = await appWithShuffledOut(2);
    await pickToAddBack(user, [out[0]]);
    fakeAnimate();

    await user.click(addBackButton());

    expect(animations).toHaveLength(0);
    expect(panel()).not.toBeInTheDocument();
    expect(currentWord()).toBe(out[0]);
    expect(shownCount()).toBe(2);
  });
});

describe('pressing a button while cards are sliding', () => {
  test('pressing Next while the card shuffled out is sliding lands it at once, then moves on', async () => {
    const user = await renderApp(DECKS);
    fakeAnimate();
    await shuffleIn(user, '3');
    const { position } = counter();

    await user.click(nextButton());

    expect(flyers()).toHaveLength(0);
    expect(shownCount()).toBe(3);
    expect(counter().position).toBe(position + 1);
    // Next keeps its own animation.
    expect(screen.getByRole('article').parentElement).toHaveClass('deal-next');
  });

  test('a key press lands them at once too', async () => {
    const user = await renderApp(DECKS);
    fakeAnimate();
    await shuffleIn(user, '2');
    const { position } = counter();

    await user.keyboard('{ArrowRight}');

    expect(flyers()).toHaveLength(0);
    expect(shownCount()).toBe(2);
    expect(counter().position).toBe(position + 1);
  });

  test('pressing Shuffle In Cards again and again: every card ends up in the right place, with the right count', async () => {
    const user = await renderApp(DECKS);
    const out: (string | null)[] = [];
    fakeAnimate();

    for (let i = 0; i < 3; i++) {
      out.unshift(currentWord());
      // Pressing it lands the card still sliding from the last press first.
      await user.click(screen.getByRole('button', { name: 'Shuffle In Cards' }));
      expect(flyers()).toHaveLength(1);
      expect(flyerWord(flyers()[0])).toBe(out[0]);
      expect(shownCount()).toBe(i);
    }
    landNext();

    expect(shownCount()).toBe(3);
    expect(flyers()).toHaveLength(0);
    expect(await listedWords(user)).toEqual(out.map((w) => expect.stringContaining(w!)));
    const deck = (await deckContents(user)).map((c) => c.word);
    for (const w of out) expect(deck).not.toContain(w);
  });

  test('pressing Add Back Cards again and again: every card ends up in the right place, with the right count', async () => {
    const { user, out } = await appWithShuffledOut(3);
    fakeAnimate();

    await pickToAddBack(user, [out[0]]);
    await user.click(addBackButton());
    expect(flyers()).toHaveLength(1);
    // "Shuffled out (N)" lands the card and closes the panel; pressing it again opens it.
    await user.click(shuffledOutButton());
    expect(flyers()).toHaveLength(0);
    expect(panel()).not.toBeInTheDocument();
    expect(currentWord()).toBe(out[0]);
    await user.click(shuffledOutButton());
    await user.click(screen.getByRole('button', { name: 'Close shuffled-out cards' }));

    await pickToAddBack(user, [out[1]], [2]); // not Card 1: that is the card just added back
    await user.click(addBackButton());
    // Pressing Add Back Cards again does nothing while the panel is closing.
    await user.click(addBackButton());
    expect(screen.queryByRole('alert')).toBeNull();
    expect(flyers()).toHaveLength(0);
    expect(currentWord()).toBe(out[1]);
    await waitFor(() => expect(panel()).not.toBeInTheDocument());

    expect(shownCount()).toBe(3);
    const deck = (await deckContents(user)).map((c) => c.word);
    expect(deck).toContain(out[0]);
    expect(deck).toContain(out[1]);
    const listed = await listedWords(user);
    expect(listed).toHaveLength(3);
    expect(listed).toContain(out[2]);
    expect(listed).not.toContain(out[0]);
    expect(listed).not.toContain(out[1]);
  });

  test('pressing Next while cards added back are sliding lands them at once and moves on from the first card added back', async () => {
    const { user, out } = await appWithShuffledOut(3);
    await pickToAddBack(user, [out[0], out[1]]);
    fakeAnimate();
    await user.click(addBackButton());
    const { position } = counter();

    await user.click(nextButton());

    expect(flyers()).toHaveLength(0);
    expect(counter().position).toBe(position + 1);
    expect(currentWord()).not.toBe(out[0]);
    expect(shownCount()).toBe(3);
    await waitFor(() => expect(panel()).not.toBeInTheDocument());
  });

  test('studying another deck while cards are sliding lands them, with the right count', async () => {
    const user = await renderApp(DECKS);
    fakeAnimate();
    await shuffleIn(user, '3');
    expect(shownCount()).toBe(0);

    // A change with no click or key press (e.g. from a screen reader) lands them too.
    fireEvent.change(screen.getByLabelText('Deck'), { target: { value: 'N4' } });

    expect(flyers()).toHaveLength(0);
    expect(shownCount()).toBe(3);
  });

  test('Clear List while cards are sliding leaves nothing sliding and a count of 0', async () => {
    const user = await renderApp(DECKS);
    fakeAnimate();
    await shuffleIn(user, '3');

    await user.click(shuffledOutButton());
    await user.click(screen.getByRole('button', { name: 'Clear List' }));
    await user.click(screen.getByRole('button', { name: 'Yes, Clear List' }));

    expect(flyers()).toHaveLength(0);
    expect(shownCount()).toBe(0);
  });
});

describe('the sliding cards are only there to be seen', () => {
  test('they are hidden from screen readers, out of the Tab order and cannot be clicked', async () => {
    const user = await renderApp(DECKS);
    fakeAnimate();

    await shuffleIn(user, '2');

    const layer = document.querySelector('[data-card-flights]')!;
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer).toHaveAttribute('inert');
    // Not clickable: pointer-events can only be seen as a class in jsdom.
    expect(layer).toHaveClass('pointer-events-none');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    await user.tab();
    expect(layer.contains(document.activeElement)).toBe(false);
  });

  test('in StrictMode one card slides, not two, and the count steps once', async () => {
    serveDeck(DECKS);
    const user = userEvent.setup();
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    await screen.findByText(COUNTER);
    fakeAnimate();

    await shuffleIn(user, '1');

    expect(flyers()).toHaveLength(1);
    expect(sliding()).toHaveLength(1);
    landNext();
    expect(shownCount()).toBe(1);
    expect(flyers()).toHaveLength(0);
  });

  test('if the deck crashes while cards are sliding, no sliding card is left behind', async () => {
    const { user, out } = await appWithShuffledOut(3);
    await pickToAddBack(user, [out[0], out[1]]);
    fakeAnimate();
    await user.click(addBackButton());
    expect(flyers()).toHaveLength(2);

    crash.deckCard = true;
    landNext(); // the deck card changes to the first card added back, and fails to draw

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(flyers()).toHaveLength(0);
    expect(document.querySelector('[data-card-flights]')).toBeNull();
    expect(panel()).not.toBeInTheDocument();
  });

  test('Next, Back and Deck Shuffle keep their own animations and slide nothing to or from the panel', async () => {
    const user = await renderApp(DECKS);
    fakeAnimate();

    await user.click(nextButton());
    expect(screen.getByRole('article').parentElement).toHaveClass('deal-next');
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('article').parentElement).toHaveClass('deal-back');
    await user.click(screen.getByRole('button', { name: 'Deck Shuffle' }));
    expect(screen.getByRole('article').parentElement).toHaveClass('deal-shuffle');

    expect(animations).toHaveLength(0);
    expect(flyers()).toHaveLength(0);
  });

  test('where the browser cannot animate, the cards land at once and the count changes at once', async () => {
    const { user, out } = await appWithShuffledOut(1); // no fake animate(): jsdom has none

    await shuffleIn(user, '2');
    expect(flyers()).toHaveLength(0);
    expect(shownCount()).toBe(3);

    await pickToAddBack(user, [out[0]]);
    await user.click(addBackButton());
    expect(flyers()).toHaveLength(0);
    expect(panel()).not.toBeInTheDocument();
    expect(currentWord()).toBe(out[0]);
  });
});

describe('other ways a slide is cut short (PR #48 review)', () => {
  /** Every slide that was started has been stopped, so nothing is left running. */
  const allCancelledOrDone = () => animations.every((a) => a.cancelled || !a.el.isConnected);

  test('pressing "Shuffled out (N)" while cards slide into it lands them at once, then opens the panel', async () => {
    const user = await renderApp(DECKS);
    fakeAnimate();
    await shuffleIn(user, '3');
    expect(shownCount()).toBe(0);

    await user.click(shuffledOutButton());

    expect(flyers()).toHaveLength(0);
    expect(shownCount()).toBe(3);
    expect(panel()).toBeInTheDocument();
    expect(addBackGroup().getAllByRole('checkbox')).toHaveLength(3);
  });

  test('pressing Escape while cards added back are sliding: the panel goes, focus is on the button, nothing is left sliding', async () => {
    const { user, out } = await appWithShuffledOut(3);
    await pickToAddBack(user, [out[0], out[1]]);
    fakeAnimate();
    await user.click(addBackButton());
    expect(flyers()).toHaveLength(2);

    await user.keyboard('{Escape}');

    expect(panel()).not.toBeInTheDocument();
    expect(shuffledOutButton()).toHaveFocus();
    expect(flyers()).toHaveLength(0);
    expect(shownCount()).toBe(3);
    expect(currentWord()).toBe(out[0]);
  });

  test('a click outside the panel while cards added back are sliding: the panel goes, focus is on the button, nothing is left sliding', async () => {
    const { user, out } = await appWithShuffledOut(3);
    await pickToAddBack(user, [out[0], out[1]]);
    fakeAnimate();
    await user.click(addBackButton());
    expect(flyers()).toHaveLength(2);

    await user.click(screen.getByRole('heading', { level: 1 }));

    expect(panel()).not.toBeInTheDocument();
    expect(shuffledOutButton()).toHaveFocus();
    expect(flyers()).toHaveLength(0);
    expect(shownCount()).toBe(3);
    expect(currentWord()).toBe(out[0]);
  });

  test('if the app goes away while cards are sliding, the slides are stopped', async () => {
    const user = await renderApp(DECKS);
    fakeAnimate();
    await shuffleIn(user, '3');
    expect(sliding()).toHaveLength(3);

    cleanup(); // unmounts the app

    expect(animations).toHaveLength(3);
    expect(animations.every((a) => a.cancelled)).toBe(true);
    expect(document.querySelector('[data-card-flights]')).toBeNull();
  });

  test('if the app goes away while the panel is lifting away, its timer is cleared', async () => {
    const { user, out } = await appWithShuffledOut(2);
    await pickToAddBack(user, [out[0]]);
    fakeAnimate();
    const setTimer = vi.spyOn(window, 'setTimeout');
    const clearTimer = vi.spyOn(window, 'clearTimeout');
    await user.click(addBackButton());
    landNext();
    expect(panel()).toHaveClass('panel-lift');
    // The panel closes 180ms after it starts lifting (the panel-lift animation).
    const lift = setTimer.mock.calls.findIndex(([, ms]) => ms === 180);
    expect(lift).toBeGreaterThanOrEqual(0);
    const liftTimer = setTimer.mock.results[lift].value as unknown;

    cleanup();

    expect(clearTimer).toHaveBeenCalledWith(liftTimer);
  });

  test('studying another deck while cards are sliding stops their slides', async () => {
    const user = await renderApp(DECKS);
    fakeAnimate();
    await shuffleIn(user, '3');

    fireEvent.change(screen.getByLabelText('Deck'), { target: { value: 'N4' } });

    expect(sliding()).toHaveLength(0);
    expect(allCancelledOrDone()).toBe(true);
    expect(animations.every((a) => a.cancelled)).toBe(true);
  });

  test('scrolling the page while cards are sliding lands them at once, with the final count', async () => {
    const user = await renderApp(DECKS);
    fakeAnimate();
    await shuffleIn(user, '3');
    expect(shownCount()).toBe(0);

    fireEvent.scroll(window);

    expect(flyers()).toHaveLength(0);
    expect(shownCount()).toBe(3);
  });

  test('resizing the window while cards are sliding lands them at once, with the final count', async () => {
    const user = await renderApp(DECKS);
    const { total } = counter();
    fakeAnimate();
    await enterCardLimit(user, String(total - 2));
    expect(shownCount()).toBe(0);

    fireEvent(window, new Event('resize'));

    expect(flyers()).toHaveLength(0);
    expect(shownCount()).toBe(2);
  });

  test('scrolling the panel while cards added back slide out of it lands them, and the panel then lifts away', async () => {
    const { user, out } = await appWithShuffledOut(3);
    await pickToAddBack(user, [out[0], out[1]]);
    fakeAnimate();
    await user.click(addBackButton());

    fireEvent.scroll(document.querySelector('[data-flight-clip]')!);

    expect(flyers()).toHaveLength(0);
    expect(panel()).toHaveClass('panel-lift');
    await waitFor(() => expect(panel()).not.toBeInTheDocument());
    expect(currentWord()).toBe(out[0]);
  });

  test('while cards added back slide in, a "New" card still on screen keeps its New ribbon', async () => {
    const { user, out } = await appWithShuffledOut(2);
    await shuffleIn(user, '1'); // the card on screen is now a new one
    const before = currentWord();
    expect(onScreenIsNew()).toBe(true);
    await pickToAddBack(user, [out[0]], [2]);
    fakeAnimate();

    await user.click(addBackButton());

    expect(currentWord()).toBe(before);
    expect(onScreenIsNew()).toBe(true);
    landNext();
    // The first card added back isn't new.
    expect(currentWord()).toBe(out[0]);
    expect(onScreenIsNew()).toBe(false);
  });

  test('while cards added back slide in, a card on screen that is not new shows no New ribbon', async () => {
    const { user, out } = await appWithShuffledOut(2);
    expect(onScreenIsNew()).toBe(false);
    await pickToAddBack(user, [out[0]], [2]);
    fakeAnimate();

    await user.click(addBackButton());

    expect(flyers()).toHaveLength(1);
    expect(onScreenIsNew()).toBe(false);
  });
});
