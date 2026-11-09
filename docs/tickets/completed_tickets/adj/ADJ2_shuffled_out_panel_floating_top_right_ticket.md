Ticket Code:
ADJ2

Ticket Type:
Adjustment (changes where or how existing UI is shown, not what it does)

Adjustment Name: 
Floating Shuffled-Out Panel in the Top Right

Origin:
Requested 2026-10-22. Since ADJ1, pressing "Shuffled out (N)" opens the panel across the page just below the header and pushes the deck down. I would like it to float in the top right instead, so the deck stays in the centre and can always be seen.

Adjustment Description:
As a user, when I press the "Shuffled out (N)" button I would like the shuffled-out cards panel to float in the top right, just below the header, while my deck stays in the centre and stays visible.

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

Wanted Layout, wider screens (draft - sizes to be confirmed with a mockup):
```
[Mode ▾] Kanji Reading Highlighter        [Shuffled out (3)▴]
                                       ┌──────────────────[×]┐
[Deck: JLPT N5 ▾]                      │ Add back  [1][2][3]  │
         Card 1 of 20                  │ Take out  [1][2][3]  │
        [  card  ]                     │ [Add Back Cards]     │
                                       │ [Clear List]         │
[Deck Shuffle] [Next →]                └──────────────────────┘
```

Wanted Layout, phone (draft - sizes to be confirmed with a mockup):
```
[Mode ▾] Kanji Reading...  [Shuffled out (3)▴]
               ┌────────────────[×]┐
   [ card ]    │ Add back [1][2]   │   <- smaller pop-up menu
  (smaller)    │ [Add Back Cards]  │
               └───────────────────┘
```

Requirements / Expected Behaviours:
- When the "Shuffled out (N)" button is pressed, the panel floats in the top right, slightly below the header. It floats over the page: it doesn't push the deck down or sideways.
- The deck always stays in the centre of the page.
- The panel isn't too tall or too wide, so the deck can always be seen while it is open. If it has more cards than fit, the panel scrolls by itself.
- The cards in the panel are slightly smaller than the card in the deck, so more of them fit and the panel is easier to look through.
- On a phone the panel is a smaller pop-up menu. While it is open, the deck card gets smaller so both can be seen, and the cards in the panel are smaller too. The deck goes back to its normal size when the panel closes.
- The panel closes when I press its × button, press Escape, click or tap outside it, or press "Shuffled out (N)" again.
- Opening: with reduced motion on, the panel appears instantly. Otherwise it slides down from the top right, like a deck being dealt.
- The "Shuffled out (N)" button stays where ADJ1 put it (top right, beside the title).
- Nothing about what the panel does changes: the count, picking cards, Add Back Cards, Clear List, Recover cleared list, the validation messages and the 100-card limit all stay the same.
- Keyboard and screen readers: the button still says whether the panel is open (aria-expanded), the × button has a label (e.g. "Close shuffled-out cards"), focus goes to the panel when it opens and back to the button when it closes.
- No sideways scrolling at phone width.
- The card animations (cards sliding between the deck and the panel) are a separate ticket, ADJ3.

Possible Test Scenarios I would like to see:

When I press "Shuffled out (N)", the panel opens in the top right and the deck stays in the centre and is still shown

When I press the × button, the panel closes and focus goes back to "Shuffled out (N)"

When I press Escape, the panel closes

When I click outside the panel, it closes

When I click inside the panel (e.g. picking a card), it stays open

When I press "Shuffled out (N)" again, the panel closes

When reduced motion is on, the panel appears without sliding

When I open the panel on a phone, the deck card gets smaller, and it goes back to normal when I close the panel

When I add cards back from the panel in its new place, they are in my deck, the same as before

When I clear and recover the list from the panel in its new place, it works the same as before

Layout check (see docs/standards/standards.md 4.2): look at the open panel in a real browser at about 360px, 640px and 1024px, check the deck can always be seen, and note it in the PR

Answers (agreed 2026-10-22):
- The panel floats on the right (top right), slightly below the header. The deck always stays in the centre.
- The panel isn't too tall or wide, so the deck can be seen at all times. Its cards are slightly smaller than the deck card.
- On a phone it is a smaller pop-up menu, the deck card gets smaller while it is open, and the cards in the panel are smaller too.
- It closes on its own when I click outside it, press Escape or press the × button.
- It appears instantly when reduced motion is on; otherwise it slides down from the top right like a deck.
- The panel is top right, not top left. (The FEAT5 mode menu is top left.)
- Cards sliding between the deck and the panel are a separate ticket (ADJ3).

Open Questions (to confirm with a mockup before starting - standards 5.1):
- Exact sizes: how wide and tall the panel is on phone, tablet and desktop, how much smaller its cards are, and how much smaller the deck card gets on a phone.
- How many cards per row in the panel (today 2 on a phone and 3 on wider screens)?
- When the panel closes (× / Escape / clicking outside) with cards picked but not added back, the picks are dropped, as today. Is that OK, or should they be kept until the page is reloaded?
- Does the "Are you sure?" Clear List confirmation stay inside the panel as today?

Answers (agreed 2026-10-22, from the mockup):
- Desktop (from the lg breakpoint, 1024px, up): the panel floats over the page (position: fixed) in the top right, just below the header (top about 72px, right about 24px). It is 300px wide and at most about 560px tall (never taller than the screen minus some margin), a sky-50 panel with a sky-200 border, rounded corners and a large shadow. Its title row says "Shuffled-out cards" with a × close button ("Close shuffled-out cards"). The card lists scroll inside the panel, 2 compact cards per row, slightly smaller than before (about 16px word, 9-11px other text). The deck doesn't move: it stays centred in its column and nothing is pushed down.
- The Add Back Cards (green) and Clear List (red) buttons are pinned side by side at the bottom of the panel, so they are always visible.
- When the panel closes (×, Escape, clicking or tapping outside, or pressing "Shuffled out (N)" again) with cards picked but not added back, the picks are dropped, as today.
- The phone pop-up is approved as shown in the mockup.
- Below 1024px (phones and tablets) a 300px panel would cover the deck card, so the panel is a smaller pop-up there: about 300px wide (never wider than the screen minus 16px), about 380px tall, about 8px from the right, just below the header, with smaller cards again (about 14px word, 8-10px other text), 2 per row and the buttons pinned at the bottom. While it is open the deck card gets smaller (about 240px wide) and sits below the pop-up, so both are fully visible; it goes back to normal when the panel closes.
- The "Are you sure?" Clear List confirmation and "Recover cleared list" stay inside the panel.

Dependencies:
FEAT2_6 must be merged first, since both change the Shuffled-out cards view (shuffled-out-view.tsx). Do them one after another, not at the same time. ADJ3 builds on this ticket.

Branch name Examples:
feature/floating-shuffled-out-panel

Completed On:
2026-10-22
