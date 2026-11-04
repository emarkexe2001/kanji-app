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

Answers (agreed 2026-11-03, mockup version 15: https://claude.ai/artifact/9bL6UuHdXmy4ePTUEp1JzC):
- Position: the heading, the line and the two tiles sit in the middle of the space between the header and the footer.
- Tiles: 168px tall at every width (138px wide at 320px, 158px at 360px, 202px from 640px). The start page fits with no scrolling at 320×568 and 360×640, in both colour schemes.
- The mini card on each tile shows "JLPT N5" and 静か in that mode's colours, with no 【reading】 (it didn't fit at 320px). The previews always show their own mode's colours, whatever the device uses.
- Neither tile is marked as matching the device, and neither looks chosen before I choose.
- Tile looks: a grey fill under the pointer, the same focus ring as the colour mode button when using the keyboard, a small press-in when pressed, and a visible border in high-contrast mode.
- Nothing is focused when the page opens. Tab goes Light, then Dark, then the footer links.
- After I choose, focus moves to the colour mode button in the top left, so a screen reader says the mode I chose.
- Screen readers hear the heading "Choose how the app looks" and two buttons, "Light" and "Dark". The previews and icons are hidden from them.
- After I choose, the full header (the mode menu and "Shuffled out (N)") and my cards appear straight away, with no reload.
- If my device switches between light and dark while the start page is open, the start page follows it. Nothing is saved until I choose.
- The start page opens in the device's colours straight away, with no flash of the wrong colours.
- The word deck loads in the background while the start page is open. If it is still loading after I choose, "Loading dictionary…" shows as usual.
- Choosing a mode switches the colours at once, with no fade.
- There is no animation on the start page.
- A broken or unknown saved mode is treated as nothing saved: the start page shows in the device's colours. If storage is blocked, my choice works until I close the page, and the start page shows again next time.
- Fix found during the mockup: on a first visit to today's app, a device set to dark still got Light, because "nothing saved" was treated as Light. Now, when nothing is saved, the app uses the device's setting (in index.html before the page is first drawn, and in the app).

Answers (agreed 2026-11-03, after the start page was built):
- In high-contrast (forced colours) mode, the mini previews take the system colours and can look the same. The tile names and icons tell them apart. This is left as is; High contrast is FEAT5_5.
- If the device switches between light and dark while the start page is open, the colours change at once, with no fade, like choosing a tile.

Dependencies:
FEAT5 (mode menu and Dark mode) must be merged first.

Branch name Examples:
feature/colour-mode-start-page

Completed On:
2026-11-03 (PR #60)
