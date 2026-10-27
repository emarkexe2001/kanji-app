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
  Answer: at random across all their cards combined. The new cards of every ticked deck are pooled together, each card once (Common words overlaps the JLPT decks), so bigger decks give more cards.
- Is ticking a single deck under Multiple decks allowed (acting like One deck), or must it be two or more?
  Answer: two or more.

Mockup (approved): https://claude.ai/artifact/JfG7Gy4qrJjaQBMkxpHTUm (Option B chosen)

Answers (agreed 2026-10-27):
- Layout: Option B, a three-way switch. The "Shuffle in from" dropdown is replaced by a segmented switch labelled "Shuffle in from": One deck | Random | Multiple decks. It is a real radio group (fieldset, legend and native radio buttons drawn as connected segments): the chosen segment is emerald-600 with white text, the arrow keys move between choices, focus is visible, and it can be told apart in a high-contrast (forced colours) mode.
  - One deck: the deck dropdown (the other decks) shows underneath. It works exactly like FEAT1's single-deck choice.
  - Random: nothing extra shows. It works exactly like FEAT1's "Random deck for each card".
  - Multiple decks: a "Decks to shuffle in from" box (white, light emerald border) shows a checkbox for each other deck, 2 per row, labelled like the deck picker. The studied deck is never offered. Rows are at least 32px tall.
  - The "Cards to shuffle in" row and the Shuffle In Cards button stay as they were, in the same emerald-50 panel.
- Picking: combined random (see above). Same rules as FEAT1: the card on screen goes first, no card is ever in the deck twice, and the deck size stays the same as the card limit. Cards shuffled out go into the Shuffled-out cards list (FEAT2).
- Two or more decks must be ticked.
- When Multiple decks is first chosen, nothing is ticked.
- With fewer than two other decks, the Multiple decks segment is disabled with the hint "Needs at least two other decks."
- Messages (red, inline, role="alert", the deck doesn't change):
  - none ticked: "Tick at least two decks to shuffle in from."
  - one ticked: "Tick at least two decks, or choose One deck instead."
  - not enough new cards: "The ticked decks only have N new cards left. Tick more decks or shuffle in fewer cards." ("1 new card" for one; with none left: "The ticked decks have no new cards left. Tick other decks to shuffle in from.")
  - a ticked deck gone after a reload, or no longer offered (e.g. it is now the studied deck): it is unticked and an amber notice (role="status") says e.g. "JLPT N1 is no longer available, so it has been unticked." Several are listed together ("JLPT N2 and JLPT N1 are no longer available, so they have been unticked.").
  - Messages clear when the ticks, the choice or the number of cards change.
- Remembered after a reload: the choice (One deck, Random or Multiple decks), the One deck dropdown's deck and the ticked decks. The ticks are also kept while another choice is used. Choices saved before FEAT3 still load.

Dependencies:
FEAT1 (Shuffle In Cards). FEAT2 is not required, but if it is done first, cards shuffled out here must show in its list.

Branch name Examples:
feature/shuffle-in-multiple-decks

Completed On:
2026-10-27
