Ticket Code:
ADJ2

Ticket Type:
Adjustment (changes where or how existing UI is shown, not what it does)

Adjustment Name: 
Shuffled-Out Panel in the Top Left

Origin:
Requested 2026-10-22. Since ADJ1, pressing "Shuffled out (N)" opens the panel across the page just below the header and pushes the deck down. I would like it to open in the top left corner instead.

Adjustment Description:
As a user, when I press the "Shuffled out (N)" button I would like the shuffled-out cards panel to open in the top left corner of the screen.

Current Layout (after ADJ1):
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

Wanted Layout (draft - to be confirmed with a mockup):
```
┌───────────────────┐ Reading Highlighter  [Shuffled out (3)▴]
│ Add back [1][2]   │
│ Take out [1][2]   │   [Deck: JLPT N5 ▾]
│ [Add Back Cards]  │        [ card ] ...
│ [Clear List]      │
└───────────────────┘
```

Requirements / Expected Behaviours:
- When the "Shuffled out (N)" button is pressed, the panel opens in the top left corner of the screen. Pressing the button again closes it.
- The button itself stays where ADJ1 put it (top right, beside the title).
- Nothing about what the panel does changes: the count, picking cards, Add Back Cards, Clear List, Recover cleared list, the validation messages and the 100-card limit all stay the same.
- Keyboard and screen readers: the button still says whether the panel is open (aria-expanded), and focus order still goes button, then the panel when open, then the rest of the page.
- No sideways scrolling at phone width.

Possible Test Scenarios I would like to see:

When I press "Shuffled out (N)", the panel opens in the top left corner, and pressing it again closes it

When I add cards back from the panel in its new place, they are in my deck, the same as before

When I clear and recover the list from the panel in its new place, it works the same as before

When the panel is open, I can reach it with Tab straight after the button

Layout check (see docs/standards/standards.md 4.2): look at the open panel in a real browser at about 360px, 640px and 1024px and note it in the PR

Open Questions (to confirm before starting, with a mockup first - standards 5.1):
- Does the panel float over the page (like a pop-out, the deck stays where it is) or sit in the page on the left and push the deck to the right?
- How wide and tall is it? Should it scroll on its own if there are many cards, and how many cards per row then (today 2 on a phone, 3 on wider screens)?
- On a phone, where there is no room beside the deck, should it still open top left over the page, or fill the screen width as it does today?
- Does it close when I click outside it or press Escape, or only with the button? Does it need its own close (×) button?
- Should it slide in from the left, or appear instantly (and always instantly when reduced motion is on)?
- Does it sit below the header, or over it in the very corner of the screen?

Dependencies:
FEAT2_6 must be merged first, since both change the Shuffled-out cards view (shuffled-out-view.tsx). Do them one after another, not at the same time.

Branch name Examples:
feature/shuffled-out-panel-top-left
