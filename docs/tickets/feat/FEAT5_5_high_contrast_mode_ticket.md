Ticket Code:
FEAT5_5

Feature Name: 
High-Contrast Mode

Origin:
Split from FEAT5 on 2026-10-22. FEAT5 adds the mode menu and Light and Dark modes, and FEAT5_1 adds the start page (split on 2026-10-30). This ticket adds a third mode, High contrast.

Feature Description:
As a user I would like a high-contrast mode, black with white text, that I can choose on the start page or from the mode menu, so the app is as easy as possible to read.

Feature Requirements / Expected Behaviours:
- High contrast is a third option on the start page (FEAT5_1) and in the mode menu (FEAT5), next to Light and Dark. The start page tile layout for three modes is decided here, with a mockup.
- High-contrast mode is black with white text across the whole app (header, start page, menu, deck, cards, Shuffled-out panel, controls and footer). Text has a contrast of at least 7:1, with no faint greys.
- Buttons, inputs, cards and picked cards have thick, clear white outlines, and focus outlines are always easy to see.
- The colour coding still works: the reading colours, JLPT headers, green/red pick colours, red danger buttons and the NEW ribbon use brighter versions that stay readable on black and can still be told apart, not by colour alone where it matters (e.g. the tick on picked cards stays).
- The choice is remembered the same way as in FEAT5.
- If the device itself is in forced-colours (Windows high contrast) mode, that still wins, as in FEAT2_6.
- Everything else from FEAT5 stays the same.

Possible Test Scenarios I would like to see:

When I choose High contrast on the start page, my cards are shown in high-contrast mode

When I choose High contrast from the menu, the app switches straight away and the menu marks it as the current mode

When I open the app again after choosing High contrast, it is still on and the start page is not shown

When I pick cards in the Shuffled-out panel in high-contrast mode, picked cards are clearly marked with an outline and a tick

Failure paths (see docs/testing.md - each one needs a UI test, and each test must be checked to fail when the code it covers is broken):

When a high-contrast colour token is missing, the app falls back to readable white on black instead of crashing or showing unreadable text

Layout check (see docs/standards/standards.md 4.2): look at high-contrast mode (start page, menu, deck and the open Shuffled-out panel) in a real browser at about 360px, 640px and 1024px and note it in the PR

Answers (agreed 2026-10-22):
- High contrast is black with white text.

Answers (agreed 2026-11-09, mockup: https://claude.ai/artifact/WJUn5xv9boPHhaGTkwe4kk, section "★ All recommended changes together"):
- Start page (option B): the Light and Dark tiles stay exactly as they are (168px tall). High contrast is a full-width tile underneath, 88px tall, with its preview (the same width as the others', 66px tall) on the left and its icon and name on the right. Tab goes Light, then Dark, then High contrast. The start page still fits at 320×568 and 360×640 with no scrolling.
- The High contrast preview shows "JLPT N5" on bright green with black text and 静か in the High contrast reading colours, on black with white outlines and no grey bars.
- Mode button: in High contrast it shows only the half-filled circle icon (◐ ▾) below 375px, and "◐ High contrast ▾" from 375px up, because the full name doesn't fit next to "Shuffled out (N)" on narrower phones. Screen readers always hear "Colour mode: High contrast". The Light and Dark labels don't change.
- Menu: High contrast is the third option, with the ◐ icon. When it is on, its row has a white outline and a tick.
- Colours (palette A, today's colours lightened, all at least 7:1 on black): onyomi #6cb8ff, kunyomi #ff8a8a, okurigana #5ce67c; JLPT N5 #3ee8a5, N4 #3dd9f5, N3 #a8b4ff, N2 #d4a8ff, N1 #ff9eb1, no level #d0d7e0; add back #5ce67c, take out #ff8a9e; danger #ff8a9e; NEW ribbon #ffd23f; ★ Common Word #ffc94d.
- All text is white on black, with no greys (including "Card 1 of 10", the reading in 【】, READING BREAKDOWN, "From JLPT", the card numbers and the footer).
- JLPT headers keep a coloured background, with black text.
- Coloured buttons (Shuffled out, Deck Shuffle, Shuffle In Cards, Add Back Cards, Recover cleared list) are black with a 2px outline in the button's colour and white text. Clear List has a red outline and red text. Next is white with black text. Back is black with a white outline.
- Outlines: cards and buttons 2px white, boxes 1px white, picked cards 3px in the pick colour. The tick is the pick colour with a black ✓ and a 2px black edge. All lines are drawn without changing any size, so every agreed fit still holds.
- No tinted backgrounds behind the Reading Breakdown notes; they keep their coloured left bar. The blank cards fanned behind the deck card get white outlines. There are no shadows.
- Focus: a 3px yellow (#ffff00) outline, 2px out. Picked-card focus is 2px yellow, 5px out.
- Hover: black controls fill with #262626, and Next turns #d4d4d4. The small press-in stays.
- The choice is saved the same way as Light and Dark (FEAT5) and applied before the page is first drawn.
- The app does not switch to High contrast on its own when the device asks for more contrast (prefers-contrast). It's only chosen on the start page or from the menu.
- In the device's forced-colours (Windows high contrast) mode, the device's colours still win, as in FEAT2_6.
- Disabled controls (agreed 2026-11-09): in High contrast they don't fade (no opacity). They get a 2px dashed white outline and white text (21:1), e.g. Shuffle In Cards with nothing to shuffle in from, a disabled "Shuffle in from" option, and the − / + buttons at the card limit's ends.
- Filled in from the agreed rules (agreed 2026-11-09, not drawn in the mockup): "Recover cleared list (N)" gets the blue outline like "Shuffled out (N)", and warning text (e.g. ticked decks that are gone) is #ffd23f.

Dependencies:
FEAT5 and FEAT5_1 must be merged first, since this adds an option to the menu and the start page.

Branch name Examples:
feature/high-contrast-mode
