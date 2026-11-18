// CHORE9: the helpers in features/deck/utils/dom-markers.ts that put the deck's page markers on
// the page and find them again. Each runs on a small page built for the test (jsdom, since the
// helpers use `document`); the deck's own tests (card-slides, shuffled-out-panel,
// floating-panel-fixes) check them working together in the app.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  cardStackMarkers,
  FLIGHT_CLIP_MARKER,
  findCardStack,
  findFlightClip,
  findFlightSource,
  findShuffledOutButton,
  flightSourceMarker,
  isSlimStack,
  SHUFFLED_OUT_BUTTON_SELECTOR,
  SHUFFLED_OUT_PANEL_ID,
} from '../../src/features/deck/utils/dom-markers';

describe('the Shuffled-out panel id and button', () => {
  it('keeps the panel id the button points at', () => {
    expect(SHUFFLED_OUT_PANEL_ID).toBe('shuffled-out-panel');
    expect(SHUFFLED_OUT_BUTTON_SELECTOR).toBe('[aria-controls="shuffled-out-panel"]');
  });

  it('finds the button that controls the panel', () => {
    render(
      <>
        <button aria-controls="colour-menu">Colour mode</button>
        <button aria-controls={SHUFFLED_OUT_PANEL_ID}>Shuffled out (3)</button>
        <div id={SHUFFLED_OUT_PANEL_ID} />
      </>,
    );
    expect(findShuffledOutButton()).toHaveTextContent('Shuffled out (3)');
  });

  it('finds nothing when the button is not on the page', () => {
    render(<button aria-controls="colour-menu">Colour mode</button>);
    expect(findShuffledOutButton()).toBeNull();
  });
});

describe('the card stack markers', () => {
  it('marks the stack, without data-slim when it is not slim', () => {
    render(<div {...cardStackMarkers(false)} />);
    const stack = findCardStack();
    expect(stack).not.toBeNull();
    // React writes `true` as "true", as the bare JSX attributes did before CHORE9.
    expect(stack).toHaveAttribute('data-card-stack', 'true');
    expect(stack).not.toHaveAttribute('data-slim');
    expect(isSlimStack(stack as HTMLElement)).toBe(false);
  });

  it('marks a slim stack with data-slim', () => {
    render(<div {...cardStackMarkers(true)} />);
    const stack = findCardStack();
    expect(stack).toHaveAttribute('data-slim', 'true');
    expect(isSlimStack(stack as HTMLElement)).toBe(true);
  });

  it('finds no stack when there is no deck on the page', () => {
    render(<div data-slim="true" />);
    expect(findCardStack()).toBeNull();
  });
});

describe('the flight source marker', () => {
  it('finds the card in the panel by its id, even an id that needs escaping', () => {
    const odd = 'n5:"日本"\\1';
    render(
      <>
        <div {...flightSourceMarker('n5:other')}>other</div>
        <div {...flightSourceMarker(odd)}>wanted</div>
      </>,
    );
    expect(findFlightSource(odd)).toHaveTextContent('wanted');
    expect(findFlightSource('n5:other')).toHaveTextContent('other');
  });

  it('finds nothing for an id that is not on the page', () => {
    render(<div {...flightSourceMarker('n5:a')} />);
    expect(findFlightSource('n5:b')).toBeNull();
  });

  it('writes no marker for a card without an id', () => {
    const { container } = render(<div {...flightSourceMarker(undefined)} />);
    expect(container.firstElementChild?.getAttributeNames()).toEqual([]);
  });
});

describe('the flight clip marker', () => {
  it('finds the scrolling part of the panel around a card', () => {
    render(
      <div data-testid="clip" {...FLIGHT_CLIP_MARKER}>
        <ul>
          <li>card</li>
        </ul>
      </div>,
    );
    const card = screen.getByText('card');
    const clip = findFlightClip(card);
    expect(clip).toHaveAttribute('data-testid', 'clip');
    expect(clip).toHaveAttribute('data-flight-clip', 'true');
  });

  it('finds nothing for an element outside it', () => {
    render(
      <>
        <div {...FLIGHT_CLIP_MARKER}>
          <span>inside</span>
        </div>
        <span>outside</span>
      </>,
    );
    expect(findFlightClip(screen.getByText('outside'))).toBeNull();
  });
});
