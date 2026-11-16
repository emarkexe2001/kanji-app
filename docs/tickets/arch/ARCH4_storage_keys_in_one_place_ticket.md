Ticket Code:
ARCH4

Ticket Type:
Architecture (refactor)

Feature Name: 
Keep the Saved-Data Keys in One Place, With a Version

Origin:
Refactor retro (2026-11-16). The app saves eight values in browser storage, under keys spread across four files:
- `features/deck/utils/saved-deck.ts`: `kanji.studiedDeck`, `kanji.savedDeck`, `kanji.shuffleSource`, `kanji.removedCards`, `kanji.clearedCards`
- `features/card-limit/utils/deck-size.ts`: `kanji.deckSize`
- `lib/color-mode.ts` and the script in `apps/web/index.html`: `kanji.colorMode` (copied by hand. `test/ui-tests/color-mode-script.test.ts` checks the two agree)

None of the saved values has a version number. Old shapes are handled case by case (e.g. `loadShuffleChoice` still reads the shape saved before FEAT3). Coming tickets change what is saved: FEAT8 saves the card on screen, FEAT7 saves Hide answers, ARCH2 may change how cards are stored, FEAT9 may save scores. Without a version, each one adds another "older shape" special case.

Description:
As a developer I would like every saved-data key in one list, and the saved data to carry a version, so new features can change what is saved without breaking what users already have saved.

Requirements / Expected Behaviours:
- Every storage key is defined once, in one module in `src/lib/` (e.g. `storage-keys.ts`), and every reader and writer uses it. The `index.html` script keeps its copy of `kanji.colorMode`, still checked by the existing test.
- A saved-data version is stored (e.g. `kanji.version`), with a way to upgrade older saved data step by step when it changes.
- Today's saved data is version 1. Data saved before this ticket (no version) loads exactly as it does today.
- Saved data from a newer version than the app knows (e.g. after a rollback) doesn't crash the app. It falls back as for corrupt data today.
- The rule is written down where agents will read it (standards §2.5 or `docs/testing.md`): a change to saved data adds a version step and a test for it.
- Nothing the user sees changes. Every existing test passes.

Possible Test Scenarios I would like to see:

When I open the app with data saved before this change (no version), my deck, card limit, colour mode, shuffle choice and both lists all load as before

When the saved data is a version newer than the app knows, the app opens with a fresh deck and no error

When a test upgrade step is added (e.g. version 1 to 2 renames a field), old data is upgraded once and saved at the new version (unit test)

No file outside the storage keys module (and `index.html`) has a `kanji.` key in it (a scripts or unit test, if agreed)

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. One version for all saved data, or one per key?
2. Should a test fail if a `kanji.` key appears outside the keys module?
3. Should the saved values stay as separate keys, or be gathered into one saved object?

Mockup:
Changes nothing on screen.

Dependencies:
Best done before FEAT7, FEAT8 and ARCH2, which change saved data.

Branch name Examples:
chore/storage-keys-in-one-place
