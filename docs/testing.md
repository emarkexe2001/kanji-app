# Testing

This document describes the types of test used in the project, where each lives and how to run them. The rules for writing tests are in [standards.md, section 4](standards/standards.md#4-test-standards).

## Running the tests

| Command (from the repo root) | What it runs |
|---|---|
| `npm test` | Every test in every workspace: unit tests and UI tests. CI runs this on every pull request. |
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
  - `packages/core/src/segment.test.ts`

  Ticket TEST2 moves these into `test/unit/` folders and makes the test command find them by pattern. Until then, a new unit test file has to be added to the workspace's `test` / `test:unit` script.

### UI / component tests
- **What they check:** the app the way a user sees it. They render the real `App`, click buttons and type into fields with [Testing Library](https://testing-library.com/), and check what is on screen: the card shown, the "Card 3 / 10" counter, validation messages. They don't look at component state, so they keep passing if the code is refactored without changing behaviour.
- **Tools:** [Vitest](https://vitest.dev/) with a `jsdom` browser environment, `@testing-library/react`, `@testing-library/user-event` and `@testing-library/jest-dom` (for matchers like `toBeInTheDocument()`).
- **Where they live:** `apps/web/test/ui-tests/*.test.tsx`. Vitest finds every `*.test.ts(x)` file there automatically (`apps/web/vitest.config.ts`).
- **Data:** the tests never download the real dictionary. `test/ui-tests/helpers.tsx` replaces `fetch` so the app receives a list of made-up words (`makeWords`), and has helpers to read the counter and the current card and to type a card limit.
- **Current files:**
  - `deck.test.tsx`: Next, the → key, wrapping round, Shuffle
  - `card-limit.test.tsx`: setting the limit, + / −, saving it, and every validation message
  - `failure-paths.test.tsx`: the dictionary failing to load, a card failing to draw (error boundary), blocked browser storage, a corrupt saved limit

### End-to-end (e2e) tests
Not set up yet. When added they will run the whole app in a real browser and live in `apps/web/test/e2e/`.

## Writing a good test
- **Test failure paths as well as the happy path.** For every feature, include tests for what happens when things go wrong: invalid input, a failed download, broken data, blocked storage. The user should always see a clear message, never a blank page.
- **Check the test can fail.** Before relying on a new test, break the code it covers for a moment (e.g. remove a validation check) and make sure the test goes red. A test that can't fail doesn't protect anything.
- **Test what the user sees.** Find things the way a user would: by their label (`getByLabelText('Card limit')`), role (`getByRole('button', { name: /next/i })`) or text, not by class names or component internals.
