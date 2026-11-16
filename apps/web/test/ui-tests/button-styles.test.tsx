// CHORE7: the seven filled colour buttons all take their look from buttonClass(variant, size), and
// Next, Back, Cancel and − / + keep their own (agreed answer 2). jsdom draws no colours, padding or
// outlines, so the classes are checked; test/unit/lib/button-classes.test.ts checks what each
// variant and size gives.
import { screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { buttonClass, type ButtonSize, type ButtonVariant } from '../../src/lib/button-classes';
import { deckShuffleButton, makeDecks, NO_PAUSE, renderApp, shuffleIn, shuffleInButton, type User } from './helpers';

const DECKS = makeDecks({ N5: 30, N4: 30 });

const button = (name: string | RegExp) => screen.getByRole('button', { name });
const shuffledOutButton = () => button(/^Shuffled out \(\d+\)$/);

const classesOf = (variant: ButtonVariant, size: ButtonSize) => buttonClass(variant, size).split(' ');

/** Shuffles one card out, moves on, and opens the Shuffled-out panel. */
async function openPanelWithOneCard(user: User) {
  await shuffleIn(user, '1');
  await user.click(button('Next →'));
  await user.click(shuffledOutButton());
}

/** A filled colour button's own background, or a High contrast outline colour only they use. */
const FILLED_LOOK =
  /(?:^|\s)(?:bg-(?:sky|indigo|emerald|rose)-600|hover:bg-(?:sky|indigo|emerald|rose)-500|hc:ring-hc-(?:sky|indigo|emerald|rose))(?=\s|$)/;

describe('One place for the button styles (CHORE7)', () => {
  test('the seven filled colour buttons each have the look of their colour and size (addition)', async () => {
    const user = await renderApp(DECKS, NO_PAUSE);
    await openPanelWithOneCard(user);

    expect(shuffledOutButton()).toHaveClass(...classesOf('sky', 'header'));
    expect(deckShuffleButton()).toHaveClass(...classesOf('indigo', 'full'));
    expect(shuffleInButton()).toHaveClass(...classesOf('emerald', 'full'));
    expect(button('Add Back Cards')).toHaveClass(...classesOf('emerald', 'panel'));
    expect(button('Clear List')).toHaveClass(...classesOf('rose', 'panel'));

    await user.click(button('Clear List'));
    expect(button('Yes, Clear List')).toHaveClass(...classesOf('rose', 'panel'));

    await user.click(button('Yes, Clear List'));
    expect(button(/^Recover cleared list/)).toHaveClass(...classesOf('sky', 'panel'));
  });

  test('Next, Back, Cancel and − / + keep their own looks, not a filled colour button look (agreed answer 2)', async () => {
    const user = await renderApp(DECKS, NO_PAUSE);
    await openPanelWithOneCard(user);
    await user.click(button('Clear List'));

    for (const name of ['Next →', 'Back', 'Cancel', 'Decrease card limit', 'Increase card limit']) {
      expect(button(name).getAttribute('class') ?? '', name).not.toMatch(FILLED_LOOK);
    }
  });
});
