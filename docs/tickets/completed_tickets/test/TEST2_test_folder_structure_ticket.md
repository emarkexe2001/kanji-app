Ticket Code:
TEST2

Feature Name: 
Test Folder Structure + Test Discovery

Origin:
Retro of PR #1 (feature/card-limit). The new test file was placed next to the code in src/ rather than in a test folder (against the Folder Structure Standards), and the web test script names one file directly (tsx --test src/deckSize.test.ts), so any new test file would be silently skipped.

Feature Description:
As a developer I would like all tests to live in a clearly labelled test folder, separate from the code, and I would like the test command to automatically pick up every test file so that no test is ever missed.

Feature Requirements / Expected Behaviours:
Tests are moved out of src/ into a test/ folder in each package (e.g. apps/web/test/, packages/core/test/), with unit tests in test/unit/ and UI tests in test/ui-tests/
The test scripts find test files by pattern (e.g. test/**/*.test.ts) instead of naming individual files
tsconfig files are updated so test files are still type-checked but not bundled into the app
All existing tests still pass after the move

Possible Test Scenarios I would like to see:

When I run npm test from the repo root, every existing test runs and passes (same count as before the move)

When I add a new test file in the test folder, it runs without changing any script

When I run npm run typecheck, the test files are type-checked too

Dependencies:
None - should be done before TEST1

Branch name Examples:
chore/test-folder-structure

Completed On:
2026-10-30 (PR #54)
