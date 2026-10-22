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

## Types of test

### Unit tests
- **What they check:** one function or small piece of logic on its own, with no React and no browser. For example card-limit validation (`parseDeckSizeInput`) and splitting a word into its kanji readings (`segmentWord`).
- **Tools:** Node's built-in test runner (`node:test`), run through `tsx`.
- **Where they live (for now):** next to the code, as `*.test.ts`:
  - `apps/web/src/features/card-limit/utils/deck-size.test.ts`
  - `apps/web/src/features/deck/utils/study-deck.test.ts` (deck rules that need a fixed random source, e.g. Random taking each card from a random other deck)
  - `packages/core/src/segment.test.ts`
  - `scripts/test/jlpt-list.test.ts` (reading the JLPT lists used by `npm run data:build`; runs with `npm run test:scripts`)

  Ticket TEST2 moves these into `test/unit/` folders and makes the test command find them by pattern. Until then, a new unit test file has to be added to the workspace's `test` / `test:unit` script.

### UI / component tests
- **What they check:** the app the way a user sees it. They render the real `App`, click buttons and type into fields with [Testing Library](https://testing-library.com/), and check what is on screen: the card shown, the "Card 3 of 10" counter, validation messages. They don't look at component state, so they keep passing if the code is refactored without changing behaviour.
- **Tools:** [Vitest](https://vitest.dev/) with a `jsdom` browser environment, `@testing-library/react`, `@testing-library/user-event` and `@testing-library/jest-dom` (for matchers like `toBeInTheDocument()`).
- **Where they live:** `apps/web/test/ui-tests/*.test.tsx`. Vitest finds every `*.test.ts(x)` file there automatically (`apps/web/vitest.config.ts`).
- **Data:** the tests never download the real dictionary. `test/ui-tests/helpers.tsx` replaces `fetch` so the app receives a list of made-up words (`makeWords`, or `makeDecks` for words in several JLPT decks), and has helpers to read the counter and the current card, type a card limit, pick decks, shuffle cards in and list every card in the deck (`deckContents`).
- **Current files:**
  - `deck.test.tsx`: Next, the → key, wrapping round, Deck Shuffle and the S key, the "Card 5 of 20" position
  - `shuffle-in.test.tsx`: picking the deck to study, Shuffle In Cards (one deck or Random, one or several cards, reloads, the summary, card limit changes, the removed-cards record) and its failure paths, plus checks of bad saved deck data
  - `shuffled-out.test.tsx`: the Shuffled-out cards view (the list, adding cards back by swapping deck cards out, clearing it with confirmation), recovering a cleared list (added to the list by when each card was shuffled out, kept until Clear List is pressed again, across a reload and a deck switch, bad saved data, blocked storage), the cards shown as compact cards in a numbered grid and picked by selecting them or with the keyboard (Enter held down picks once), what screen readers hear for each card, no "★ Common Word" badge on them, picked cards in a high-contrast (forced colours) mode, and its failure paths (including a card that can't be drawn)
  - `shuffled-out-header.test.tsx`: the "Shuffled out (N)" button in the top right of the header (ADJ1): beside the title, its full label kept, the panel opening below the header and above the deck, adding cards back from there, and the Tab order (button, panel, deck)
  - `new-card-badge.test.tsx`: the "New" badge on shuffled-in cards (until seen and moved on from, kept in a one-card deck, across a reload, bad saved data, the ribbon's shared colour), the deck only being saved again when a card stops being new, and the slide animations being skipped when "reduce motion" is on
  - `missing-card-data.test.tsx`: a shuffled-out card whose data is missing completely (FEAT2_6): only that card shows "This card can't be shown." and the rest of the view and the deck keep working
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
