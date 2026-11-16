Ticket Code:
TEST12

Ticket Type:
Test (refactor)

Test Name: 
Share the UI Test Helpers That Are Copied Between Files

Origin:
Test refactor check (2026-11-16). `apps/web/test/ui-tests/helpers.tsx` already shares many helpers, but the same small helpers are still written out again in many test files:
- `shuffledOutButton` in 9 files (all the same, except one uses `queryByRole`)
- `shuffleOutOne` in 7 files
- `reload` in 6 files, each slightly different (different default words, some async, some not)
- `panel`, `nextButton`, `cardOf`, `addBackGroup` and `takeOutGroup` in 4 files each; `addBackButton`, `modeButton` and `onScreenIsNew` in 3
- `setReducedMotion` in 4 files (`back-button`, `card-slides`, `new-card-badge`, `next-slide`). It does the same as `setScreen({ reduceMotion })`, which `helpers.tsx` already has.
- `DECKS` is defined in 10 files; some of these are the same and some differ.

When a button's name or the panel's markup changes, each copy has to be found and changed.

Description:
As a developer I would like each UI test helper written once, so tests are shorter and a change to the app's markup means changing one helper, not nine.

Requirements / Expected Behaviours:
- Every helper defined in 3 or more test files moves into the shared helpers. A copy that really differs is either given an option (e.g. `reload(words)`) or kept local with a comment saying why.
- `setReducedMotion` is replaced by `setScreen({ reduceMotion })`.
- If `helpers.tsx` grows past about 400 lines, split it into a `helpers/` folder by area (e.g. `render.tsx`, `deck.ts`, `panel.ts`, `colour-mode.ts`), re-exported from one index so imports stay short.
- No test's meaning changes: the same steps and the same checks. Only where its helpers come from changes.
- The number of tests stays the same, and every test passes. Compare the counts before and after.
- `docs/testing.md` says where shared helpers go, and that a helper used in a second file moves to the shared helpers.

Possible Test Scenarios I would like to see:

The web UI test count before and after is the same, and every test passes in 3 full runs

No helper name from the list above is defined in more than one test file (checked with a grep in the PR)

Break-and-restore check: break one shared helper (e.g. `shuffledOutButton` finds the wrong button) and see tests in several files go red

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. Split `helpers.tsx` into a folder now, or only once it passes about 400 lines?
2. Should the different `DECKS` word lists be shared too (e.g. named sets like `TWO_DECKS`, `FOUR_DECKS`), or stay in each file next to the tests that rely on their sizes?

Mockup:
Changes nothing on screen.

Dependencies:
Do before TEST13 (splitting the two biggest files), so the split files can use the shared helpers. Not at the same time as TEST11, if both change `new-card-badge.test.tsx`.

Branch name Examples:
test/shared-ui-test-helpers
