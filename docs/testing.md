# Testing

This document describes the types of test used in the project, where each lives and how to run them. The rules for writing tests are in [standards.md, section 4](standards/standards.md#4-test-standards).

## Running the tests

| Command (from the repo root) | What it runs |
|---|---|
| `npm test` | Every test in every workspace (unit tests and UI tests), then the `scripts/` tests. CI runs this on every pull request. |
| `npm run test:scripts` | Only the tests for the root `scripts/` (e.g. the commit message check), in `scripts/test/` |
| `npm run test:unit -w @kanji/web` | Only the web app's unit tests |
| `npm run test:ui -w @kanji/web` | Only the web app's UI tests |
| `npx vitest -w @kanji/web` (or `npx vitest` inside `apps/web`) | UI tests in watch mode, re-running as you save |
| `npm test -w @kanji/core` | Only the `@kanji/core` unit tests |
| `npm run typecheck` | Type-checks the code in `src/` and the tests in `test/` of every workspace |

## Where tests live and how they are found

Tests are kept apart from the code (standards 3), in a `test/` folder in each workspace:

```
apps/web/test/
  unit/           # unit tests, grouped by feature (card-limit/, deck/)
  ui-tests/       # UI / component tests, plus helpers.tsx
  setup.ts        # Vitest setup for the UI tests
  tsconfig.json   # type-checks everything in test/
packages/core/test/
  unit/
  tsconfig.json
scripts/test/     # tests for the root scripts/
```

**Test files are found by pattern, so a new test file runs without changing any script.** Name it `*.test.ts` (unit) or `*.test.tsx` (UI) and put it in the right folder, in a subfolder if you like:

| Tests | Pattern | Set in |
|---|---|---|
| Web unit tests | `test/unit/**/*.test.ts` | `test:unit` in `apps/web/package.json` |
| Web UI tests | `test/ui-tests/**/*.test.{ts,tsx}` | `include` in `apps/web/vitest.config.ts` |
| `@kanji/core` tests | `test/**/*.test.ts` | `test` in `packages/core/package.json` |
| `scripts/` tests | `scripts/test/**/*.test.ts` | `test:scripts` in the root `package.json` |

The patterns in the `package.json` scripts are in double quotes, so the shell leaves them alone and Node's test runner expands them itself. That way they work the same on Windows (where npm runs scripts with `cmd.exe`, which doesn't expand patterns) and on Linux in CI (where `sh` treats `**` as just one folder level, so tests in deeper subfolders would be missed). This needs Node 22 or later (CI uses 22).

Test files and folders follow the same kebab-case naming rule as the code (e.g. `card-history.test.ts`), and ESLint checks it.

**Tests are type-checked but never bundled.** Each `test/` folder has its own `tsconfig.json`, which extends the workspace's `tsconfig.json` and adds Node's types (for `node:test` and `node:assert`), so only the tests get them and the app code stays browser-only. `npm run typecheck` checks both. Vite only bundles what `src/` imports, and nothing in `src/` imports from `test/`.

## Types of test

### Unit tests
- **What they check:** one function or small piece of logic on its own, with no React and no browser. For example card-limit validation (`parseDeckSizeInput`) and splitting a word into its kanji readings (`segmentWord`).
- **Tools:** Node's built-in test runner (`node:test`), run through `tsx`.
- **Where they live:** in `test/unit/` as `*.test.ts`, grouped by the feature they test. They import the code they test from `src/` (e.g. `../../../src/features/deck/utils/card-history`). Every `*.test.ts` file there is picked up automatically.
- **Current files:**
  - `apps/web/test/unit/card-limit/deck-size.test.ts`
  - `apps/web/test/unit/deck/study-deck.test.ts` (deck rules that need a fixed random source, e.g. Random taking each card from a random other deck, or Multiple decks picking across the ticked decks combined)
  - `apps/web/test/unit/deck/card-history.test.ts` (where Back goes: the last card seen still in the deck, skipping gone cards and the card on screen, the card before in deck order when nothing is left, and the 50-card limit)
  - `packages/core/test/unit/segment.test.ts`
  - `scripts/test/jlpt-list.test.ts` (reading the JLPT lists used by `npm run data:build`; runs with `npm run test:scripts`)

