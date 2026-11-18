/**
 * The markers the deck's parts use to find each other on the page (CHORE9), kept in one place so a
 * renamed marker can't quietly break the card slides or the Shuffled-out cards panel. Each marker
 * is written here once: the components put it on the page with the `...Marker` helpers, and the
 * code that looks it up uses the `find...` helpers.
 */

/** The id of the Shuffled-out cards panel, which the "Shuffled out (N)" button controls (aria-controls). */
export const SHUFFLED_OUT_PANEL_ID = 'shuffled-out-panel';

/** Marks the card stack, so the cards sliding in and out of the deck can find it. */
const CARD_STACK = 'data-card-stack';
/** On the card stack while it shows the slim card (ADJ2_5), which has no room below it for blank cards. */
const SLIM = 'data-slim';
/** Marks a card in the panel by its id, so a card added back starts sliding from it (ADJ3). */
const FLIGHT_SOURCE = 'data-flight-source';
/** Marks the part of the panel that scrolls, so a card scrolled out of view starts from its edge (ADJ3). */
const FLIGHT_CLIP = 'data-flight-clip';

/** Finds the "Shuffled out (N)" button by the panel it controls. */
export const SHUFFLED_OUT_BUTTON_SELECTOR = `[aria-controls="${SHUFFLED_OUT_PANEL_ID}"]`;

/** The "Shuffled out (N)" button, or null when it isn't on the page. */
export const findShuffledOutButton = () => document.querySelector<HTMLElement>(SHUFFLED_OUT_BUTTON_SELECTOR);

/** The markers for the card stack, `slim` while it shows the slim card. */
export const cardStackMarkers = (slim: boolean) => ({ [CARD_STACK]: true, [SLIM]: slim || undefined });

/** The card stack, or null when there is no deck on the page. */
export const findCardStack = () => document.querySelector<HTMLElement>(`[${CARD_STACK}]`);

/** Whether the card stack shows the slim card. */
export const isSlimStack = (stack: Element) => stack.hasAttribute(SLIM);

/** The marker for a card in the panel that a card added back slides from (none without an id). */
export const flightSourceMarker = (id: string | undefined) => ({ [FLIGHT_SOURCE]: id });

/** The card in the panel marked with `id`, or null when there is none. */
export const findFlightSource = (id: string) => document.querySelector(`[${FLIGHT_SOURCE}="${CSS.escape(id)}"]`);

/** The marker for the part of the panel that scrolls. */
export const FLIGHT_CLIP_MARKER = { [FLIGHT_CLIP]: true };

/** The part of the panel that scrolls, around `el`, or null when `el` isn't inside it. */
export const findFlightClip = (el: Element) => el.closest(`[${FLIGHT_CLIP}]`);
