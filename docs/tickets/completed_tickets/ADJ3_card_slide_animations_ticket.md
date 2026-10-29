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

Mockup (approved, default options): https://claude.ai/artifact/JAoaHPXxDeJ7n6xmW3dHuC

Answers (agreed 2026-10-29, from the mockup):
- How long each slide takes: 400ms.
- Several cards: "close behind each other". Each card starts 90ms after the one before.
- Panel closed: this is always the case when shuffling out, because pressing Shuffle In Cards or changing the card limit is a click outside the panel, which closes it. The card shuffled out shrinks and slides up into the "Shuffled out (N)" header button, fading to about 20% as it arrives. This replaces the old downward slide for the card leaving on Shuffle In Cards. The new card still drops on.
- The "Shuffled out (N)" count changes as each card lands (one step per card), with a small bump on the button. The deck, the list and what is saved change straight away, as before. Only the number shown waits. Screen-reader messages stay exactly as they were.
- Add Back Cards: the picked cards slide down out of the open panel into the deck card, growing from their small panel size to the deck card's size. The panel closes (lifts away) only after the last card has left it. The deck then shows the first card added back, as before.
- Cards taken out from inside the deck that aren't on screen (lowering the card limit, or the extra cards when Shuffle In Cards takes more than one) each show as a blank card back peeling off the back of the deck and sliding into the "Shuffled out (N)" button, 90ms apart.
- Pressing any button while cards are moving makes them land straight away (the count jumps to its final value), then the new action runs. Nothing may be left half-way, doubled, or with an old count.
- Reduced motion on: no sliding at all. Cards appear in their new place and the count changes at once, as before.
- The moving cards are only there to be seen: hidden from screen readers, can't be clicked and can't be focused.
- Next, Back (FEAT6, in from the left) and Deck Shuffle keep their current animations.
- Next: the card slides in from the right, the mirror of Back (agreed 2026-10-29).
- Scrolled page: if the header is off screen, a shuffled-out card still slides up out of the top of the window towards the button (agreed 2026-10-29).

Dependencies:
ADJ2 must be merged first, since the cards slide to and from its floating panel.

Branch name Examples:
feature/card-slide-animations

Completed On:
2026-10-29
