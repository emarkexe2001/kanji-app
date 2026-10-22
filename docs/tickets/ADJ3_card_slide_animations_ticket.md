Ticket Code:
ADJ3

Ticket Type:
Adjustment (changes how existing UI is shown, not what it does)

Adjustment Name: 
Cards Slide Between the Deck and the Shuffled-Out Panel

Origin:
Split out of ADJ2 on 2026-10-22. ADJ2 makes the Shuffled-out panel float in the top right. This ticket animates cards moving between the deck and that panel, like a real deck.

Adjustment Description:
As a user I would like to see cards move between my deck and the shuffled-out list: cards I add back slide down out of the panel and into the deck, and cards that are shuffled out slide up out of the deck and into the shuffled-out list.

Requirements / Expected Behaviours:
- Adding back: when I press Add Back Cards, each card being added back slides down and out of the panel and into the deck.
- Shuffling out: when a card leaves the deck (e.g. it is taken out to make room, or swapped out by Shuffle In Cards), it slides up and out of the deck and into the shuffled-out list (towards the panel, or towards the "Shuffled out (N)" button when the panel is closed).
- With reduced motion on, there is no sliding: cards just appear in their new place, as today.
- The animations don't change what happens: the same cards end up in the deck and the list, the counts are the same, and the deck is saved the same way.
- The buttons stay usable during an animation, and pressing them quickly doesn't leave cards stuck half-way or in the wrong place.
- Screen readers still hear the same summary messages as today; the animations are hidden from them.

Possible Test Scenarios I would like to see:

When I add cards back, they end up in my deck and out of the shuffled-out list, the same as before

When cards are shuffled out, they end up in the shuffled-out list, the same as before

When reduced motion is on, cards move without any sliding

When I press Add Back Cards or Shuffle In Cards quickly several times, every card ends up in the right place

Layout check (see docs/standards/standards.md 4.2): watch the animations in a real browser at about 360px, 640px and 1024px and note it in the PR

Answers (agreed 2026-10-22):
- Cards going into the deck slide down and out of the panel and into the deck.
- Cards going into the shuffled-out list slide up and out of the deck and into the list.
- This is its own ticket, separate from ADJ2.

Open Questions (to confirm with a mockup before starting - standards 5.1):
- How long should each slide take, and when several cards move, do they go one after another or all at once?
- When the panel is closed and a card is shuffled out, should it slide towards the "Shuffled out (N)" button, or just fade out of the deck?
- Should the "Shuffled out (N)" count change when the card lands, or straight away?

Dependencies:
ADJ2 must be merged first, since the cards slide to and from its floating panel.

Branch name Examples:
feature/card-slide-animations
