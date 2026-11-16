Ticket Code:
TEST14

Ticket Type:
Test (refactor)

Test Name: 
Test Helpers for Saved Data, Using the App's Storage Keys

Origin:
Test refactor check (2026-11-16). The UI tests type the app's storage keys by hand: 41 `'kanji.*'` strings across 8 files (`shuffled-out` 11, `shuffle-in` 10, `new-card-badge` 8, `missing-card-data` 4, `card-limit` 3, `shuffle-in-multiple` 3, `card-slides` 1, `failure-paths` 1). They also write the saved-deck JSON by hand, e.g.:

```ts
localStorage.setItem('kanji.savedDeck', JSON.stringify({ deck: 'N5', cards: [...], newIds: ['N4-5'] }));
```

If a key or the saved shape changes (ARCH4 adds a version; FEAT8, FEAT7 and ARCH2 change what is saved), every one of these has to be found and changed, and a missed one can make a test check the wrong thing while still passing. Several files also spy on `Storage.prototype.setItem` and count deck saves in their own way.

Description:
As a developer I would like tests to set up and read saved data through a few shared helpers that use the app's own keys, so a change to saved data is made in one place and tests can't drift from the app.

Requirements / Expected Behaviours:
- Shared test helpers (e.g. `saveDeckForTest({ deck, cards, newIds })`, `savedDeck()`, `saveCardLimit(n)`, `countDeckSaves()`) use the keys from the app's storage keys module (ARCH4), not typed strings.
- No test file has a `'kanji.'` string left in it, apart from tests that check the raw stored value on purpose (e.g. corrupt or old-shape data). Those keep it with a comment saying why.
- No test's meaning changes. The test count stays the same, and every test passes.
- If TEST11 has added a safe way to count saves (e.g. waiting for the app's first save), the shared `countDeckSaves` uses it.
- `docs/testing.md` says to use these helpers for saved data.

Possible Test Scenarios I would like to see:

The web UI test count before and after is the same, and every test passes in 3 full runs

A grep for `'kanji.` in `apps/web/test` finds only the commented raw-data tests (shown in the PR)

Break-and-restore check: change a key in the app's storage keys module only, and see the tests still pass (they follow it); change the saved-deck shape the app reads, and see the tests that use `saveDeckForTest` go red

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. Should `test/setup.ts`'s saved colour mode (Light before every test) also go through a helper?

Mockup:
Changes nothing on screen.

Dependencies:
ARCH4 (storage keys in one place) must be merged first. Best after TEST11 and TEST12.

Branch name Examples:
test/storage-helpers-in-tests
