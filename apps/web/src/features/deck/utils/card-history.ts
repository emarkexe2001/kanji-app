/**
 * The cards the user has seen, for the Back button (FEAT6). It holds card ids, not positions, so
 * it stays right when the deck changes (Shuffle In Cards, the card limit), and it is not saved:
 * after a reload it starts empty.
 */

/** How many cards Back remembers. Older ones drop off, and Back then goes on in deck order. */
export const MAX_HISTORY = 50;

/** The history after moving on from the card `id`, keeping only the last MAX_HISTORY cards. */
export function rememberCard(history: string[], id: string): string[] {
  return [...history, id].slice(-MAX_HISTORY);
}

export interface BackStep {
  /** The position (from 0) of the card Back goes to. */
  index: number;
  /** The history left after going there. */
  history: string[];
}

/**
 * Where Back goes from the card at `index`: the last card seen that is still in the deck. Cards
 * that are no longer in the deck, and the card already on screen, are skipped. With nothing left
 * in the history it goes to the card before in deck order, wrapping from the first card to the
 * last. In a one-card deck it stays on that card.
 */
export function goBack(history: string[], cardIds: string[], index: number): BackStep {
  const onScreen = cardIds[index];
  const rest = [...history];
  while (rest.length) {
    const id = rest.pop()!;
    const position = cardIds.indexOf(id);
    if (position !== -1 && id !== onScreen) return { index: position, history: rest };
  }
  return { index: (index - 1 + cardIds.length) % cardIds.length, history: rest };
}
