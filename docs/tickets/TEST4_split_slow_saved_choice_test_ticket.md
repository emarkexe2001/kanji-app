Ticket Code:
TEST4

Ticket Type:
Test

Test Name: 
Fix the Saved-Choice Test That Fails at Random (Wrong Result or Time Limit)

Origin:
ADJ2_5 (PR #50, 2026-10-29). The first CI run failed in `apps/web/test/ui-tests/shuffle-in-multiple.test.tsx`, in the test "unknown or repeated ticked decks in the saved choice are dropped without a notice, and an unknown mode falls back to One deck". PR #50 doesn't touch that file, and the test passed on the CI re-run and 5 times out of 5 locally. The peer review found nothing random in the test and no timers. The likely cause is the default 5-second Vitest time limit on a slow CI machine: this is the heaviest test in the file. It renders the app, reloads it twice, shuffles in and makes many clicks, with a 4 × 30-card library each time.

Seen again in TEST6 (PR #67, 2026-11-05): in one of 10 full local runs, this test failed on a wrong result, not a timeout. It failed after 99ms at `expect(tickedLabels()).toEqual(['JLPT N4'])`, just after the reload that follows `saveChoice({ kind: 'multiple', decks: ['N4', 'N4'] })`, with `expected [ 'JLPT N4', 'JLPT N2' ] to deeply equal [ 'JLPT N4' ]`. The decks ticked before the reload were still ticked after it, so the cause may not be the time limit (e.g. the choice saved earlier in the test being written again after `saveChoice`). Check this while splitting the test.

Updated after the TEST6 retro (2026-11-05): the wrong result may be an app bug, so finding its cause now comes first. Listing other slow tests moved to TEST8.

Description:
As a developer I would like this test to pass or fail only because of the code, so that a slow machine or leftover state doesn't fail a pull request at random, and a real bug in how saved deck choices are loaded doesn't hide behind a flaky test.

Requirements / Expected Behaviours:
- First, find out why the test got `['JLPT N4', 'JLPT N2']` after the reload. Say in the PR whether it is a problem in the test (e.g. state left over from earlier in the test, or a save still running) or in the app (e.g. the app writing its old choice back over the saved one). If it is in the app, stop and ask before changing any app code.
- Split the test into three smaller tests, each checking one thing:
  1. Unknown or repeated ticked decks in the saved choice are dropped without a notice.
  2. A deck saved twice counts as one tick, so the "Tick at least two decks" message shows under the checkboxes.
  3. An unknown saved mode falls back to One deck.
- Each new test checks everything the old test checked for its part. Nothing that is tested today is lost.
- Use `NO_PAUSE` from `helpers.tsx` where a test makes many clicks (see "Keeping UI tests fast" in `docs/testing.md`).
- If one of the new tests is still over 2.5 seconds in a full run, give it its own 15-second time limit, with a comment saying why (as agreed in TEST6).
- The app's behaviour doesn't change, unless the cause is an app bug and the fix has been agreed first.

Questions / Clarifications:
(Check this ticket against docs/standards/standards.md before starting.)

Possible Test Scenarios I would like to see:

When the saved choice has unknown or repeated ticked decks, they are dropped and no notice is shown

When a deck was saved twice and I shuffle in, I see "Tick at least two decks, or choose One deck instead." under the checkboxes

When the saved mode is unknown, One deck is chosen

When I run `npm run test:ui:repeat -w @kanji/web -- 10 test/ui-tests/shuffle-in-multiple.test.tsx`, all 10 runs pass

If the cause was in the app: a test that fails without the fix and passes with it

Break-and-restore check: break each of the three behaviours in turn and see the matching new test go red

Dependencies:
None. Do this before TEST5 and TEST8 (order agreed 2026-11-05: TEST4, then TEST5, then TEST8). TEST8 waits for this ticket, as it lists another test in the same file.

Branch name Examples:
test/split-slow-saved-choice-test
