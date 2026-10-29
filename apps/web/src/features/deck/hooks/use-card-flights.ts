import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { WordEntry } from '@kanji/core';
import { SHUFFLED_OUT_PANEL_ID } from '../components/shuffled-out-view';
import { useReducedMotion } from './use-reduced-motion';
import type { CardsMoved, StudyDeck } from './use-study-deck';

/** How long each card takes to slide (ADJ3). */
export const FLIGHT_MS = 400;
/** When several cards slide, each starts this long after the one before (ADJ3). */
export const FLIGHT_GAP_MS = 90;
/** A card shuffled out arrives at the "Shuffled out (N)" button at this fraction of its size... */
const AT_BUTTON_SCALE = 0.18;
/** ...and faded to this opacity. */
const AT_BUTTON_OPACITY = 0.2;
/** The space below the front card in the card stack, for the blank cards fanned out behind it (pb-8). */
const STACK_PADDING = 32;
/** How far in from the stack's edges a blank card peeling off the back of the deck starts. */
const BLANK_INSET = { x: 8, y: 20 };

/** A rectangle on screen, in px from the top left of the window. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** One card sliding between the deck and the shuffled-out list. */
export interface Flight {
  key: number;
  /** The card that slides, or null for a blank card back (a card from inside the deck). */
  entry: WordEntry | null;
  /** The width it is laid out at, and its height for a blank card (a card takes its own height). */
  width: number;
  height?: number;
  /** Where it starts and ends, given the height `h` it was laid out at. */
  place: (h: number) => { from: Box; to: Box };
  delay: number;
  endOpacity: number;
  /** How much the "Shuffled out (N)" count changes when it lands. */
  countChange: number;
  /** Whether it is a card being added back. */
  back: boolean;
  /** The card is drawn without its Reading Breakdown, like the deck card under the pop-up (ADJ2_5). */
  noBreakdown?: boolean;
}

/** The cards sliding between the deck and the shuffled-out list, and what is shown until they land (ADJ3). */
export interface CardFlights {
  flights: Flight[];
  /** Called when a card has finished sliding. */
  land: (key: number) => void;
  /** The "Shuffled out (N)" count to show: it changes as each card lands. */
  shownCount: number;
  /** Goes up each time a card lands and changes the count, to bump the button. */
  bump: number;
  /** While cards being added back slide down, and none has landed, the card the deck still shows. */
  heldCard: WordEntry | null;
  /** Whether the held card showed "New" when it was on screen, so it keeps its ribbon while held. */
  heldIsNew: boolean;
  /** The card on screen arrived by sliding into the deck, so it isn't dealt in as well. */
  quietArrival: boolean;
  /**
   * Calls `done` once the cards being added back have all landed. `animated` is false when they
   * didn't slide at all (e.g. with reduced motion on), so the panel closes straight away.
   */
  whenBackLands: (done: (animated: boolean) => void) => void;
}

const canAnimate = () => typeof document.body.animate === 'function';

const boxOf = (el: Element): Box => {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
};

/** The card stack and the front card in it, and the scale it is drawn at (smaller while the pop-up is open). */
function measureDeck() {
  const stack = document.querySelector<HTMLElement>('[data-card-stack]');
  if (!stack) return null;
  const box = boxOf(stack);
  const width = stack.offsetWidth;
  const scale = width ? box.w / width : 1;
  const front = { ...box, h: Math.max(0, box.h - STACK_PADDING * scale) };
  return { stack: box, front, width, scale, noBreakdown: stack.hasAttribute('data-no-breakdown') };
}

/** Where a card shuffled out lands: shrunk onto the middle of the "Shuffled out (N)" button. */
function intoButton(from: Box): Box {
  const button = document.querySelector(`[aria-controls="${SHUFFLED_OUT_PANEL_ID}"]`);
  const b = button ? boxOf(button) : { x: from.x, y: 0, w: from.w, h: 0 };
  const w = from.w * AT_BUTTON_SCALE;
  const h = from.h * AT_BUTTON_SCALE;
  return { x: b.x + b.w / 2 - w / 2, y: b.y + b.h / 2 - h / 2, w, h };
}

/**
 * Where a card being added back starts: its card in the panel, kept inside the part of the panel
 * that shows (a card scrolled out of view starts from the panel's edge).
 */
function sourceBox(id: string): Box | null {
  const el = document.querySelector(`[data-flight-source="${CSS.escape(id)}"]`);
  if (!el) return null;
  const box = boxOf(el);
  const clip = el.closest('[data-flight-clip]');
  if (!clip) return box;
  const c = boxOf(clip);
  return { ...box, y: Math.min(Math.max(box.y, c.y), Math.max(c.y, c.y + c.h - box.h)) };
}

let nextKey = 1;

