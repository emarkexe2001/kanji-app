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
  Answer: Option A, the wide layout starts at 1100px (see Answers 1).
- On a phone, how should the deck card and controls fit with the panel open: shrink the deck card more, hide the Reading Breakdown while the panel is open, or let the panel be shorter?
  Answer: Option 1, a fixed 260px panel and a slim deck card (see Answers 2 and 3).

Mockup (approved): https://claude.ai/artifact/5sNaEq9KBjPu7nFHhRFVwW (Option A and Option 1 chosen)
Corrected mockup (approved 2026-10-29): https://claude.ai/artifact/M2tnxnosgqaXtchE3tfJMU (headless-Chrome screenshots of the slim card at 360x640 with a short and a long meaning, 640x360 and 768x1024). The first mockup drew the deck card 112px tall with nothing below it; the real card with only the Reading Breakdown hidden left Deck Shuffle 55px below a 360x640 screen, so the slim card was agreed.

Answers (agreed 2026-10-29):
1. Overlap (Option A): the wide layout, with the 300px panel floating beside the deck 24px from the right, starts at 1100px instead of 1024px. From 1024px to 1099px the phone/tablet-style pop-up is used, with the deck below it, the same as under 1024px before. (The deck column is 416px of content in a centred 448px max-w-md, so at 1100px there is an 18px gap.) The 1100px breakpoint is defined once for the code (WIDE_LAYOUT_MIN_WIDTH) and once for the styles (the Tailwind breakpoint `wide`, --breakpoint-wide), with comments on both and a test that checks they match. This covers requirement 6.
2. Phone and tablet (Option 1): below the wide breakpoint the panel has a fixed height of 260px, not a max-height that grows, so its lists scroll inside it. Picking a card, which makes the "Take out" list appear, doesn't change its height, and the deck card doesn't move (requirement 4). On a screen too short for it (e.g. 640x360 or shorter), the pop-up stops 8px above the bottom of the screen.
3. The slim card (replacing the 0.73 scale): while the panel is open below the wide breakpoint, the deck card hides the Reading Breakdown, the ★ Common Word badge, the "Full Word Meaning" label and the fanned card backs, at its normal size. The meaning is kept to one line, ending in … if longer. Screen readers still get the full meaning (it is only cut on screen), and the badge and label stay for them too. At 360x640 with the panel open, the deck card, ← Back | Next → and Deck Shuffle are all on screen without scrolling (Deck Shuffle ends at about 624px, also with a long meaning) (requirement 3). The cards that slide to and from the deck (ADJ3) match the slim card.
4. 640x360 landscape: it is fine that the panel covers the deck there; the user closes the panel or scrolls.
5. Tablet 768x1024: keep the fixed 260px. The open panel covering the right end of the Deck picker, and the gap above the deck card, are accepted as they are.
6. Requirement 2: the panel's top is measured from the header itself (its bottom edge plus 12px), and measured again when the header changes size (the title wrapping, fonts, text size, zoom) or the window is resized, instead of the 72px/92px offsets. The panel never covers "Shuffled out (N)", including at 150% zoom or with the title on three lines.
7. Requirement 5: a press that starts inside the panel and ends as a drag outside it doesn't make the next click outside get ignored.
8. Also from the ticket: tests for usePanelClearance's resize and cleanup behaviour, and class checks (with a comment) for the panel footer's top border and the 11px "New" ribbon on compact cards.
- Everything else from ADJ2 and ADJ3 stays the same, including the card slides to and from the panel and button at every width.

Dependencies:
ADJ3 must be merged first, since its card animations also work with the panel and the deck card's position.

Branch name Examples:
fix/floating-panel-fixes

Completed On:
2026-10-29
