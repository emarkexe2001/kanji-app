Ticket Code:
FEAT2

Feature Name: 
Shuffled-Out Cards View

Origin:
Split out of the shuffle-in work (FEAT1), agreed 2026-10-14. When Shuffle In Cards removes cards from the deck, I would like to be able to see them again and add them back in if I want them.

This is part 2 of 3:
- FEAT1: the two shuffle buttons, shuffling in from one chosen deck or a random deck
- FEAT2 (this ticket): the Shuffled-out cards view, for adding shuffled-out cards back
- FEAT3: shuffling in from multiple decks at once

Feature Description:
As a user who shuffles new cards into my deck, I would like to see the cards that were shuffled out, so I can add them back into my deck if I want to study them again.

Feature Requirements / Expected Behaviours:
- Every card removed by Shuffle In Cards goes into a "Shuffled-out cards" list, newest first, instead of being lost
- A "Shuffled-out cards" view (e.g. a panel or page opened from a button with the count, such as "Shuffled out (3)") shows each card's word, reading and meaning
- The user can pick one or more cards in the view and add them back into the deck. To keep the deck size the same as the card limit, the same number of cards leave the deck (see Open Questions) and go into the shuffled-out list in their place.
- A card that is added back is removed from the shuffled-out list and shown straight away
- The shuffled-out list is still there after a reload, like the deck itself. Browser storage is only used through the src/lib/storage.ts helper.
- The user can clear the list. This is a dangerous action, so it uses a red button and asks for confirmation.
- When the list is empty, the view says so (e.g. "No cards have been shuffled out yet") instead of being blank
- Follows the UI standards: only show what the user needs, red for dangerous actions, validation messages inline with role="alert"

Possible Test Scenarios I would like to see:

When I shuffle in cards, the cards that were removed appear in the Shuffled-out cards view, newest first

When I add a card back from the Shuffled-out cards view, it is shown and is part of my deck again, it is no longer in the shuffled-out list, and my deck size still matches my card limit

When I add several cards back at once, they are all in my deck and my deck size still matches my card limit

When I reload the app, the Shuffled-out cards list is still there

When I clear the shuffled-out list and confirm, the list is empty

Failure paths (see docs/testing.md - each one needs a UI test, and each test must be checked to fail when the code it covers is broken):

When no cards have been shuffled out yet, the Shuffled-out cards view shows a message saying so instead of an empty list

When I try to add back more cards than my card limit allows at once, a validation message is shown and my deck does not change

When I clear the shuffled-out list and then cancel the confirmation, nothing is cleared

When browser storage is blocked, the shuffled-out list still works for the current session

Open Questions (to confirm before starting, per PROC3):
- When a card is added back, which card leaves the deck to make room: the card on screen (same as Shuffle In Cards), or one the user picks?
- Is there a maximum size for the shuffled-out list (e.g. only the last 100 cards are kept)?
- Should the list show which deck each card came from?
- If the user lowers the card limit, should the cards that drop out of the deck also go into the shuffled-out list?

Answers (agreed 2026-10-20):
- When cards are added back, the user picks which cards in the deck leave to make room. They must pick the same number of cards to remove as they add back, and the cards they pick go into the shuffled-out list.
- The shuffled-out list keeps the last 100 cards. Older ones drop off the end.
- Each card in the list shows which deck it came from (e.g. N4).
- Cards that drop out when the card limit is lowered also go into the shuffled-out list (FEAT1 records them).

Extra test scenarios from the answers:

When I add a card back and pick a card in my deck to swap out, the picked card moves to the shuffled-out list

When I pick a different number of cards to remove than to add back, a validation message is shown and my deck does not change

When more than 100 cards have been shuffled out, only the newest 100 are kept

When I lower the card limit, the cards that drop out appear in the shuffled-out list

Dependencies:
FEAT1 (Shuffle In Cards) must be done first, since that is what shuffles cards out.

Branch name Examples:
feature/shuffled-out-cards-view

Completed On:
2026-10-20 (PR #24)
