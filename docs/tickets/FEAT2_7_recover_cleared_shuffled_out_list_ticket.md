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
- While the shuffled-out list is empty and a cleared list is kept, the Shuffled-out cards view shows a "Recover cleared list (N)" button under the "No cards have been shuffled out yet" message, where N is the number of cards that were cleared
- Pressing "Recover cleared list (N)" puts the cleared cards back in the shuffled-out list, in the same order, and the button goes away
- The cleared list can be recovered any time, including after a reload: it is saved with the deck (through the storage helper, and checked on load like the rest of the saved deck)
- The cleared list is dropped, and the button goes away, as soon as a new card is shuffled out. Only the most recent cleared list is kept
- Cards that are back in the deck by the time the list is recovered are not added to the shuffled-out list again (no duplicates)
- Everything else in FEAT2 and FEAT2_5 stays the same: Clear List still asks for confirmation, the 100-card limit, picking and adding back
- Follows the UI standards: the button is colour-coded and consistent with the other buttons, and only shows when there is something to recover

Possible Test Scenarios I would like to see:

When I clear the shuffled-out list, a "Recover cleared list" button shows with the number of cards cleared

When I press "Recover cleared list", the cards come back in the shuffled-out list in the same order, and the button goes away

When I clear the list and reload the app, I can still recover it

When I clear the list and then shuffle a new card out, the "Recover cleared list" button is gone and the old list can't be recovered

When a cleared card is back in my deck and I recover the list, that card is not shown in the shuffled-out list

When nothing has been cleared, no "Recover cleared list" button is shown

Failure paths (see docs/testing.md - each one needs a UI test, and each test must be checked to fail when the code it covers is broken):

When the saved cleared list is broken (e.g. bad data or unknown cards), the app still loads, the broken cards are dropped, and the rest of the deck works

When storage is unavailable, Clear List and recovering still work until the page is reloaded

Open Questions (to confirm before starting, per PROC3):
- What colour should the "Recover cleared list (N)" button be? (Red is for deletion, so not red.)
- Should the Clear List confirmation message say the list can be recovered (e.g. "You can recover it until you shuffle out another card")?
- If the user switches to another deck, is the cleared list kept for the deck it came from, the same as the shuffled-out list?

Dependencies:
FEAT2_5 (PR #27) must be merged first. FEAT2_6, FEAT2_7 and ADJ1 all change the Shuffled-out cards view, so they should be done one after another, not at the same time.

Branch name Examples:
feature/recover-cleared-shuffled-out-list
