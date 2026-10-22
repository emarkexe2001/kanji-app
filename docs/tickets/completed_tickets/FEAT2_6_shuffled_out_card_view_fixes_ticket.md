Ticket Code:
FEAT2_6

Feature Name: 
Shuffled-Out Card View Fixes

Origin:
Peer review of FEAT2_5 (PR #27, 2026-10-21). The review found no must-fix problems, but listed several small fixes. They are collected here so they can be done together once PR #27 is merged.

Feature Description:
As a user I would like the card views from FEAT2_5 to keep working when a card's data is badly broken, to keep the "New" badge on screen until I have really moved to another card, and to tell screen reader users everything that is shown on a card.

Feature Requirements / Expected Behaviours:
1. Missing card data: if a card's data is missing completely (not just one broken field), only that card shows "This card can't be shown." and the rest of the view still works. Today the card's label is worked out outside the per-card error boundary, so a missing card crashes the whole view.
2. One-card deck: the "New" badge only goes away when the screen moves to a different card. In a one-card deck, Next and Deck Shuffle stay on the same card, so its "New" badge stays.
3. No needless saving: moving between cards only saves the deck again when something changed (e.g. a card stopped being new). Today the deck is saved again on every Next or Deck Shuffle, even when nothing changed.
4. Screen readers: when a pick card is reached, a screen reader also hears its meaning, the deck it came from and whether it is new, not only the word and reading (e.g. with aria-describedby).
5. Holding Enter on a pick card toggles it once, not over and over.
6. The NEW ribbon's amber colour comes from a shared token in @kanji/core, like the green and red pick colours (PICK_COLORS), instead of a hard-coded Tailwind colour. How it looks stays the same.
7. Picked cards are still clearly marked when the device uses a high-contrast (forced colours) mode.
- Everything else from FEAT2 and FEAT2_5 stays the same.

Possible Test Scenarios I would like to see:

When I look at a shuffled-out card for a common word, it shows no "★ Common Word" badge (missing test from FEAT2_5)

When a shuffled-out card's data is missing completely, that card shows "This card can't be shown." and the other cards, Add Back and the deck still work

When my deck has one card and it is new, pressing Next or Deck Shuffle keeps its "New" badge

When I press Next and no card stops being new, the deck is not saved again

When I reach a pick card with a screen reader, I hear its word, reading, meaning, deck and whether it is new

When I hold Enter on a pick card, it is picked once

Failure paths (see docs/testing.md - each one needs a UI test, and each test must be checked to fail when the code it covers is broken):

When a card's data is missing completely, the rest of the view still works and a friendly message is shown instead of a blank view

Answers (agreed 2026-10-22):
- Req 7, high-contrast (forced colours) mode, Option A: a picked card gets a thick solid outline (about 3px, offset about 2px) in the system highlight colour (Highlight), and the tick badge becomes a ringed circle: a 2px Highlight border, a Canvas background and a Highlight tick. This only applies when the device uses forced colours; in normal colours nothing changes.
- Req 7, picked and focused cards in forced colours (Option 1, agreed after a browser check): a picked card turns fully Highlight. The whole compact card, header included, gets a Highlight background and all its text is HighlightText, inside the 3px Highlight outline. The tick stays a ringed circle (Canvas background, Highlight border and tick). Keyboard focus in forced colours is a 2px dashed CanvasText outline further out (offset about 5px), so it shows outside a picked card and on unpicked cards too. Covered by "in a high-contrast (forced colours) mode, a picked card turns fully Highlight with a ringed tick, and keyboard focus is a dashed outline outside it; in normal colours it looks the same as before".
- Req 1: the message and look of "This card can't be shown." stay exactly as they are today. Only the crash scope changes: one card's missing data must not take down the whole view. Covered by "when a card's data is missing completely, that card shows "This card can't be shown." and the other cards, Add Back and the deck still work".
- Req 1 covers both lists: a deck card with missing data shows "This card can't be shown." in "Take out of your deck" too, and the other cards, Add Back and the deck still work. Covered by "when a deck card's data is missing completely, it shows "This card can't be shown." in "Take out of your deck", and the other cards, Add Back and the deck still work".
- Req 4: nothing changes on screen. A screen reader hears the word and reading (the existing label), then the meaning, then "From <deck>", then "New" for a new card (through aria-describedby on the checkbox). Covered by "when I reach a pick card with a screen reader, I hear its word, reading, meaning, deck and whether it is new".
- Req 2 and Req 6: the NEW ribbon looks exactly the same. Its amber colour moves to a shared token in @kanji/core (NEW_COLOR, next to PICK_COLORS), keeping the same colour as Tailwind's amber-400 (#fbbf24). Covered by "the "NEW" ribbon keeps its amber colour, now from the shared NEW_COLOR token" and "when my deck has one card and it is new, pressing Next / Deck Shuffle keeps its "New" badge".

Layout check (see docs/standards/standards.md 4.2): look at the Shuffled-out cards view in a real browser at about 360px, 640px and 1024px, and at a picked card with forced colours turned on (tests can't show forced colours), and note it in the PR

Dependencies:
FEAT2_5 (PR #27) must be merged first, since these fixes change its code.

Branch name Examples:
fix/shuffled-out-card-view

Completed On:
2026-10-22
