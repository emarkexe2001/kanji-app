import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FLIGHT_MS, type Box, type CardFlights, type Flight } from '../hooks/use-card-flights';
import { CardErrorBoundary } from './card-error-boundary';
import { WordCard } from './word-card';

/** Slow at both ends, like a card being picked up and put down (ADJ3). */
const EASING = 'cubic-bezier(0.45, 0, 0.2, 1)';

/** The transform that draws a `width` x `height` element, placed at the top left of the window, over `box`. */
const over = (box: Box, width: number, height: number) =>
  `translate(${box.x}px, ${box.y}px) scale(${width ? box.w / width : 1}, ${height ? box.h / height : 1})`;

/**
 * One card sliding (ADJ3). It is laid out at its full size at the top left of the window and
 * moved and scaled from where it starts to where it lands, with the Web Animations API, so it can
 * go between places measured on screen. Where the browser can't animate, it lands straight away.
 */
function Flyer({ flight, onLand }: { flight: Flight; onLand: (key: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof el.animate !== 'function') {
      onLand(flight.key);
      return;
    }
    const height = flight.height ?? el.offsetHeight;
    const { from, to } = flight.place(height);
    const start = over(from, flight.width, height);
    el.style.transform = start;
    const animation = el.animate(
      [
        { transform: start, opacity: 1 },
        { opacity: 1, offset: 0.7 },
        { transform: over(to, flight.width, height), opacity: flight.endOpacity },
      ],
      { duration: FLIGHT_MS, delay: flight.delay, easing: EASING, fill: 'both' },
    );
    animation.onfinish = () => onLand(flight.key);
    return () => animation.cancel();
  }, [flight, onLand]);

  return (
    <div
      ref={ref}
      style={{ width: flight.width, height: flight.height }}
      className={`card-flyer ${flight.entry ? '' : 'card-flyer-blank'}`}
    >
      {flight.entry && (
        <CardErrorBoundary>
          <WordCard entry={flight.entry} />
        </CardErrorBoundary>
      )}
    </div>
  );
}

/**
 * The cards sliding between the deck and the shuffled-out list (ADJ3), drawn over the whole page.
 * They are only there to be seen: hidden from screen readers, out of the Tab order and can't be
 * clicked.
 */
export function CardFlightLayer({ flights }: { flights: CardFlights }) {
  if (!flights.flights.length) return null;
  return createPortal(
    <div aria-hidden inert data-card-flights className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {flights.flights.map((f) => (
        <Flyer key={f.key} flight={f} onLand={flights.land} />
      ))}
    </div>,
    document.body,
  );
}
