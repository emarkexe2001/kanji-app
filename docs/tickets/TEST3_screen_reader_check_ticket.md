Ticket Code:
TEST3

Ticket Type:
Test (optional)

Test Name: 
Screen Reader Check of the Shuffled-Out Cards

Origin:
FEAT2_6 (PR #36, 2026-10-22) made a screen reader hear each pick card's meaning, deck and whether it is new. That is covered by automated tests. While checking PR #36 in the browser, I asked for a hands-on screen reader check to be its own optional ticket.

Description:
As a user who relies on a screen reader, I would like the Shuffled-out cards panel to be checked with a real screen reader, so I know it reads out what is on each card in a sensible order.

Requirements / Expected Behaviours:
- Check the Shuffled-out panel with Windows Narrator in Chrome (and NVDA if available).
- On each pick card in the "Add back" list, the screen reader says the word and reading, whether it is picked, the meaning and "From <deck>".
- On each card in the "Take out of your deck" list, it also says the card number and "New" for a card that is new.
- Holding Enter on a card picks it once.
- The "Shuffled out (N)" button says whether the panel is open, and validation messages are read out when they appear.
- Write down what was heard (and any problems) in the PR or in docs/testing.md.
- Any problems found become their own UI fix tickets. This ticket only checks and records.

Possible Test Scenarios I would like to see:

When I Tab through the "Add back" cards with Narrator on, I hear each card's word, reading, picked state, meaning and deck

When I Tab through the "Take out of your deck" cards with Narrator on, I also hear the card number and "New" for new cards

When I press Add Back Cards with too few cards picked, Narrator reads out the validation message

Dependencies:
FEAT2_6 (PR #36) must be merged first.

Branch name Examples:
test/screen-reader-check
