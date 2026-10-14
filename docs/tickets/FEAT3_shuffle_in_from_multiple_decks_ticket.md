Ticket Code:
FEAT3

Feature Name: 
Shuffle In From Multiple Decks

Origin:
Split out of the shuffle-in work (FEAT1), agreed 2026-10-14. FEAT1 lets the user shuffle in cards from one chosen deck or a random deck. I would also like to pick several decks at once to shuffle from.

This is part 3 of 3:
- FEAT1: the two shuffle buttons, shuffling in from one chosen deck or a random deck
- FEAT2: the Shuffled-out cards view, for adding shuffled-out cards back
- FEAT3 (this ticket): shuffling in from multiple decks at once

Feature Description:
As a user studying with several decks, I would like to tick more than one deck to shuffle new cards in from, so I get a mix of cards from the decks I care about.

Feature Requirements / Expected Behaviours:
- The "Shuffle in from" control gets a third option, "Multiple decks", next to "One deck" and "Random"
- With Multiple decks, the user ticks two or more other decks. The current deck is never offered.
- On Shuffle In Cards, the new cards are picked at random from across the ticked decks, with the same rules as FEAT1: the card on screen is removed first, no card is ever in the deck twice, and the deck size stays the same as the card limit
- The ticked decks are remembered after a reload
- Cards shuffled out this way go into the Shuffled-out cards list (FEAT2) like any other
- Follows the UI standards: only show the deck checkboxes when Multiple decks is chosen, validation messages inline with role="alert"

Possible Test Scenarios I would like to see:

When I choose Multiple decks and tick two decks, the new cards only come from the decks I ticked

When I shuffle in several cards from multiple decks, my deck size still matches my card limit and the card that was on screen is gone

When I reload the app, my Multiple decks choice and the ticked decks are remembered

When I switch from Multiple decks back to One deck or Random, shuffling in works as it does in FEAT1

Failure paths (see docs/testing.md - each one needs a UI test, and each test must be checked to fail when the code it covers is broken):

When I choose Multiple decks but tick none, a validation message is shown and my deck does not change

When I choose Multiple decks but tick only one, a validation message asks me to tick at least two (or to use One deck instead)

When the ticked decks together don't have enough new cards left, a message is shown and my deck does not change

When a deck I had ticked no longer exists after a reload, it is unticked and I am told

Open Questions (to confirm before starting, per PROC3):
- Should cards be picked evenly from each ticked deck, or at random across all their cards combined (so bigger decks give more cards)?
- Is ticking a single deck under Multiple decks allowed (acting like One deck), or must it be two or more?

Dependencies:
FEAT1 (Shuffle In Cards). FEAT2 is not required, but if it is done first, cards shuffled out here must show in its list.

Branch name Examples:
feature/shuffle-in-multiple-decks
