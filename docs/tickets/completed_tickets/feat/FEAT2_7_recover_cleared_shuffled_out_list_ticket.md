Ticket Code:
FEAT2_7

Feature Name: 
Recover a Cleared Shuffled-Out List

Origin:
Testing FEAT2_5 (PR #27, 2026-10-21). Clear List asks for confirmation, but if I clear the shuffled-out list by accident there is no way to get it back.

Builds on FEAT2 and FEAT2_5 (the Shuffled-out cards view). FEAT2 is still the source of truth for what Clear List does; this ticket adds a way to undo it.

Feature Description:
As a user who has cleared my shuffled-out list by accident, I would like to be able to recover it, so I don't lose track of the cards I shuffled out.

Feature Requirements / Expected Behaviours:
- After Clear List, the cleared list is kept (the same cards, in the same order, newest first) so it can be recovered
- While a cleared list is kept, the Shuffled-out cards view shows a "Recover cleared list (N)" button, where N is the number of cards that were cleared. It sits under the "No cards have been shuffled out yet" message when the shuffled-out list is empty, and with Clear List when the list has cards: below it on a phone, beside it from 640px up (see Further answers)
- Pressing "Recover cleared list (N)" adds the cleared cards to the shuffled-out list, each in its place by when it was shuffled out (newest first), and the button goes away. It never erases or replaces cards already in the list (see Further answers)
- The cleared list can be recovered any time, including after a reload: it is saved with the deck (through the storage helper, and checked on load like the rest of the saved deck)
- The cleared list is kept until it is recovered, or until Clear List is pressed again (the newer clear replaces it). Shuffling cards out doesn't drop it. Only the most recent cleared list is kept (see Further answers)
- Cards that are back in the deck, or already in the shuffled-out list, by the time the list is recovered are not added again (no duplicates)
- Everything else in FEAT2 and FEAT2_5 stays the same: Clear List still asks for confirmation, the 100-card limit, picking and adding back
- Follows the UI standards: the button is colour-coded and consistent with the other buttons, and only shows when there is something to recover

Possible Test Scenarios I would like to see:

When I clear the shuffled-out list, a "Recover cleared list" button shows with the number of cards cleared

When I press "Recover cleared list", the cards come back in the shuffled-out list in the same order, and the button goes away

When I clear the list and reload the app, I can still recover it

When I clear the list and then shuffle a new card out, the "Recover cleared list" button is still shown (replaced by the Further answers; it used to say the button is gone)

When a cleared card is back in my deck and I recover the list, that card is not shown in the shuffled-out list

When nothing has been cleared, no "Recover cleared list" button is shown

Failure paths (see docs/testing.md - each one needs a UI test, and each test must be checked to fail when the code it covers is broken):

When the saved cleared list is broken (e.g. bad data or unknown cards), the app still loads, the broken cards are dropped, and the rest of the deck works

When storage is unavailable, Clear List and recovering still work until the page is reloaded

Open Questions (to confirm before starting, per PROC3):
- What colour should the "Recover cleared list (N)" button be? (Red is for deletion, so not red.)
- Should the Clear List confirmation message say the list can be recovered (e.g. "You can recover it until you shuffle out another card")?
- If the user switches to another deck, is the cleared list kept for the deck it came from, the same as the shuffled-out list?

Answers (agreed 2026-10-21):
- Recover button colour: sky blue, filled, the same style as the "Shuffled out (N)" button.
- The Clear List confirmation says the list can be recovered. The Yes, Clear List and Cancel buttons stay the same. (The wording was changed in the Further answers below.)
- Decks: there is one cleared list for all decks, matching how the shuffled-out list already works (each card keeps the deck it came from). Switching decks keeps the one cleared list. This is covered by the test "when I clear the list and switch to another deck, the same cleared list can be recovered, each card still from its own deck".

Further answers (agreed 2026-10-21):
- Recovering adds the cleared cards to the current shuffled-out list. It never erases or replaces cards already in the list.
- The cleared list is kept until it is recovered, or until Clear List is pressed again (the newer clear replaces it). Shuffling cards out (Shuffle In Cards, lowering the card limit, swapping out) doesn't drop it, and it is kept after a reload.
- Order: each recovered card goes back in its place by when it was shuffled out (newest first). If the list goes over 100 cards, the oldest cards are dropped, as before. Cards already in the deck, or already in the shuffled-out list, are skipped (no duplicates).
- Button placement: when the shuffled-out list is empty, the button stays under "No cards have been shuffled out yet". When the list has cards, it sits at the bottom of the panel, next to Clear List: [Clear List] [Recover cleared list (N)]. It stays sky blue and filled.
- Clear List confirmation, with the number of cards: "Clear all N cards? You can recover them later." For one card: "Clear 1 card? You can recover it later."
- Clear List / Recover row on a phone: the full label doesn't fit beside Clear List, so on a phone the two buttons are stacked full width (Clear List on top, "Recover cleared list (N)" below). From the sm breakpoint (640px) up they sit side by side. The full label is kept.
- While the Clear List confirmation is open, the Recover button is hidden. It comes back if the confirmation is cancelled.

Extra test scenarios from the further answers:

When I recover while the shuffled-out list has cards, the cards already listed stay and the cleared ones are added by when they were shuffled out, with no duplicates

When I clear the list and then shuffle a new card out, the "Recover cleared list" button is still shown

When I press Clear List again, the newer cleared list replaces the one kept before

When recovering takes the list past 100 cards, the oldest cards are dropped

The button sits with Clear List when the list has cards (stacked on a phone, side by side from 640px), and under the "No cards" message when the list is empty

While the Clear List confirmation is open, the Recover button is hidden

When I clear the list and switch to another deck, the button still shows with the same count, and recovering brings the cards back with their original "From <deck>" labels

The Clear List confirmation shows the number of cards

Dependencies:
FEAT2_5 (PR #27) must be merged first. FEAT2_6, FEAT2_7 and ADJ1 all change the Shuffled-out cards view, so they should be done one after another, not at the same time.

Branch name Examples:
feature/recover-cleared-shuffled-out-list

Completed On:
2026-10-21
