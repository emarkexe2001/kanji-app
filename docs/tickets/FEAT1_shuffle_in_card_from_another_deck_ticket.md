Ticket Code:
FEAT1

Feature Name: 
Shuffle In Cards From Another Deck

Origin:
Discussion of the TEST1 shuffle scenario (PR #12). Today the Shuffle button only jumps to a different card inside the current deck; no card ever enters or leaves the deck. As more decks are added (see card_category_ticket.md), I would like to be able to shuffle cards in from other decks, like a real-life card game where you swap old cards for new ones. This builds on the idea in example_ticket.md (Card Shuffle).

Feature Description:
As a user studying with several decks, I would like to shuffle one or more new cards into my current deck from another deck, removing old cards to make room, so I get more variety without changing my card limit. I would like to choose which deck the new cards come from: one deck I pick, a random deck, or several decks at once.

Feature Requirements / Expected Behaviours:
Buttons:
- The current Shuffle button is renamed "Deck Shuffle". It works exactly as it does now: it jumps to a different card already in the deck. The S keyboard shortcut still does a Deck Shuffle.
- A new "Shuffle In Cards" button shuffles new cards in from a separate deck.

Choosing where the new cards come from (a "Shuffle in from" control next to the button):
- One deck: the user picks a single other deck from a list
- Random: each new card comes from a randomly chosen other deck
- Multiple decks: the user ticks two or more other decks, and the new cards are picked at random from across them
- The current deck is never offered as a source
- The user's choice is remembered after a reload

How many cards:
- The user can choose how many cards to shuffle in at once, like shuffling several new cards into a real deck. The default is 1.
- The number can't be more than the card limit, and the user gets an inline validation message (role="alert") if it is

What happens on Shuffle In Cards:
- The card currently on screen is always removed from the deck, and the first new card takes its place and is shown straight away
- When shuffling in more than one card, the card on screen is removed first and the other old cards removed are chosen at random (see Open Questions)
- New cards are picked at random from the chosen source deck(s), and only cards not already in the current deck are used, so the same card is never in the deck twice
- The deck size stays the same as the card limit
- The updated deck, including shuffled-in cards, is still the same after a reload. Browser storage is only used through the src/lib/storage.ts helper, and the app still works (without remembering) if storage is blocked.

When it can't be done:
- If the chosen source deck(s) don't have enough new cards for the number asked for, the user sees a clear message saying how many are available, and the deck does not change
- If there is no other deck to shuffle in from, Shuffle In Cards is disabled with a short explanation
- If "Multiple decks" is chosen but no deck is ticked, the user sees a validation message and the deck does not change

Follows the UI standards: colour-coded buttons that are easy to tell apart, only show the controls the user needs, validation messages inline with role="alert".

Possible Test Scenarios I would like to see:

When I press Deck Shuffle, a different card from my current deck is shown and no card enters or leaves the deck

When I shuffle in 1 card from a deck I picked, the card that was on screen is removed and a card from the picked deck is shown

When I shuffle in several cards, that many cards from the chosen deck(s) are now in my deck, the card that was on screen is gone, and the deck size still matches my card limit

When I choose Random, the new cards come from decks other than my current deck

When I choose Multiple decks, the new cards only come from the decks I ticked

When I shuffle in cards and reload the app, my deck still has the shuffled-in cards and my "Shuffle in from" choice is remembered

When I shuffle in cards many times, the same card never appears in my deck twice

Failure paths (see docs/testing.md - each one needs a UI test, and each test must be checked to fail when the code it covers is broken):

When the chosen deck(s) don't have enough new cards left, a message is shown and my deck does not change

When I ask to shuffle in more cards than my card limit, a validation message is shown and my deck does not change

When I choose Multiple decks but tick none, a validation message is shown and my deck does not change

When there is no other deck to shuffle in from, Shuffle In Cards is disabled and explains why

When browser storage is blocked, shuffling in still works for the current session

Decisions already made (2026-10-14):
- The card removed is always the one on screen
- Shuffled-in cards stay in the deck after a reload
- More than one card can be shuffled in at once
- The existing button becomes "Deck Shuffle", and the new one is "Shuffle In Cards", with a choice of one deck, a random deck, or multiple decks

Open Questions (to confirm before starting, per PROC3):
- When shuffling in more than one card, which other old cards are removed after the one on screen: random ones, the ones seen longest ago, or the ones next in the deck?
- Is there a maximum number of cards that can be shuffled in at once below the card limit (example_ticket.md suggested 5-10)?
- With Random, is one deck chosen for the whole shuffle, or a random deck for each new card? (This ticket assumes a random deck for each card.)
- If the user changes the card limit after shuffling in cards, which cards are kept?

Notes for the developer:
- The UI tests in apps/web/test/ui-tests/ find the shuffle button with /shuffle/i. With two shuffle buttons they need updating to use the exact names.
- Shuffled-in cards mean the deck is no longer just "the first N words", so the saved deck (not just the card limit) needs to be stored.

Dependencies:
Needs more than one deck to exist first (card_category_ticket.md, or another ticket that adds multiple decks). TEST1 (UI tests) and TOOL1 (ESLint) should be merged first.

Branch name Examples:
feature/shuffle-in-cards
