Ticket Code:
TEST7_5

Ticket Type:
Test

Test Name: 
Turn the FEAT5_1 Start Page Browser Checks into E2E Tests

Origin:
Split from TEST7 on 2026-11-05. TEST7 sets up Playwright, CI and a smoke test. This ticket ports the checks the FEAT5_1 agent did by hand in headless Chrome (PR #60), so they never have to be done by hand again.

Description:
As a developer I would like the start page's layout, keyboard, device-setting and forced-colours checks to be e2e tests, so a later change can't quietly break them and nobody has to re-run a one-off script.

Requirements / Expected Behaviours:
- Port the FEAT5_1 browser checks as e2e tests in `apps/web/test/e2e/`, using TEST7's setup and shared helpers:
  - the start page fits with no scrolling at 320×568, 360×640, 640×800 and 1024×768, with 168px-tall tiles and a 28px header, on light and dark devices
  - keyboard: nothing focused on load; Tab goes Light → Dark → the footer link; Enter and Space both choose; focus moves to the colour mode button with a visible ring
  - the start page follows the device's light/dark setting live, saves nothing, and stops following it after a mode is chosen
  - broken saved values and blocked storage show the start page; a saved mode wins over the device setting
  - forced colours: the tiles have borders and the focus ring shows
  - hover changes the tile background; pressing scales it to 0.98 (read the `scale` property, as Tailwind v4's `scale-*` sets `scale`, not `transform`)
  - "Loading dictionary…" shows after choosing while the dictionary is still loading
  - no page errors in any of the above
- Take the expected sizes from the FEAT5_1 ticket and the current code, and check them against the real app before writing the tests. If they don't match, stop and ask.
- Find elements by role and accessible name (e.g. `getByRole('button', { name: 'Dark' })`), not by text that includes the hidden mini-card text.
- Tests set up their own state and don't depend on each other or on run order.
- Keep the e2e CI job under 2 minutes in total.
- Update standards 4.2: the manual browser check for layout and screen-size requirements is replaced by e2e tests. The in-person check (standards 5.4) stays.
- Update `docs/testing.md` with what the start page e2e tests cover.
- The app's behaviour doesn't change.

Questions / Clarifications:
(Check this ticket against docs/standards/standards.md before starting.)

Possible Test Scenarios I would like to see:

When the start page is opened at 320×568 on a dark device, it fits with no scrolling and is in dark mode

When the start page is opened at each of the four sizes, on light and dark devices, it fits with no scrolling, the tiles are 168px tall and the header is 28px

When I Tab to the Dark tile and press Enter, Dark is saved and the colour mode button has a visible focus ring

When I press Space on the Light tile, Light is saved

When my device switches to dark on the start page, the page turns dark and nothing is saved

When I have chosen a mode and my device then switches, the app stays in the mode I chose

When the saved mode is broken or storage is blocked, the start page is shown

When forced colours are on, the tiles have borders and the focus ring shows

When I hover a tile its background changes, and when I press it, it scales to 0.98

When I choose a mode while the dictionary is still loading, "Loading dictionary…" is shown

Break-and-restore check: remove `justify-center` from the start page, make a tile taller, or remove the focus ring style, and see the matching e2e test go red each time

Dependencies:
TEST7 (Playwright set up, merged). UI2 can come before or after; if UI2 lands first, add an e2e test for it.

Branch name Examples:
test/start-page-e2e
