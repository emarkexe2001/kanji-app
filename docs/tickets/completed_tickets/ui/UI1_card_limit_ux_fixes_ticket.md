Ticket Code:
UI1

Feature Name: 
Card Limit UX Fixes

Origin:
Retro of PR #1 (feature/card-limit). Three issues with the card limit control:
1. It still shows "of 17,400 words" - the UI standards say the total number of cards should be hidden from the user
2. The limit is applied on every keystroke, so typing "150" briefly changes the deck to 1 card, then 15, then 150
3. If the user leaves the field with an invalid value, the box keeps showing it while the deck still uses the old limit

Feature Description:
As a user I would like the card limit control to only show what I need, to only change my deck once I have finished typing, and to never show a number that doesn't match my deck.

Feature Requirements / Expected Behaviours:
Remove the "of N words" text under the Card limit label
The typed card limit is applied when I press Enter or leave the field, not on every keystroke
The - / + buttons still apply straight away
If I leave the field with an invalid value, the validation message is shown and the field goes back to the current card limit
Validation messages from the selectable-card_limit ticket stay the same

Possible Test Scenarios I would like to see:

The total number of available words is not shown anywhere in the UI

When I type 150 and press Enter, the deck goes straight to 150 cards without passing through 1 or 15

When I type 0 and leave the field, a validation message is shown and the field goes back to the previous card limit

When I press + or -, the card limit changes straight away

Dependencies:
TEST1 (UI tests for these scenarios)

Branch name Examples:
fix/card-limit-ux

Completed On:
2026-10-15 (PR #14)
