Ticket Code:
FEAT8

Feature Name: 
Remember Which Card I Was On

Origin:
Codebase and app retro (2026-11-16). The deck itself is saved (`kanji.savedDeck`), but the card on screen isn't. `loadState` in `apps/web/src/features/deck/hooks/use-study-deck.ts` always starts at `index: 0`, so after a reload, or when I come back to the app later, I'm on "Card 1 of N" again, however far through the deck I was.

Feature Description:
As a user I would like the app to open on the card I was looking at, so I can carry on where I left off.

Feature Requirements / Expected Behaviours:
- The card on screen is saved each time it changes (Next, Back, Deck Shuffle, Shuffle In Cards, Add Back, a card limit change).
- It is saved by card id, not by position, so it stays right if the deck changes.
- On reload, the app opens on that card, with the right "Card X of N".
- If that card is no longer in the deck (e.g. the saved data is from another deck, it was edited, or the card limit is lower), the app opens on card 1, as today, with no error.
- Switching to another deck with the Deck picker starts that deck on card 1, as today.
- If storage is blocked, the app works as today (opens on card 1).
- The "New" badge rules don't change. Opening the app on a new card doesn't count as having seen it and moved on.

Possible Test Scenarios I would like to see:

When I go to card 5 and reload, I'm on card 5 of the same deck

When I reload after Shuffle In Cards, I'm on the first shuffled-in card

When the saved card is no longer in my deck, I'm on card 1 and nothing breaks

When I lower my card limit so the saved card would be cut, then reload, I'm on the card that was on screen (the limit never removes the card on screen)

When I reload on a card showing "New", it still shows "New"

When storage is blocked, the app opens on card 1

When the saved card data is broken or edited by hand, the app opens on card 1

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. Should Back's history be saved too, so Back still works after a reload? FEAT6 chose not to save it.
2. Should the place be saved per deck, so going back to N5 from N4 returns to where I was in N5? Today only the studied deck's cards are saved, so this would also mean saving each deck's cards.
3. This changes nothing on screen except which card shows. Is "changes nothing on screen" enough in place of a mockup (standards 5.1)?

Branch name Examples:
feature/remember-card-on-screen
