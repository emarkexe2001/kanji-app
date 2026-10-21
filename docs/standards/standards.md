# Kanji App Standards

These standards apply to everyone working on the project. The code standards are adapted from [bulletproof-react](https://github.com/alan2207/bulletproof-react) to fit this app (React + Vite + Tailwind in an npm-workspaces monorepo, with no backend).

If a ticket and these standards disagree, or something isn't clear, ask before starting work.

## Contents
1. UI Standards
2. Code Standards
3. Folder Structure Standards
4. Test Standards
5. Git, Branch and Pull Request Standards
6. Open Questions

---

## 1. UI Standards

- **Consistent across the whole app.** The header, footer and font should be the same on every page and should not change.
- **Colour-coded buttons.** Buttons should be clearly colour-coded and easy to understand at first glance. Red buttons are for deletion and other dangerous actions.
- **Only show what the user needs.** The UI should only show the information the user needs to use the app, for example:
  - the number of cards currently in their deck
  - the shuffle button
  - the control for changing the number of cards in the deck
  - the coloured cards with their readings and meanings
- **Hide everything else.** Other information, such as the total number of cards available in the app, should be hidden from the user. Keep the details on screen to a minimum.
- **Validation messages appear inline,** next to the input they relate to, and are announced to screen readers (`role="alert"`).

---

## 2. Code Standards

### 2.1 Language and tooling
- **TypeScript in strict mode** for all code. Avoid `any`; if a type is unknown, use `unknown` and narrow it.
- **ESLint** must pass with no errors. It enforces code quality and the folder/import rules in section 3.
- **Prettier** formats all code (`.prettierrc`). Turn on "format on save" in your editor. Don't argue about formatting in reviews; Prettier decides. Markdown files (docs and tickets) are not formatted by Prettier, because it rewrites the ticket layout; keep them tidy by hand.
- **Line endings are LF** on every OS (`.gitattributes`), so Windows and Mac/Linux produce the same files.
- `npm run format:check`, `npm run lint`, `npm run typecheck` and `npm test` must all pass before opening a pull request. CI runs the same checks.

### 2.2 Naming
- **Files and folders use kebab-case**, e.g. `word-card.tsx`, `use-deck.ts`, `deck-size.ts`, `card-limit/`. This avoids case-sensitivity problems between Windows, macOS and Linux.
- **Components use PascalCase** in code (`export function WordCard`), even though their file names are kebab-case.
- **Hooks start with `use`** (`useDeck`), and **constants use UPPER_SNAKE_CASE** (`MAX_DECK_SIZE`).
- Name things after what they mean in the app (deck, card, card limit, reading), not after how they are built.

### 2.3 Components
- **Keep things close to where they are used.** Components, functions, styles and state should live as close as possible to the code that uses them. Only move something to a shared folder once a second feature needs it.
- **No nested render functions.** If part of a component's UI can stand on its own, extract it into its own component instead of a `renderX()` function.
- **Keep the number of props small.** If a component needs many props, split it up or use composition (`children`).
- **Shared UI goes in `components/ui`.** Build common pieces like `Button` once and reuse them, so the UI stays consistent (for example, a `Button` with a `danger` variant that is always red).
- **Stay consistent.** Follow the patterns already used in the codebase. Linting and formatting do most of this automatically.

### 2.4 Styling
- **Use Tailwind** for styling.
- **Colours for the card readings come from the shared tokens** in `@kanji/core` (`tokens.ts`). Don't hard-code those colours in components.

### 2.5 State
- **Start with component state** (`useState`, or `useReducer` when one action updates several values). Only lift state up when another component needs it.
- **Don't add a global store** (Redux, Zustand, etc.) unless state is truly needed across the whole app and passing it down has become unmanageable.
- **Validation rules live in plain functions,** not inside components (for example `parseDeckSizeInput` for the card limit). This makes them easy to unit test and reuse.
- **Browser storage (`localStorage`) is always accessed through a small helper** that catches errors. Storage can be unavailable (private browsing, blocked cookies), and the app must keep working when it is.

### 2.6 Error handling
- **Never crash the whole app** because one part failed. Wrap major areas (such as the deck) in a React error boundary that shows a friendly message.
- **Failures the user can fix get a clear message** explaining what to do (e.g. "Card limit can't be more than 150."). Failures the user can't fix get a general message and are logged to the console.

---

## 3. Folder Structure Standards

- **Clear names.** All folders in the monorepo should be clearly labelled and easy to understand at first glance for other programmers.
- **Separate code, tests and documentation:**
  - code lives in `src/`
  - tests live in `test/`
  - documentation lives in `docs/`

### 3.1 Monorepo layout
```
apps/web/          # the React web app
packages/core/     # shared types, colour tokens and kanji logic used by any app
scripts/           # build scripts (e.g. building the deck from JMdict/KANJIDIC2)
data/              # raw source data
docs/              # standards, tickets and other documentation
```
`packages/core` must never import from `apps/`. Apps import from `@kanji/core`, never the other way round.

### 3.2 Web app layout (`apps/web`)
```
src/
  app/            # app entry: main.tsx, app.tsx, providers, error boundaries
  assets/         # static files: images, fonts
  components/     # shared components used by more than one feature
    ui/           # basic building blocks: button, input, etc.
  config/         # app-wide constants and settings
  features/       # one folder per feature, e.g. deck/, card-limit/, card-categories/
  hooks/          # shared hooks used by more than one feature
  lib/            # small wrappers around browser APIs or libraries (e.g. storage)
  types/          # shared types
  utils/          # shared helper functions
test/
  unit/           # unit tests
  ui-tests/       # UI / component tests
  e2e/            # end-to-end tests (when added)
```

### 3.3 Feature folders
Most code should live in `src/features/`. Each feature has its own folder and only includes the sub-folders it needs:
```
src/features/card-limit/
  components/     # components only used by this feature
  hooks/          # hooks only used by this feature
  utils/          # helpers and validation for this feature
  types/          # types only used by this feature
```

### 3.4 Import rules
- **Code flows one way: shared → features → app.**
  - Shared folders (`components`, `hooks`, `lib`, `types`, `utils`) can be used by anything, but must not import from `features/` or `app/`.
  - Features can import from shared folders, but not from `app/`.
  - `app/` can import from both.
- **Features must not import from other features.** If two features need to work together, combine them in `app/`. If they need the same code, move it to a shared folder.
- **Import files directly.** Don't create `index.ts` files that re-export everything in a folder (barrel files). They slow Vite down.
- ESLint enforces these rules.

---

## 4. Test Standards

### 4.1 Types of test
| Type | What it checks | Where it lives |
|---|---|---|
| Unit | One function or small piece of logic on its own (e.g. card-limit validation) | `test/unit/` |
| UI / integration | Components working together the way a user sees them (e.g. setting a card limit changes the number of cards shown) | `test/ui-tests/` |
| End-to-end (e2e) | The whole app running in a real browser | `test/e2e/` (when added) |

A document in `docs/` must describe the test types used in the project and how to run them.

### 4.2 Rules
- **Prefer UI / integration tests** for features. They give the most confidence that the app works for the user. Use unit tests for logic such as validation and the kanji reading split.
- **Test what the user sees, not how it is built.** For example, check the number of cards on screen rather than a component's internal state. Tests should still pass if the code is refactored without changing behaviour.
- **Test the scenarios that matter,** both successful and correct inputs. For example:
  - pressing the shuffle button shows a new card
  - cards display correctly
  - when a card limit is set, only that many cards are shown
- **Every ticket's "Possible Test Scenarios" must be covered** by a test, or the PR must explain why not.
- **Test validation messages** for every feature where the user can enter input, such as increasing and decreasing the card limit.
- **Decks can never be empty.** There must always be at least 1–5 cards in a deck (see Open Questions). If the user tries to set up a deck with 0 cards, a validation message must be shown.
- **The test command must find test files automatically,** so a new test file runs without changing any scripts.
- **All tests must pass** before a feature branch can be merged into `main`.

---

## 5. Git, Branch and Pull Request Standards

### 5.1 Before starting
- Read the ticket and make sure you understand the task.
- If the ticket needs more detail or clarification, respond with questions before starting.

### 5.2 Branches
- **Never work directly on `main`.** Always branch off an up-to-date `main`.
- **Every change to `main` goes through a branch and a pull request,** including docs and tickets. Nothing is committed straight to `main`.
- **Give the branch a clear name,** for example `feature/card-shuffle` or `feature/user-set-card-limit`.
- **Start the branch name with a prefix** that says what kind of change it is:

  | Prefix | Used for | Example |
  |---|---|---|
  | `feature/` | new features | `feature/card-shuffle` |
  | `fix/` | bug fixes | `fix/card-limit-validation` |
  | `test/` | adding or changing tests only | `test/ui-component-tests` |
  | `docs/` | standards, tickets and other documentation | `docs/add-tickets` |
  | `chore/` | housekeeping that doesn't change how the app behaves | `chore/repo-housekeeping` |
  | `ci/` | CI and automation | `ci/run-tests-on-pr` |

### 5.3 Before opening a pull request
- The feature is fully implemented.
- Functional tests have been added around the feature.
- The new code doesn't break old code or old tests, and all tests pass.
- `npm run format:check`, `npm run lint`, `npm run typecheck` and `npm test` all pass (see 2.1).

### 5.4 Pull requests and merging
- **Every change goes through a pull request,** reviewed by me or someone else before any merging happens.
- **Only merge once the feature is complete,** properly tested, and all tests pass.
- **One change per pull request.** A pull request only contains the change it is about, so it is quick to review. A feature PR only contains commits for that feature.
- **Docs and ticket changes get their own pull request** from a `docs/` branch (e.g. `docs/add-tickets`), rather than being added to a feature PR.
- **Move finished tickets.** When a ticket is finished, move its file into `docs/tickets/completed_tickets/` and add a `Completed On:` note with the date. Do this in the ticket's own pull request, so merging the PR is what marks the ticket as complete.

### 5.5 Commit messages
Use this format:
```
Title of the change

A brief description of what was changed and why.
```
These rules are checked automatically, when you commit and again in CI:
- **The title is 72 characters or fewer.**
- **Line 2 is blank.** It separates the title from the description.
- **There is a description** after the blank line. Trailers such as `Co-Authored-By:` at the end don't count as the description.
- **Merge commits and git's own revert messages** (`Revert "..."`) are allowed through as git writes them.

How the check runs:
- **When you commit,** a `commit-msg` git hook (set up by [husky](https://typicode.github.io/husky/) when you run `npm install`) rejects a message that breaks a rule, says which rule, and shows the title. Your message is kept in the file it names, so you can fix it and commit again.
- **In CI,** the "Typecheck and test" check runs the same script over every commit in the pull request, so a commit made with `--no-verify` still fails, and the failure names the commit.
- The rules live in one script, `scripts/check-commit-message.ts`, used by both. See [testing.md](../testing.md#commit-message-check) to run it by hand.

**Writing a multi-line message safely (especially on Windows):** don't put a multi-line message in `git commit -m "..."`. Some Windows shells squash it onto one line, which is how the title, description and trailer all end up in the title. Instead, either:
- run `git commit` with no `-m`, and write the message in the editor that opens, or
- write the message to a file and run `git commit -F <file>`.

**Fixing a bad commit:** force-pushing is not allowed, including to your own feature branch, and the permission setup blocks it. Once a commit is pushed, fix problems with new commits, not by rewriting history. A commit that is already pushed with a bad message can't be fixed by a new commit, so the check in CI will keep failing: move the work to a new branch with well-formed commits and open a new pull request. The hook exists so this doesn't happen.

The exact detail expected in commits, branches and pull requests is still being discussed with Hong (see Open Questions). The rules above are the minimum and may be tightened once that is agreed.

### 5.6 Ticket types
Each ticket starts with a code made of a type and a number (e.g. `FEAT2`, `ADJ1`). The type says what kind of work it is:

| Code | Type | Used for |
|---|---|---|
| `FEAT` | Feature | new things the user can do |
| `ADJ` | Adjustment | changing where or how existing UI is shown, without changing what it does (e.g. moving a button). An adjustment ticket shows the current and wanted layout. Its branch uses the `feature/` prefix |
| `UI` | UI fixes | fixing UI that doesn't behave as it should |
| `TEST`, `TOOL`, `CI`, `CHORE`, `PROC`, `ARCH` | Other | tests, tooling, CI, housekeeping, process and architecture |

A follow-up to a ticket keeps its number with a suffix, e.g. `FEAT2_5` follows `FEAT2`.

---

## 6. Open Questions
- **Minimum deck size:** these standards say "at least 1–5 cards", but the card limit ticket says the minimum is 1. Agree on one number (ticket PROC3).
- **Commit, branch and PR detail:** how much detail commit messages, branch names and pull requests should have. To be agreed with Hong. The minimum commit message rules in 5.5 are already enforced (ticket TOOL3).