/** The cards to slide for `moved`, each starting FLIGHT_GAP_MS after the one before. */
function plan(moved: CardsMoved): Flight[] {
  const deck = measureDeck();
  if (!deck) return [];
  const { stack, front, width, scale, noBreakdown } = deck;
  // The card's height when laid out at the deck's width, drawn at the deck's scale.
  const drawnHeight = (h: number) => h * scale;

  if (moved.kind === 'back') {
    // The deck already shows the card that slides in first, so the cards land exactly on it.
    return moved.cards.flatMap((entry, i): Flight[] => {
      const from = sourceBox(moved.ids[i]);
      if (!from || !entry) return [];
      return [
        {
          key: nextKey++,
          entry,
          noBreakdown,
          width,
          place: (h) => ({ from, to: { ...front, h: drawnHeight(h) } }),
          delay: i * FLIGHT_GAP_MS,
          endOpacity: 1,
          // Any change in the count (usually none: as many cards are taken out as are added back)
          // shows once the last card lands.
          countChange: i === moved.cards.length - 1 ? moved.countChange : 0,
          back: true,
        },
      ];
    });
  }

  const flights: Flight[] = [];
  if (moved.onScreen) {
    // The deck already shows the new card, centred where the old one was, so the old one starts
    // at the same middle with its own height.
    flights.push({
      key: nextKey++,
      entry: moved.onScreen,
      noBreakdown,
      width,
      place: (h) => {
        const from = { x: front.x, y: front.y + front.h / 2 - drawnHeight(h) / 2, w: front.w, h: drawnHeight(h) };
        return { from, to: intoButton(from) };
      },
      delay: 0,
      endOpacity: AT_BUTTON_OPACITY,
      countChange: 0,
      back: false,
    });
  }
  const blank = {
    x: stack.x + BLANK_INSET.x * scale,
    y: stack.y + BLANK_INSET.y * scale,
    w: stack.w - 2 * BLANK_INSET.x * scale,
    h: stack.h - 2 * BLANK_INSET.y * scale,
  };
  for (let i = 0; i < moved.hidden; i++) {
    flights.push({
      key: nextKey++,
      entry: null,
      width: blank.w,
      height: blank.h,
      place: () => ({ from: blank, to: intoButton(blank) }),
      delay: flights.length * FLIGHT_GAP_MS,
      endOpacity: AT_BUTTON_OPACITY,
      countChange: 0,
      back: false,
    });
  }
  // The count goes up by one as each card lands, as far as the list actually grew (it is capped).
  flights.forEach((f, i) => (f.countChange = i < moved.countChange ? 1 : 0));
  return flights;
}

/**
 * The cards sliding between the deck and the "Shuffled out (N)" button or the panel (ADJ3), for
 * each move in `study.moved`. The deck, the list and what is saved change straight away; only the
 * count shown on the button, and the deck card while cards are added back, wait for the cards to
 * land. Pressing anything (a click, a tap or a key) while cards are sliding makes them all land
 * straight away, before the press is handled, and so does the user scrolling or resizing. So does the next move of any kind (e.g. studying
 * another deck), so nothing is left sliding with an old count. With reduced motion on, or where
 * the browser can't animate, nothing slides and everything changes at once.
 */
export function useCardFlights(study: StudyDeck): CardFlights {
  const reducedMotion = useReducedMotion();
  const [flights, setFlights] = useState<Flight[]>([]);
  const flightsRef = useRef<Flight[]>([]);
  const [bump, setBump] = useState(0);
  const [quietFor, setQuietFor] = useState<CardsMoved | null>(null);
  const backDone = useRef<{ done: (animated: boolean) => void; started: boolean } | null>(null);

  const update = useCallback((next: Flight[], bumped: boolean) => {
    flightsRef.current = next;
    setFlights(next);
    if (bumped) setBump((b) => b + 1);
    const waiting = backDone.current;
    if (waiting?.started && !next.some((f) => f.back)) {
      backDone.current = null;
      waiting.done(true);
    }
  }, []);

  const land = useCallback(
    (key: number) => {
      const flight = flightsRef.current.find((f) => f.key === key);
      if (flight)
        update(
          flightsRef.current.filter((f) => f !== flight),
          flight.countChange !== 0,
        );
    },
    [update],
  );

  const finishAll = useCallback(() => {
    if (flightsRef.current.length) update([], false);
  }, [update]);

  // Any press lands the cards first. Capture phase, so it runs before the press is handled.
  // The user scrolling (the page or the panel, with a wheel, trackpad or touch; keys are caught
  // above) or resizing the window lands them too: where they slide from and to was measured on
  // screen once, so it would no longer be right. The scroll event itself isn't used: the browser
  // fires it too when it keeps the page still as the deck card changes height (scroll anchoring),
  // which would land every card the moment it started.
  useEffect(() => {
    const events = ['pointerdown', 'click', 'keydown', 'wheel', 'touchmove'] as const;
    const options = { capture: true, passive: true };
    events.forEach((e) => document.addEventListener(e, finishAll, options));
    window.addEventListener('resize', finishAll);
    return () => {
      events.forEach((e) => document.removeEventListener(e, finishAll, options));
      window.removeEventListener('resize', finishAll);
    };
  }, [finishAll]);

  const { moved, shuffledOut } = study;
  const seen = useRef(moved);
  useLayoutEffect(() => {
    if (moved === seen.current) return;
    seen.current = moved;
    // The cards are measured on screen once the move has been drawn, before it is painted.
    const launch = (m: CardsMoved) => {
      const planned = !reducedMotion && canAnimate() ? plan(m) : [];
      const waiting = backDone.current;
      if (m.kind === 'back' && waiting) {
        if (planned.length) waiting.started = true;
        else {
          backDone.current = null;
          waiting.done(false);
        }
      }
      if (planned.length) update(planned, false);
      setQuietFor(planned.length && m.kind === 'back' ? m : null);
    };
    finishAll();
    if (moved) launch(moved);
  }, [moved, reducedMotion, finishAll, update]);

  const whenBackLands = useCallback((done: (animated: boolean) => void) => {
    backDone.current = { done, started: false };
  }, []);

  const pending = flights.reduce((sum, f) => sum + f.countChange, 0);
  const back = flights.filter((f) => f.back);
  const held = back.length && study.moved?.kind === 'back' && back.length === study.moved.cards.length;

  return {
    flights,
    land,
    shownCount: Math.max(0, shuffledOut.length - pending),
    bump,
    heldCard: held && study.moved?.kind === 'back' ? study.moved.onScreen : null,
    heldIsNew: !!held && study.moved?.kind === 'back' && study.moved.onScreenIsNew,
    quietArrival: study.moved !== null && study.moved === quietFor,
    whenBackLands,
  };
}
