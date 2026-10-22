Ticket Code:
FEAT5

Feature Name: 
Colour Mode Start Page and Menu (Light and Dark)

Origin:
Requested 2026-10-22 while starting FEAT2_6. Split into two tickets on 2026-10-22: FEAT5 (start page, menu, Light and Dark) and FEAT5_5 (High contrast).

Feature Description:
As a user I would like to choose between a light (white) and a dark (black) mode when I first open the app, on its own page before the cards load, and afterwards switch freely from a small menu in the top right corner.

Feature Requirements / Expected Behaviours:
- Start page: the first time I open the app, a separate page asks me to choose a mode (Light or Dark) before the deck and cards are shown. Once I choose, the app opens with my cards in that mode.
- After that, the start page isn't shown again: the app opens straight to my cards in the mode I chose.
- Menu: a button in the top right corner of the header opens a small menu listing the modes. Choosing one switches the app straight away and closes the menu. The current mode is marked in the list.
- Light mode is the app as it looks today.
- Dark mode uses a black/dark background with white/light text across the whole app (header, deck, cards, Shuffled-out panel, controls and footer).
- The colour coding still works in both modes: the reading colours (onyomi, kunyomi, okurigana), the JLPT header colours, the green/red pick colours, red danger buttons and the NEW ribbon can still be told apart, and text on them stays readable. The colours come from the shared tokens in @kanji/core, with a version per mode where needed.
- My choice is saved through the storage helper. If storage is blocked, the app still works (the start page is shown again next time).
- No reload and no flash of the wrong mode when the app opens or the mode changes.
- The menu button and menu work with the keyboard (open, move between options, choose, Escape to close) and tell screen readers which mode is on.
- If the device itself is in forced-colours (Windows high contrast) mode, that still wins, as in FEAT2_6.
- Everything else in the app stays the same.

Possible Test Scenarios I would like to see:

When I open the app for the first time, the start page asks me to choose a mode and no cards are shown yet

When I choose Dark on the start page, my cards are shown in dark mode

When I choose Light on the start page, my cards are shown and the app looks as it does today

When I open the app again after choosing, the start page is not shown and my chosen mode is on

When I open the menu in the top right and choose another mode, the app switches straight away and the menu closes

When I open the menu, the current mode is marked

When I use the menu with the keyboard, I can open it, choose a mode and close it with Escape, and a screen reader hears which mode is on

When storage is blocked, I can still choose a mode and use the app (the start page shows again next time)

Failure paths (see docs/testing.md - each one needs a UI test, and each test must be checked to fail when the code it covers is broken):

When the saved mode is broken or unknown, the start page is shown instead of the app crashing

Layout check (see docs/standards/standards.md 4.2): look at the start page, the menu and both modes (including the open Shuffled-out panel) in a real browser at about 360px, 640px and 1024px and note it in the PR

Answers (agreed 2026-10-22):
- The mode menu goes in the top right corner of the header: a button that opens a small menu list with the modes.
- The mode is chosen by the user on a separate start page before the cards load. After that, the user changes it freely from the menu.
- This ticket covers Light and Dark. High contrast (black with white text) is FEAT5_5.

Open Questions (to confirm with a mockup before starting - standards 5.1):
- The top right already has "Shuffled out (N)" (ADJ1). Does the mode button go in the very corner with "Shuffled out (N)" to its left? On a narrow phone, what happens if the title and both buttons don't fit?
- What does the menu button show: a word (e.g. "Mode ▾"), the current mode's name, or an icon (with a screen reader label)?
- What does the start page look like: the app title, a short line like "Choose how the app looks", and a large button per mode showing a small preview of it?
- Should switching modes fade or change instantly (always instantly when reduced motion is on)?

Dependencies:
FEAT2_6 should be merged first, since it adds the forced-colours styling for picked cards and the shared NEW ribbon colour token. ADJ2 also changes the header area, so do these one after another, not at the same time.

Branch name Examples:
feature/colour-mode-toggle
