Ticket Code:
FEAT5

Feature Name: 
Colour Mode Menu and Dark Mode

Origin:
Requested 2026-10-22 while starting FEAT2_6. Split into two tickets on 2026-10-22: FEAT5 (start page, menu, Light and Dark) and FEAT5_5 (High contrast). Split again on 2026-10-30 after the mockup: FEAT5 is now the menu and Dark mode, and the first-visit start page moved to FEAT5_1.

Feature Description:
As a user I would like to switch between a light (white) and a dark mode from a small menu in the top left corner, and have the app remember my choice.

Feature Requirements / Expected Behaviours:
- Header (agreed option B): the header has two rows. The first row has the mode button in the top left and "Shuffled out (N)" in the top right (ADJ1). The title "Kanji Reading Highlighter" is on its own row below, on one line at every width from 320px up.
- Mode button (agreed): a sun icon and "Light ▾", or a moon icon and "Dark ▾", showing the mode that is on. It is 36px tall, like "Shuffled out (N)". Screen readers hear "Colour mode: Light" (or Dark) and that it opens a menu.
- Menu: pressing the button opens a small menu under it, headed "Colour mode", with Light (sun) and Dark (moon). The current mode has a tick. Choosing one switches the app straight away and closes the menu. Pressing outside the menu or Escape closes it.
- Switching is instant, with no fade (agreed).
- Light mode is the app as it looks today.
- Dark mode (agreed: slate) covers the whole app: header, deck, cards, Shuffled-out panel, controls and footer. The colours are as in the mockup: page #0f172a, cards and boxes #1e293b, borders #334155, text #f1f5f9, muted text #94a3b8.
- The colour coding still works in Dark mode:
  - Reading colours get brighter dark-mode versions: onyomi #64b5f6, kunyomi #f87171, okurigana #4ade80.
  - The pick outlines get brighter versions: add back #34d399, take out #fb7185.
  - The coloured buttons (Shuffled out, Deck Shuffle, Shuffle In Cards, Add Back Cards, red danger buttons), the JLPT headers, the ★ Common Word badge and the NEW ribbon keep today's colours.
  - Next becomes light with dark text; Back keeps an outline.
  - The colours come from the shared tokens in @kanji/core, with a version per mode where needed.
- Text contrast: every text colour in Dark mode is at least 4.5:1 (reading words and outlines at least 3:1). The mockup's contrast table lists the pairs.
- My choice is saved through the storage helper. If storage is blocked, the app still works and opens in Light next time.
- With no saved choice, the app opens in Light, as today. FEAT5_1 adds the start page for that case.
- No reload and no flash of the wrong mode when the app opens or the mode changes. The saved mode is applied before the first paint.
- The menu works with the keyboard: Enter, Space or Down arrow opens it, the arrow keys move between options, Enter or Space chooses, and Escape closes it and puts focus back on the button. The options are menu radio items, so screen readers hear which one is on.
- If the device itself is in forced-colours (Windows high contrast) mode, that still wins, as in FEAT2_6.
- The phone fit from ADJ2_5 still holds. At 360×640, with the Shuffled-out pop-up open, Deck Shuffle is still fully on screen. The header is 16px taller there, which was ADJ2_5's spare room.
- Everything else in the app stays the same.

Possible Test Scenarios I would like to see:

When I open the menu in the top left and choose Dark, the app switches straight away and the menu closes

When I open the menu, the current mode has a tick and the button says which mode is on

When I open the app again after choosing Dark, it opens in Dark with no flash of Light

When I open the app for the first time (nothing saved), it opens in Light

When I use the menu with the keyboard, I can open it, move between the modes, choose one, and close it with Escape (focus goes back to the button), and a screen reader hears which mode is on

When I press outside the open menu, it closes and nothing else changes mode

When storage is blocked, I can still switch modes and use the app (it opens in Light next time)

When Dark mode is on, the reading colours, pick outlines, JLPT headers, NEW ribbon and danger buttons can still be told apart, as in the mockup's contrast table

When the header is at 320px, the mode button, "Shuffled out (N)" and the one-line title all fit with nothing overlapping

Failure paths (see docs/testing.md - each one needs a UI test, and each test must be checked to fail when the code it covers is broken):

When the saved mode is broken or unknown, the app opens in Light instead of crashing

Layout check (see docs/standards/standards.md 4.2): look at the header, the open menu and both modes (including the open Shuffled-out panel and the phone pop-up) in a real browser at about 320px, 360px, 640px, 1024px and 1200px, and note it in the PR

Answers (agreed 2026-10-22):
- The mode menu goes in the top left corner of the header: a button that opens a small menu list with the modes. (First agreed as top right, changed to top left on 2026-10-22.)
- This ticket covers Light and Dark. High contrast (black with white text) is FEAT5_5.

Answers (agreed 2026-10-30, mockup: https://claude.ai/artifact/9bL6UuHdXmy4ePTUEp1JzC):
- Header: option B, two rows. Mode button top left, "Shuffled out (N)" top right, title on its own row below. With one row, the title wrapped even on desktop, and at 320px "Highlighter" ran under the Shuffled-out button.
- Mode button: icon plus the current mode's name ("Light ▾" or "Dark ▾").
- Dark mode palette: slate (dark blue-grey), not true black, so it is clearly different from High contrast.
- Switching is instant.
- The start page is split into its own ticket, FEAT5_1.

Dependencies:
FEAT2_6 and ADJ2_5 are merged. FEAT5_1 and FEAT5_5 build on this ticket.

Branch name Examples:
feature/colour-mode-menu-dark
