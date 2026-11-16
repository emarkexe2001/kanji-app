Ticket Code:
UI6

Ticket Type:
UI fix

Feature Name: 
A Broken Card on Screen Shouldn't Break the Whole Deck

Origin:
CHORE8 (2026-11-16, answer 5). The CHORE8 feature agent found that when the card on screen has no data, the whole deck is replaced with "Something went wrong showing the cards. Please reload the page to try again." (`DeckErrorBoundary`), and Next, Back, Deck Shuffle, Shuffle In Cards and the card limit all disappear with it. A card in the Shuffled-out panel with no data only shows a small "This card can't be shown." box in its own place, and the rest keeps working (FEAT2_6). CHORE8 kept the on-screen behaviour as it was, on purpose, so it stayed a pure refactor. This ticket changes it.

It was checked with a throwaway test: a saved deck of 5 N5 cards, N5-2's data missing (the same `buildLibrary` mock as `missing-card-data.test.tsx`), press Next. The deck-wide error appears, "This card can't be shown." appears 0 times, and `console.error` is called once.

In the real app a card's data can't normally go missing, because loading checks every saved card against the dictionary. It can only happen if the dictionary and saved data get out of step in a way those checks miss, so this is a robustness fix and low priority.

Description:
As a user, if one card in my deck can't be shown, I would like to see that card's message in its place and still be able to move on with Next, Back and Deck Shuffle, rather than losing my whole deck to an error.

Requirements / Expected Behaviours:
- When the card on screen has no data, the card stack shows "This card can't be shown." in place of the card (look agreed in the mockup), with "Card X of N" as normal.
- Next, Back, Deck Shuffle, Shuffle In Cards, the card limit and the Shuffled-out panel all keep working.
- No `console.error` is logged for it.
- The slide animations don't break: a missing card can slide in and out, or just appear (agreed in the mockup).
- The "held" card (the old card shown while cards being added back slide in): if it has no data, the agreed behaviour is written down and tested.
- The deck error boundary stays as a safety net for unexpected errors.
- It works in Light, Dark and High contrast, from 320px up, and on the slim card under the Shuffled-out pop-up.
- The message is announced to screen readers the same way as the panel's message.

Possible Test Scenarios I would like to see:

When the card on screen has no data, I see "This card can't be shown." in its place and "Card 2 of 5", and no "Something went wrong" message

When the card on screen has no data and I press Next, the next card shows as normal

When the card on screen has no data, Back, Deck Shuffle and Shuffle In Cards still work

When the card on screen has no data, nothing is logged to `console.error`

When the card on screen has no data in High contrast, the message is readable (UI or e2e test)

Break-and-restore check: make the card stack draw a missing card again and see the tests go red

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. Should the message be the small dashed box used in the panel, or a full-size card shape with the message in it, so the deck doesn't jump in size?
2. Should a missing card slide like other cards, or just appear?
3. Should the user be told more, e.g. "This card can't be shown. Press Next to carry on."?
4. Should Shuffle In Cards prefer to replace a missing card first?

Mockup:
Needed before work starts (standards 5.1): today's deck-wide error and the new card-stack message, at 360px and 1024px, in Light, Dark and High contrast, with the options for question 1 side by side.

Dependencies:
CHORE8 (types say a card's data can be missing) must be merged first.

Branch name Examples:
fix/missing-card-on-screen-message
