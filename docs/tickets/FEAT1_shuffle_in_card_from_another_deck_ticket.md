Ticket Code:
FEAT1

Feature Name: 
Shuffle In a Card From Another Deck

Origin:
Discussion of the TEST1 shuffle scenario (PR #12). Today the Shuffle button only jumps to a different card inside the current deck; no card ever enters or leaves the deck. As more decks are added (see card_category_ticket.md), I would like shuffle to be able to bring in a card from another deck, like a traditional card game where you swap an old card for a new one. This builds on the idea in example_ticket.md (Card Shuffle), focusing on swapping in cards from a different deck.

Feature Description:
As a user studying with several decks, I would like the option to shuffle a new card into my current deck from another deck of my choice, with one of my current cards removed to make room, so I get more variety without changing my card limit.

Feature Requirements / Expected Behaviours:
The user can choose a "shuffle in from" deck (any deck other than the one being studied)
A "Shuffle in" action takes one random card from the chosen deck that is not already in the current deck, adds it to the current deck, and removes one old card, so the deck size stays the same as the card limit
The newly shuffled-in card is shown straight away
The card that is removed is not the one being shuffled in, and the same card is never in the deck twice
The existing Shuffle button (jump to a random card inside the current deck) keeps working as it does now
If the chosen deck has no cards left that aren't already in the current deck, the user sees a clear message and the deck does not change
If no other deck is available, the "Shuffle in" option is disabled or hidden, with a short explanation
Follows the UI standards: colour-coded button, only show the controls the user needs, validation messages inline with role="alert"

Possible Test Scenarios I would like to see:

When I shuffle in a card from another deck, a card from that deck is shown and is now part of my deck

When I shuffle in a card, my deck size stays the same as my card limit and one old card is no longer in the deck

When I shuffle in several cards, the same card never appears in my deck twice

When the other deck has no new cards left to shuffle in, a message is shown and my deck does not change

When there is no other deck to shuffle in from, the shuffle-in option is disabled and explains why

When I press the normal Shuffle button, it still only moves between cards already in my deck

Failure paths (see docs/testing.md): each failure scenario above must have a UI test, and each test must be checked to fail when the code it covers is broken

Open Questions (to confirm before starting, per PROC3):
- Which old card is removed: the card currently shown, a random card, or the card seen longest ago?
- Should a shuffled-in card stay in the deck after a reload, or does the deck reset to its own cards?
- Should the user be able to shuffle in more than one card at a time (example_ticket.md suggested a limit of 5-10)?
- Does the button sit next to the existing Shuffle button, and what is it called ("Shuffle in", "Swap card")?

Dependencies:
Needs more than one deck to exist first (card_category_ticket.md, or another ticket that adds multiple decks). TEST1 (UI tests) is done, so the tests can be added alongside the feature.

Branch name Examples:
feature/shuffle-in-from-another-deck
