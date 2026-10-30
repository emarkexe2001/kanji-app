Ticket Code:
FEAT5_1

Feature Name: 
Colour Mode Start Page (First Visit)

Origin:
Split from FEAT5 on 2026-10-30, after the mockup. FEAT5 adds the top-left mode menu and Dark mode. This ticket adds the page that asks for a mode the first time the app is opened.

Feature Description:
As a user I would like to choose between Light and Dark when I first open the app, on its own page before the cards load. After that, the app opens straight to my cards, and I can change the mode from the top-left menu.

Feature Requirements / Expected Behaviours:
- The first time I open the app (no saved mode), a start page is shown instead of the deck and cards.
- Start page layout (agreed: preview tiles):
  - The usual header with the title only. There is no mode button or "Shuffled out (N)", as no cards are loaded yet.
  - The heading "Choose how the app looks" and the line "You can change this any time from the menu in the top left."
  - Two large buttons side by side, Light (sun) and Dark (moon). Each shows a mini card in that mode.
  - The usual footer.
- Start page colours (agreed): it follows the device's setting (dark if the device prefers dark, otherwise light). Nothing is saved until I choose a tile.
- When I choose a tile, the mode is saved through the storage helper. The app then shows my cards in that mode straight away, with no reload.
- After that, the start page isn't shown again. The app opens straight to my cards in the mode I chose (FEAT5).
- If storage is blocked, I can still choose a mode and use the app. The start page is shown again next time.
- If the saved mode is broken or unknown, the start page is shown instead of the app crashing.
- The tiles are real buttons that work with the keyboard and screen readers, with names like "Light" and "Dark".
- The start page fits at 320×568 and 360×640 without scrolling.
- Everything else in the app stays the same.

Possible Test Scenarios I would like to see:

When I open the app for the first time, the start page asks me to choose a mode and no cards are shown yet

When I choose Dark on the start page, my cards are shown in dark mode

When I choose Light on the start page, my cards are shown and the app looks as it does today

When I open the app again after choosing, the start page is not shown and my chosen mode is on

When my device prefers dark mode, the start page is shown in Dark colours, and nothing is saved until I choose

When storage is blocked, I can still choose a mode and use the app (the start page shows again next time)

When I use the start page with the keyboard, I can reach both tiles with Tab and choose one with Enter or Space

Failure paths (see docs/testing.md - each one needs a UI test, and each test must be checked to fail when the code it covers is broken):

When the saved mode is broken or unknown, the start page is shown instead of the app crashing

Layout check (see docs/standards/standards.md 4.2): look at the start page in both colour schemes in a real browser at about 320px, 360px, 640px and 1024px, and note it in the PR

Answers (agreed 2026-10-30, mockup: https://claude.ai/artifact/9bL6UuHdXmy4ePTUEp1JzC):
- Layout: two preview tiles side by side (not stacked rows).
- Colours before choosing: follow the device's setting.
- When High contrast arrives (FEAT5_5), it becomes a third tile. The tile layout for three is decided in FEAT5_5.

Dependencies:
FEAT5 (mode menu and Dark mode) must be merged first.

Branch name Examples:
feature/colour-mode-start-page
