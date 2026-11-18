Ticket Code:
CHORE10

Ticket Type:
Chore (refactor)

Feature Name: 
Remove Dead Code and Share Duplicated Helpers

Origin:
Refactor retro (2026-11-16). Found:
- **Dead code.** `packages/core/src/samples.ts` (117 lines, `SAMPLE_WORDS`) is exported from `@kanji/core` but nothing in the app, scripts or tests uses it. The deck comes from `deck.json`.
- **Two `toHiragana`s.** `scripts/jlpt-list.ts` has its own `toHiragana` (katakana to hiragana), next to the one in `packages/core/src/segment.ts` that `scripts/build-deck.ts` already imports.
- **Two whole-number parsers.** `parseDeckSizeInput` (`features/card-limit/utils/deck-size.ts`) and `parseShuffleInCount` (`features/deck/utils/study-deck.ts`) do the same steps (trim, empty check, digits only, minimum, maximum) with their own messages.

Note (2026-11-18): since ARCH2 (PR #113), `npm run data:build` no longer writes `deck.json`. It writes `decks.json`, `n5.json` … `n1.json` and `common-no-level.json` in `apps/web/public/data/`. The byte-for-byte checks below apply to all of those files.

Description:
As a developer I would like unused code removed and duplicated helpers shared, so there is less code to read and a fix only has to be made once.

Requirements / Expected Behaviours:
- `samples.ts` and its export are removed (unless question 1 keeps it).
- `scripts/jlpt-list.ts` uses core's `toHiragana`. Both give the same result for every reading in `data/raw/jlpt/*.csv`, so `npm run data:build` writes the same deck files, byte for byte.
- One shared whole-number parser in `src/lib/` (e.g. `parseWholeNumber(raw, { min, max, messages })`) is used by both fields. Each field keeps its exact messages today.
- Nothing the user sees changes. Every existing test passes unchanged.

Possible Test Scenarios I would like to see:

The card limit and Cards to shuffle in messages are the same as before, for empty, non-numeric, 0, too big and valid input (existing tests, keep them passing)

Unit tests on the shared parser for each case

After the change, `npm run data:build` writes the same deck files as before, byte for byte (compared in the PR)

`npm run typecheck`, `npm run lint` and every test pass with `samples.ts` gone

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. Should `SAMPLE_WORDS` be kept as test data (moved under `test/`), or deleted?
   Answer (agreed 2026-11-18): Delete it, with its export from `@kanji/core`. Nothing uses it, and the tests build their own data.
2. Should this also do ARCH1 (remove the stray `nextjs` package), or leave ARCH1 as its own ticket?
   Answer (agreed 2026-11-18): No. ARCH1 stays its own ticket, so each PR does one change (standards 5).
3. CHORE tickets may skip the PR review agent (decided 2026-11-06). Is that fine here?
   Answer (agreed 2026-11-18): No, this one changes app code, so it gets a review agent, as for CHORE6, CHORE7 and CHORE8.

Mockup:
Changes nothing on screen.

Branch name Examples:
chore/remove-dead-and-duplicate-code
