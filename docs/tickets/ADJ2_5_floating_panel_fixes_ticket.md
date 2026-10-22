Ticket Code:
ADJ2_5

Ticket Type:
Adjustment (changes where or how existing UI is shown, not what it does)

Adjustment Name: 
Floating Shuffled-Out Panel Fixes

Origin:
Peer review of ADJ2 (PR #40, merged 2026-10-22). The review found no must-fix problems but listed several should-fix items. They are collected here, to be done after ADJ3.

Adjustment Description:
As a user I would like the floating Shuffled-out panel from ADJ2 to never cover the deck controls or the "Shuffled out (N)" button, and on a phone I would like Next and Deck Shuffle to stay on screen while the panel is open.

Requirements / Expected Behaviours:
1. No overlap with the deck controls: on screens about 1024px to 1064px wide, the 300px panel covers about 20px of the right end of Next → and Shuffle In Cards when it is tall enough to reach them. The panel must not cover any deck control or the deck card at any width (e.g. switch to the wide layout from about 1072px instead of 1024px, or make the panel narrower; to be decided with a mockup).
2. Panel sits below the header whatever its height: the panel's top position is fixed in pixels (72px, or 92px below 640px), assuming the header's height. With large text, browser zoom or a title that wraps onto three lines, the panel could cover the "Shuffled out (N)" button. The panel always opens just below the header, measured from the header itself.
3. Phone deck controls stay on screen: while the panel is open on a phone, the shrunk deck card still takes its full height, so Next and Deck Shuffle can be pushed below the screen. With the panel open at about 360×640, the deck card, Next and Deck Shuffle can all be seen without scrolling.
4. No jumping while picking: on a phone, picking a card to add back makes the "Take out" list appear and the panel grow, which moves the deck card while I am picking. The deck card stays still while the panel is open.
5. A press that starts inside the panel and ends as a drag outside it doesn't cause the next click outside the panel to be ignored.
6. The breakpoint used in code for the wide layout matches the one used in the styles (one shared value, or a comment saying they must stay in sync).
- Everything else from ADJ2 stays the same.

Possible Test Scenarios I would like to see:

When the panel is open at 1024px and 1064px wide, it does not cover Next, Deck Shuffle, Shuffle In Cards or the deck card

When the header is taller (e.g. the title wraps onto three lines), the panel still opens just below it and does not cover "Shuffled out (N)"

When the panel is open on a 360×640 phone, the deck card, Next and Deck Shuffle are all on screen

When I pick a card to add back on a phone and the panel grows, the deck card does not move

When I resize the window with the panel open, it stays below the header and the deck adjusts

When I press inside the panel, drag outside and let go, the next click outside still closes the panel

Also add tests for:
- the resize and cleanup behaviour of the hook that keeps the deck below the pop-up (usePanelClearance)
- the footer's top border and the 11px "New" ribbon on compact cards (class checks with a comment), or remove those claims

Layout check (see docs/standards/standards.md 4.2 and 5.4): in a real browser at about 360px, 640px, 1024px and 1064px, with browser zoom at 150% and with the panel open, and note it in the PR

Open Questions (to confirm with a mockup before starting - standards 5.1):
- For the overlap at 1024-1064px: use the phone-style pop-up up to about 1072px, make the panel narrower (e.g. 280px), or something else?
- On a phone, how should the deck card and controls fit with the panel open: shrink the deck card more, hide the Reading Breakdown while the panel is open, or let the panel be shorter?

Dependencies:
ADJ3 must be merged first, since its card animations also work with the panel and the deck card's position.

Branch name Examples:
fix/floating-panel-fixes
