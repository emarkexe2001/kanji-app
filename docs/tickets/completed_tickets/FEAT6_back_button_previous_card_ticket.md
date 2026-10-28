Ticket Code:
FEAT6

Feature Name:
Back Button (Go Back to the Previous Card)

Origin:
Asked for on 2026-10-27. Today the deck only moves forward: Next goes to the next card and Deck Shuffle jumps to a random one. Once I've moved on there's no way to see the card I was just looking at again.

Feature Description:
As a user studying a deck, I would like a Back button that takes me back to the card I saw before, so I can look at a card again after moving past it by mistake or too quickly.

Feature Requirements / Expected Behaviours:
- A "Back" button sits with the card controls (Deck Shuffle and Next). Its exact placement and look is decided in the mockup.
- Back goes to the **last card I actually saw**, like a browser back button. That includes a card I reached with Deck Shuffle, not only with Next.
- Pressing Back again keeps going further back through the cards I've seen.
- **At the start** (no earlier card seen yet, e.g. right after the app loads), Back wraps to the last card in the deck, the same way Next wraps from the last card to Card 1.
- The "Card X of Y" counter updates to show the card Back went to.
- Going Back does not change the deck. It only changes which card is on screen.
- Pressing Next after going Back moves forward from the card on screen as Next does today.
- Keyboard: ← (Left arrow) works as Back, matching → for Next. It doesn't fire while typing in a field. The keyboard hint under the deck mentions it.
- The button is a real `<button>` with a clear accessible name. It works in high-contrast (forced colours) mode and has a visible focus ring.

Possible Test Scenarios I would like to see:

When I press Next and then Back, I see the card I was on before

When I use Deck Shuffle to jump to a random card and then press Back, I go back to the card I was on before the jump

When I press Back several times, I go back through the cards I saw, in reverse order

When I press Back at the start, before seeing any other card, I go to the last card in the deck

When I press Back, the "Card X of Y" counter shows the card I went back to, and my deck has not changed

When I press the Left arrow key, it works the same as the Back button, and it does nothing while I'm typing in a field

When I go Back and then press Next, Next moves on from the card on screen

Failure paths (see docs/testing.md - each one needs a UI test, and each test must be checked to fail when the code it covers is broken):

When a card I saw earlier has since been removed from the deck (for example by Shuffle In Cards or a smaller card limit), Back skips it and goes to the card before it. It never shows a missing or broken card.

When the deck only has one card, Back stays on that card and nothing breaks

Open Questions (to confirm before starting, per PROC3; layout ones go in the mockup):
- Placement: three buttons in one row (Back | Deck Shuffle | Next), or Back on a row of its own? Label "← Back" to match "Next →"?
  Answer: two rows (Option B). Row 1 is "← Back" | "Next →", row 2 is Deck Shuffle across the full width. The label is "← Back".
- Wrap at the start: the decision combines "last card I saw" with "wraps to the last card". When there's no history, Back goes to the card before in deck order (Card 1 → last card). Is that right?
  Answer: yes.
- After history runs out (I've gone back through everything I saw), should Back keep going to the card before in deck order, or stop?
  Answer: keep going to the card before in deck order.
- Should the history be kept after a reload, or start fresh?
  Answer: start fresh. Nothing new is saved.
- Should Deck Shuffle, Shuffle In Cards, a card-limit change or changing the studied deck clear the history?
  Answer: only changing the studied deck clears it. The others keep it.
- Should there be a limit on how far back the history goes (e.g. the last 50 cards)?
  Answer: yes, the last 50 cards.
- Does the card slide the other way when going Back (links to ADJ3 card slide animations)?
  Answer: yes, it comes in from the left. ADJ3 may refine it later.
- Does going Back affect the NEW ribbon on a card (FEAT2_5/FEAT2_6)?
  Answer: yes, going Back counts as moving on from the card on screen, exactly like Next.

Mockup (approved): https://claude.ai/artifact/6vU4xD7tWSJHJekKSvL1oA (Option B chosen, Back style "outline")

Answers (agreed 2026-10-28):
- Layout: Option B. The card controls become two rows. Row 1 is a 2-column grid, "← Back" | "Next →". Row 2 is Deck Shuffle, full width. All three buttons keep a minimum height of 48px and rounded-xl corners, and Next and Deck Shuffle keep their colours.
- Back is an outline button: white background, 1px slate-400 border (#94a3b8), slate-900 semibold text, label "← Back". The arrow is decorative, so the accessible name is "Back". Hover is a light slate tint. It has a visible focus ring, and in a forced-colours (high-contrast) mode its border uses ButtonText so it can still be told apart.
- Back goes to the last card actually seen, like a browser back button, including cards reached by Deck Shuffle and by Add Back Cards. Pressing Back takes that card off the history. Next after Back moves on from the card on screen (the card after it), as today. There is no "forward" history.
- When the history is empty (at the start, or after it runs out), Back goes to the card before in deck order, wrapping from Card 1 to the last card.
- The history is not kept after a reload. It starts fresh, and nothing new is saved to storage.
- Only changing the studied deck clears the history. Deck Shuffle, Shuffle In Cards and card-limit changes keep it. Cards no longer in the deck (removed by Shuffle In Cards or a smaller card limit) are skipped, and Back goes to the card before them in the history. It never shows a missing or broken card. The history holds card ids, not positions, and a history entry that is the card already on screen is skipped too.
- The history keeps at most the last 50 cards. Older ones drop off, and Back then carries on in deck order.
- Animation: the card Back goes to slides in from the left, the opposite way to Next. It is skipped when "reduce motion" is on, like the other moves. ADJ3 may refine it later.
- NEW ribbon: going Back counts as moving on from the card on screen, exactly like Next, so its ribbon goes.
- Keyboard: ← (Left arrow) works as Back, but not while typing in a field. The hint reads "Keyboard: ← back · → next · S deck shuffle".
- One-card deck: Back stays on that card and nothing breaks.
- The "Card X of Y" counter updates, and Back never changes the deck itself (its cards, their order or the saved deck). Only the card on screen changes, and a "New" card stops being new once it is moved on from.

Dependencies:
None required. ADJ3 (card slide animations) should agree on how a Back move animates if it is done first.

Branch name Examples:
feature/back-button-previous-card

Completed On:
2026-10-28
