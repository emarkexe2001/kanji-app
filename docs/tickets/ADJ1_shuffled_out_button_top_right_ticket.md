Ticket Code:
ADJ1

Ticket Type:
Adjustment (changes where or how existing UI is shown, not what it does)

Adjustment Name: 
Shuffled-Out Button in the Top Right

Origin:
Testing FEAT2_5 (PR #27, 2026-10-21). The "Shuffled out (N)" button sits low on the page under Shuffle In Cards. I would like it in the top right of the app, next to the title, so it's easy to find.

Adjustment Description:
As a user I would like the "Shuffled out (N)" button at the top right of the app, beside the title, and its panel to open just below the header.

Current Layout:
```
Kanji Reading Highlighter
[Deck: JLPT N5 ▾]
        Card 1 of 20
     [ card ]
[🔀 Deck Shuffle] [Next →]
[ 1 ] [Shuffle In Cards]
[Shuffled out (3)]          <- here now
Card limit [ - 20 + ]
```

Wanted Layout (agreed 2026-10-21):
```
Kanji Reading Highlighter  [Shuffled out (3)]   <- top right, same row as the title
[Deck: JLPT N5 ▾]
        Card 1 of 20
     [ card ]
[🔀 Deck Shuffle] [Next →]
[ 1 ] [Shuffle In Cards]
Card limit [ - 20 + ]
```

When the button is pressed, the panel (the shuffled-out cards, the "Take out of your deck" cards, Add Back Cards and Clear List) opens in the page just below the header and pushes the deck down. Pressing the button again closes it.
```
Kanji Reading Highlighter  [Shuffled out (3)▴]
┌──────────────────────────────────┐
│ Add back  [1][2][3]              │
│ Take out  [1][2][3]              │
│ [Add Back Cards]                 │
└──────────────────────────────────┘
[Deck: JLPT N5 ▾]
     [ card ] ...
```

Requirements / Expected Behaviours:
- The "Shuffled out (N)" button is in the top right of the header, on the same row as the app title
- Its panel opens below the header, above the deck picker, and pushes the rest of the page down
- The button is removed from its old place under Shuffle In Cards
- Nothing about what the button and panel do changes: the count, picking, Add Back Cards, Clear List, the validation messages, the 100-card limit and the wider panel on bigger screens from FEAT2_5 all stay the same
- Keyboard and screen readers: the button is still reached with Tab, still says whether the panel is open (aria-expanded), and focus order follows the new layout (button, then the panel when open, then the deck)
- No sideways scrolling at phone width

Possible Test Scenarios I would like to see:

When I open the app, the "Shuffled out (N)" button is in the header next to the title, and not under Shuffle In Cards

When I press the button, the panel opens below the header and above the deck, and pressing it again closes it

When I add cards back from the panel in its new place, they are in my deck, the same as before

Layout check (see docs/standards/standards.md 4.2): look at the header and open panel in a real browser at about 360px, 640px and 1024px and note it in the PR

Open Questions (to confirm before starting, per PROC3):
- On a narrow phone, if the title and the button don't fit on one row, what should happen: the title wraps onto two lines, the button gets a shorter label (e.g. "Out (3)"), or the button moves under the title on the right?

Dependencies:
FEAT2_5 (PR #27) must be merged first. FEAT2_6, FEAT2_7 and ADJ1 all change the Shuffled-out cards view, so they should be done one after another, not at the same time.

Branch name Examples:
feature/shuffled-out-button-top-right
