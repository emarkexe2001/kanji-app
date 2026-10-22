Ticket Code:
FEAT5_5

Feature Name: 
High-Contrast Mode

Origin:
Split from FEAT5 on 2026-10-22. FEAT5 adds the start page, the mode menu and Light and Dark modes. This ticket adds a third mode, High contrast.

Feature Description:
As a user I would like a high-contrast mode, black with white text, that I can choose on the start page or from the mode menu, so the app is as easy as possible to read.

Feature Requirements / Expected Behaviours:
- High contrast is a third option on the start page and in the mode menu from FEAT5, next to Light and Dark.
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

Open Questions (to confirm with a mockup before starting - standards 5.1):
- Which bright colours to use for the reading colours, JLPT headers and pick colours on black (the mockup will show options)?
- Should the JLPT card headers keep their coloured backgrounds, or become black with a coloured outline and white text?

Dependencies:
FEAT5 must be merged first, since this adds an option to its start page and menu.

Branch name Examples:
feature/high-contrast-mode
