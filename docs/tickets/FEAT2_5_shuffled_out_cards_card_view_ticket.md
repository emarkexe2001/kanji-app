Ticket Code:
FEAT2_5

Feature Name: 
Shuffled-Out Cards Shown as Cards

Origin:
Review of FEAT2 (PR #24, 2026-10-20). The Shuffled-out cards view lists each card as a checkbox row (word, reading, meaning and deck). A checklist is too simple for this: I would like to see the shuffled-out cards as cards, in a format similar to the card in the deck, so they are easy to recognise before I add them back.

Builds on FEAT2 (the Shuffled-out cards view). FEAT2 is still the source of truth for what adding back and clearing do; this ticket changes how the cards are shown and picked, and (from the Answers below) adds a "New" badge and slide animations for cards shuffled in and out.

Feature Description:
As a user looking at the cards I've shuffled out, I would like each one shown as a card that looks like the cards in my deck, so I can recognise them at a glance and pick which ones to add back.

Feature Requirements / Expected Behaviours:
- The Shuffled-out cards view shows each shuffled-out card as a card, in a format similar to the card in the deck: the coloured header (JLPT level or Vocabulary), the word with its colour-coded reading highlights, the reading, and the meaning
- Each card also shows which deck it came from (e.g. "From JLPT N4"), as FEAT2 does now
- The cards are smaller than the card on screen (a compact version), so several fit in the view without endless scrolling
- The user picks a card to add back by selecting the card itself (e.g. tapping or clicking it), instead of ticking a checkbox. A picked card is clearly marked (e.g. a coloured outline and a tick), and selecting it again un-picks it
- Picking still works with the keyboard and screen readers: each card can be reached with Tab and toggled with Space or Enter, and is announced as picked or not picked
- The cards stay in the same order as now, newest first
- Everything else in FEAT2 stays the same: picking cards in the deck to take out, Add Back Cards, the validation messages, Clear List with confirmation, the empty message and the 100-card limit
- Follows the UI standards: colours come from the shared tokens in @kanji/core (no hard-coded reading colours), consistent with the deck's card, only show what the user needs

Possible Test Scenarios I would like to see:

When I open the Shuffled-out cards view, each shuffled-out card is shown as a card with its level, word, reading, meaning and the deck it came from

When I select a shuffled-out card, it is marked as picked, and selecting it again un-picks it

When I pick shuffled-out cards by selecting them and add them back, they are in my deck and shown, the same as in FEAT2

When I use only the keyboard, I can move between the shuffled-out cards and pick one

Failure paths (see docs/testing.md - each one needs a UI test, and each test must be checked to fail when the code it covers is broken):

When a shuffled-out card's details can't be drawn (e.g. broken data), the rest of the view still works and a friendly message is shown instead of a blank view

When no cards have been shuffled out yet, the view still shows the "No cards have been shuffled out yet" message instead of an empty area

Open Questions (to confirm before starting, per PROC3):
- Should the cards in the view show the full Reading Breakdown section like the card on screen, or only the header, word, reading and meaning (a compact card)?
- How should the cards be laid out: a grid (e.g. two per row on a phone), a single column, or a horizontal row the user swipes through?
- Should the "Take out of your deck" list also use cards, or stay a simple list (the user already knows those cards because they're in the deck)?
- Should the card that was just shuffled in (shown after Shuffle In Cards) get any extra visual, e.g. a "New" badge or a short animation, or is that a separate ticket?
- Should the card component be shared between the deck and this view (a "compact" version of the same card), or a separate component?

Answers (agreed 2026-10-20):
- Compact card: the header, the word in kanji (with its reading highlights) and the meaning. No Reading Breakdown section.
- Layout: not decided yet. Confirm before starting.
- The "Take out of your deck" list also uses cards, picked the same way as the shuffled-out cards.
- Cards that were shuffled in get a "New" badge so they are easy to spot in the deck. They also get an animation of the card sliding into the deck. Cards being shuffled out get an animation of the card sliding out of the deck.
- Reuse the deck's card component for now (a compact version of it), rather than writing a separate one.

Extra test scenarios from the answers:

When I shuffle in cards, the cards that were shuffled in show a "New" badge

When I look at a shuffled-out card, it shows its word and meaning but no Reading Breakdown

When I pick cards to take out of my deck, they are shown as cards and I pick them by selecting the card

Open Questions from the answers (to confirm before starting):
- How long does a card keep its "New" badge: until the user has seen it once, until the next Shuffle In Cards, or until it is shuffled out?
- Is the "New" badge kept after a reload?
- When the user prefers reduced motion (the "reduce motion" setting on their device), should the slide in / slide out animations be turned off?

Dependencies:
FEAT2 (PR #24) must be merged first, since this changes its view.

Branch name Examples:
feature/shuffled-out-card-view
