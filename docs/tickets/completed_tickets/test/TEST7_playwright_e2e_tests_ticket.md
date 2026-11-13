Ticket Code:
TEST7

Ticket Type:
Test

Test Name: 
Set Up End-to-End Tests with Playwright

Origin:
Retro of FEAT5_1 (PR #60, 2026-11-04). Layout, sizes, focus rings, hover and press, forced colours and the device's light/dark setting can't be seen by the UI tests (jsdom has no layout or CSS). So every UI ticket has had an agent check them by hand with a one-off script that drives headless Chrome over CDP, and the results are pasted into the PR. For FEAT5_1 that script had to be rewritten, and it got two checks wrong at first (it read the hidden mini-card text as the tile's name, and read `transform` where Tailwind v4's `scale-*` sets the `scale` property). Nothing re-runs these checks later, so a change can break them without anyone noticing. Standards 4.1 already plans e2e tests in `apps/web/test/e2e/`, and standards 4.2 says the manual browser check "applies until e2e tests are set up".

This ticket sets up Playwright, CI and one smoke test. Porting the FEAT5_1 start-page checks is TEST7_5 (split on 2026-11-05, see Questions / Clarifications).

Description:
As a developer I would like the browser checks that UI tests can't do (layout, sizes, focus, device settings) to be real tests that run in a real browser, on every pull request, so they are done the same way every time and a later change can't quietly break them.

Requirements / Expected Behaviours:
- Add Playwright (`@playwright/test`, the Node version; Python isn't installed) to `apps/web`, using Chromium only.
- The Playwright config builds the app and serves the production build with `vite preview`, starting the server itself and running the tests against it.
- Tests live in `apps/web/test/e2e/` and are found by pattern, so a new test file runs without changing any scripts (standards 4.2).
- Add `npm run test:e2e` to run them. `npm test` does not run them.
- Run them in CI on every pull request, as their own job (separate from "Typecheck and test"), installing Chromium in CI. A failing e2e test fails that job. The PR says that after merging, the user adds the new job as a required check in branch protection, so a failing e2e test blocks the merge.
- One quick "smoke" test of the main flow: the app opens with a saved mode, shows a card, and Next, Deck Shuffle and Shuffle In Cards work, with no page errors.
- Find elements the way a user would (by role and accessible name, e.g. `getByRole('button', { name: 'Next' })`), not by text that includes hidden decoration.
- Tests set up their own state (saved mode, device setting, viewport) and don't depend on each other or on run order. Add a small shared helper for this setup (e.g. saving a colour mode before the page loads) so TEST7_5 can reuse it.
- Failures save a screenshot and a trace, kept as a CI artifact, so a failure can be seen without re-running it.
- Keep the run fast: aim for under 2 minutes for the e2e CI job.
- Playwright's output folders (test results, reports) are ignored by git, ESLint and Prettier.
- Update `docs/testing.md` ("End-to-end (e2e) tests": how to run them, how to install the browser locally, and how to debug a failure, including opening a trace from a CI artifact).
- Update standards 4.1 and 4.2 so they no longer say e2e tests are "when added", and say that layout and screen-size requirements get e2e tests. The manual browser check in 4.2 stays until TEST7_5 is merged, and the in-person check (standards 5.4) stays.
- The app's behaviour doesn't change.

Questions / Clarifications:
1. Which browsers?
   Answer (agreed 2026-11-05): Chromium only to start. It's fast, it's what the manual checks used, and it supports forced-colours emulation. Firefox and WebKit can be added in a later ticket.
2. Should `npm test` run the e2e tests too?
   Answer (agreed 2026-11-05): No. They run with `npm run test:e2e` and as their own CI job, because they need a browser download and are slower. The new CI job becomes a required check in branch protection, so a failing e2e test blocks the merge. The user changes that setting after this PR is merged.
3. Dev server or production build?
   Answer (agreed 2026-11-05): A production build served with `vite preview`, the closest to what users get.
4. Is this too big for one PR?
   Answer (agreed 2026-11-05): Yes, split it. TEST7 sets up Playwright, CI, the failure artifacts, the docs and the smoke test. TEST7_5 ports the FEAT5_1 start-page checks once TEST7 is merged.
5. What does the e2e CI job do on docs-only pull requests (CI2)?
   Answer (agreed 2026-11-11): It skips, but still reports. Like "Typecheck and test", the job always starts and passes, but it skips the build, the browser install and the Playwright run on a docs-only PR (using the same `scripts/docs-only-changes.ts` rule with step `if:`s, not `paths-ignore`). It becomes a required check after merging, so it must report on every PR. Pushes to main always run it.

Possible Test Scenarios I would like to see:

When I run `npm run test:e2e`, the app is built and started by itself, and the e2e tests run in Chromium and pass

When I run `npm test`, the e2e tests don't run

When I open a pull request, CI runs the e2e tests in their own job, and a failing e2e test fails that job

When an e2e test fails in CI, its screenshot and trace are saved as an artifact I can download and open

When I add a new file to `apps/web/test/e2e/`, it runs without changing any scripts

When the app opens with a saved colour mode, a card is shown, and Next, Deck Shuffle and Shuffle In Cards each change the card on screen, with no page errors

Break-and-restore check: make Next do nothing, or throw an error on page load, and see the smoke test go red each time. Push a branch with a failing e2e test once, to show the CI job goes red and saves the artifact (then remove it)

Dependencies:
FEAT5_1 (PR #60, merged). Start after TEST6 is merged, as both change `apps/web/package.json` and `docs/testing.md`. TEST7_5 depends on this ticket.

Branch name Examples:
test/playwright-e2e

Completed On:
2026-11-13 (PR #80)
