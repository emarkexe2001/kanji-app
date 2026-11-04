Ticket Code:
TEST7

Ticket Type:
Test

Test Name: 
Set Up End-to-End Tests with Playwright

Origin:
Retro of FEAT5_1 (PR #60, 2026-11-04). Layout, sizes, focus rings, hover and press, forced colours and the device's light/dark setting can't be seen by the UI tests (jsdom has no layout or CSS). So every UI ticket has had an agent check them by hand with a one-off script that drives headless Chrome over CDP, and the results are pasted into the PR. For FEAT5_1 that script had to be rewritten, and it got two checks wrong at first (it read the hidden mini-card text as the tile's name, and read `transform` where Tailwind v4's `scale-*` sets the `scale` property). Nothing re-runs these checks later, so a change can break them without anyone noticing. Standards 4.1 already plans e2e tests in `apps/web/test/e2e/`, and standards 4.2 says the manual browser check "applies until e2e tests are set up".

Description:
As a developer I would like the browser checks that UI tests can't do (layout, sizes, focus, device settings) to be real tests that run in a real browser, on every pull request, so they are done the same way every time and a later change can't quietly break them.

Requirements / Expected Behaviours:
- Add Playwright (`@playwright/test`, the Node version; Python isn't installed) to `apps/web`, with a config that starts the app's dev or preview server itself and runs the tests against it.
- Tests live in `apps/web/test/e2e/` and are found by pattern, so a new test file runs without changing any scripts (standards 4.2).
- Add a script to run them, e.g. `npm run test:e2e`, and say in the PR whether `npm test` runs them too (see Questions).
- Run them in CI on every pull request, installing the browser in CI. A failing e2e test fails the PR.
- Port the FEAT5_1 browser checks as the first real tests, so they never have to be done by hand again:
  - the start page fits with no scrolling at 320×568, 360×640, 640×800 and 1024×768, with 168px-tall tiles and a 28px header, on light and dark devices
  - keyboard: nothing focused on load; Tab goes Light → Dark → the footer link; Enter / Space choose; focus moves to the colour mode button with a visible ring
  - the start page follows the device's light/dark setting live, saves nothing, and stops after choosing
  - broken saved values and blocked storage show the start page; a saved mode wins over the device
  - forced colours: the tiles have borders and the focus ring shows
  - hover changes the tile background; press scales it to 0.98
  - "Loading dictionary…" shows after choosing while the dictionary is still loading
  - no page errors in any of the above
- One quick "smoke" test of the main flow: the app opens with a saved mode, shows a card, and Next, Shuffle and Shuffle In Cards work.
- Find elements the way a user would (by role and accessible name, e.g. `getByRole('button', { name: 'Dark' })`), not by text that includes hidden decoration.
- Tests set up their own state (saved mode, device setting, viewport) and don't depend on each other or on run order.
- Failures save a screenshot and a trace, kept as a CI artifact, so a failure can be seen without re-running it.
- Keep the run fast: aim for under 2 minutes in CI.
- Update `docs/testing.md` ("End-to-end (e2e) tests": how to run them, how to install the browser locally, and how to debug a failure) and standards 4.2: layout and screen-size requirements now get e2e tests. The in-person check (standards 5.4) stays.
- The app's behaviour doesn't change.

Questions to agree before starting:
1. Which browsers? Recommended: Chromium only to start (fast, and it's what the manual checks used). Firefox and WebKit can be added later.
2. Should `npm test` run the e2e tests too? Recommended: no. Keep them as `npm run test:e2e` and a separate CI step, as they need a browser download and are slower.
3. Dev server or production build? Recommended: a production build with `vite preview`, the closest to what users get.
4. Too big for one PR? Possible split: TEST7 sets up Playwright, CI and the smoke test; TEST7_5 ports the FEAT5_1 checks.

Possible Test Scenarios I would like to see:

When I run `npm run test:e2e`, the app starts by itself and the e2e tests run in a real browser and pass

When I open a pull request, CI runs the e2e tests, and a failing e2e test fails the check

When an e2e test fails in CI, its screenshot and trace are saved where I can open them

When I add a new file to `apps/web/test/e2e/`, it runs without changing any scripts

When the start page is opened at 320×568 on a dark device, it fits with no scrolling and is in dark mode

When I Tab to the Dark tile and press Enter, Dark is saved and the colour mode button has a visible focus ring

When my device switches to dark on the start page, the page turns dark and nothing is saved

Break-and-restore check: remove `justify-center` from the start page, make a tile taller, or remove the focus ring style, and see the matching e2e test go red each time

Dependencies:
FEAT5_1 (PR #60, merged). UI2 can come before or after; if UI2 lands first, add an e2e test for it.

Branch name Examples:
test/playwright-e2e
