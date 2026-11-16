Ticket Code:
CHORE8

Ticket Type:
Chore (refactor)

Feature Name: 
Let the Types Say a Card's Data Can Be Missing

Origin:
Refactor retro (2026-11-16). FEAT2_6 made the app cope with a saved card whose data is missing: that card shows "This card can't be shown." and the rest keep working. But `apps/web/src/features/deck/hooks/use-study-deck.ts` looks cards up with `library.byId.get(id)!` in three places (`cards`, `shuffledOut` and `moved`). The `!` tells TypeScript the card is always there, so `StudyDeck.cards` is typed `WordEntry[]` when it can hold `undefined`. TypeScript can't warn when new code (e.g. FEAT7, FEAT9, FEAT10) uses a card's data without checking it. Today it only works because the error boundaries catch the crash.

Description:
As a developer I would like the types to say when a card's data can be missing, so TypeScript makes new code handle it, rather than relying on an error boundary.

Requirements / Expected Behaviours:
- No `!` on a card lookup in `apps/web/src`. A lookup that can miss is typed as able to miss (e.g. `WordEntry | undefined`, or a `{ id, word: WordEntry | null }` shape, agreed in the questions).
- Every place that uses a card's data handles a missing card on purpose. It shows the same "This card can't be shown." as today, or skips the card where that's what happens today (e.g. card flights).
- The error boundaries stay as a safety net.
- Nothing the user sees changes. Every existing test, including `missing-card-data.test.tsx`, passes unchanged.
- If agreed, a lint rule (`@typescript-eslint/no-non-null-assertion`) stops new `!` assertions, with any that must stay given a reason.

Possible Test Scenarios I would like to see:

All existing missing-card-data tests pass with no change to them

When a card's data is missing, Shuffle In Cards, Add Back, Back and the card flights still work (existing tests, keep them passing)

`npm run typecheck` fails if code uses a looked-up card without checking it (shown once in the PR by a throwaway change)

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. Which shape: `WordEntry | undefined` in the same arrays, or a card object with its id and its data or null?
2. Should a lint rule ban non-null assertions (`!`) across the app?
3. CHORE tickets may skip the PR review agent (decided 2026-11-06), but this one changes app code. Should it still get a review agent?

Mockup:
Changes nothing on screen.

Dependencies:
ARCH3 (study deck reducer) touches the same hook. Do them one after the other. Doing ARCH3 first means the new types go straight into the reducer.

Branch name Examples:
chore/missing-card-data-types