### UI / component tests
- **What they check:** the app the way a user sees it. They render the real `App`, click buttons and type into fields with [Testing Library](https://testing-library.com/), and check what is on screen: the card shown, the "Card 3 of 10" counter, validation messages. They don't look at component state, so they keep passing if the code is refactored without changing behaviour.
- **Tools:** [Vitest](https://vitest.dev/) with a `jsdom` browser environment, `@testing-library/react`, `@testing-library/user-event` and `@testing-library/jest-dom` (for matchers like `toBeInTheDocument()`).
- **Where they live:** `apps/web/test/ui-tests/*.test.tsx`. Vitest finds every `*.test.ts(x)` file there (and in its subfolders) automatically (`apps/web/vitest.config.ts`).
- **Data:** the tests never download the real dictionary. `test/ui-tests/helpers.tsx` replaces `fetch` so the app receives a list of made-up words (`makeWords`, or `makeDecks` for words in several JLPT decks), and has helpers to read the counter and the current card, type a card limit, pick decks, shuffle cards in and list every card in the deck (`deckContents`).
- **Current files:**
  - `deck.test.tsx`: Next, the → key, wrapping round, Deck Shuffle and the S key, the "Card 5 of 20" position
  - `back-button.test.tsx`: the Back button and the ← key (FEAT6): going back through the cards seen (by Next, Deck Shuffle and Add Back Cards) in reverse order, the card before in deck order when nothing is left (wrapping from Card 1), Next after Back, the counter and the deck not changing, the ← key not firing while typing, the history skipping cards that are no longer in the deck (Shuffle In Cards, a smaller card limit), kept through Deck Shuffle, Shuffle In Cards and card limit changes, cleared by changing the studied deck, not kept after a reload and never saved, the last 50 cards only, the "New" badge, a one-card deck, the two-row layout, the outline style, focus ring and forced colours (checked by class name), the keyboard hint, and the slide from the left (skipped with reduce motion)
  - `shuffle-in.test.tsx`: picking the deck to study, Shuffle In Cards (one deck or Random, one or several cards, reloads, the summary, card limit changes, the removed-cards record) and its failure paths, plus checks of bad saved deck data
  - `shuffle-in-multiple.test.tsx`: the "Shuffle in from" switch (One deck | Random | Multiple decks: a radio group, the arrow keys, its colours in normal and forced-colours modes, disabled with fewer than two other decks) and Shuffle In Cards from multiple decks (FEAT3): ticking decks, picking at random across the ticked decks combined, cards in two ticked decks counted once, the Shuffled-out list, reloads, switching back to One deck or Random, and its failure paths (none or one deck ticked, not enough new cards, ticked decks that are gone or now studied, blocked storage, choices saved before FEAT3 and bad saved data)
  - `shuffled-out.test.tsx`: the Shuffled-out cards view (the list, adding cards back by swapping deck cards out, clearing it with confirmation), recovering a cleared list (added to the list by when each card was shuffled out, kept until Clear List is pressed again, across a reload and a deck switch, bad saved data, blocked storage), the cards shown as compact cards in a numbered grid and picked by selecting them or with the keyboard (Enter held down picks once), what screen readers hear for each card, no "★ Common Word" badge on them, picked cards in a high-contrast (forced colours) mode, and its failure paths (including a card that can't be drawn)
  - `shuffled-out-header.test.tsx`: the "Shuffled out (N)" button in the top right of the header (ADJ1): beside the title, its full label kept, the panel coming straight after the header and before the deck in the page, adding cards back from there, and the Tab order (button, panel, deck)
  - `shuffled-out-panel.test.tsx`: the Shuffled-out cards panel floating in the top right (ADJ2): its place and size in the wide layout and the 260px pop-up below 1100px (checked by class name, since jsdom has no layout), 2 cards per row with smaller cards, the buttons pinned at the bottom, closing with ×, Escape, a click or tap outside and the button (which toggles it), staying open on an inside click, focus moving into it and back to the button, picks dropped on close, the slide-down animation and reduced motion, the deck card moving below the pop-up on a phone (measured where the pop-up is laid out, not where it is drawn as it slides in), Add Back, Clear and Recover from there, a validation message, a deck crash while it is open, and React strict mode
  - `floating-panel-fixes.test.tsx`: fixes to the floating panel (ADJ2_5): the wide layout starting at 1100px, the same in the code and the styles; the pop-up at 1024, 1064 and 1099px with the deck card below it, and the panel beside the deck from 1100px; the panel's top measured from the header (a taller header, a scrolled page, resizing, a closed panel not following it); the slim deck card under the pop-up (no Reading Breakdown, the Common Word badge and Full Word Meaning label hidden from view only, a one-line meaning with all of it kept for screen readers, no fanned card backs); the pop-up not growing when a card is picked; the short-screen height cap; a press dragged out of the panel not swallowing the next click outside; and class checks for the footer border and the 11px "New" ribbon
  - `panel-hooks.test.tsx`: the hooks behind it (ADJ2_5): `usePanelClearance` (keeping the deck card below the pop-up) and `usePanelTop` (keeping the panel below the header): measuring, measuring again on resize, size changes and moves, and cleaning up when the panel closes or the deck goes away
  - `new-card-badge.test.tsx`: the "New" badge on shuffled-in cards (until seen and moved on from, kept in a one-card deck, across a reload, bad saved data, the ribbon's shared colour), the deck only being saved again when a card stops being new, and the slide animations being skipped when "reduce motion" is on
  - `missing-card-data.test.tsx`: a shuffled-out card or a deck card whose data is missing completely (FEAT2_6): only that card shows "This card can't be shown." (in "Add back" or "Take out of your deck") and the rest of the view and the deck keep working
  - `card-limit.test.tsx`: setting the limit, + / −, saving it, and every validation message
  - `failure-paths.test.tsx`: the dictionary failing to load, a card failing to draw (error boundary), blocked browser storage, a corrupt saved limit

### Commit message check
Commit messages are checked against [standards.md, section 5.5](standards/standards.md#55-commit-messages) by `scripts/check-commit-message.ts`. The `commit-msg` hook runs it on every commit and CI runs it on every commit in a pull request. To run it by hand (from the repo root):

| Command | What it checks |
|---|---|
| `npm run check:commits -- origin/main..HEAD` | Every commit on your branch that isn't on `main` yet, the same as CI. Run `git fetch` first so `origin/main` is up to date. |
| `npx tsx scripts/check-commit-message.ts --file <path>` | One message saved in a file, the same as the hook. Handy for checking a message before `git commit -F <path>`. |

Its rules are unit tested in `scripts/test/check-commit-message.test.ts` (`npm run test:scripts`). If the hook doesn't run when you commit, run `npm install` once to set it up.

### End-to-end (e2e) tests
Not set up yet. When added they will run the whole app in a real browser and live in `apps/web/test/e2e/`.

## Writing a good test
- **Test failure paths as well as the happy path.** For every feature, include tests for what happens when things go wrong: invalid input, a failed download, broken data, blocked storage. The user should always see a clear message, never a blank page.
- **Check the test can fail.** Before relying on a new test, break the code it covers for a moment (e.g. remove a validation check) and make sure the test goes red. A test that can't fail doesn't protect anything. Commit or `git stash` your work first, so restoring the file can't wipe unsaved changes.
- **Test what the user sees.** Find things the way a user would: by their label (`getByLabelText('Card limit')`), role (`getByRole('button', { name: /next/i })`) or text, not by class names or component internals.
- **Class names only when nothing else works.** The test setup (jsdom) has no layout, colours or animations. For a colour or animation, checking a class name is acceptable, with a comment saying why. Layout (widths, grids, sideways scrolling) can't be tested here at all: check it in a real browser at about 360px, 640px and 1024px and note it in the PR.
- **Test what's left out.** When a ticket says something is not shown (e.g. "no Reading Breakdown"), add a test that checks it isn't there.
