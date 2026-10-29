Ticket Code:
TEST4

Ticket Type:
Test

Test Name: 
Split the Slow Saved-Choice Test So It Doesn't Time Out

Origin:
ADJ2_5 (PR #50, 2026-10-29). The first CI run failed in `apps/web/test/ui-tests/shuffle-in-multiple.test.tsx`, in the test "unknown or repeated ticked decks in the saved choice are dropped without a notice, and an unknown mode falls back to One deck". PR #50 doesn't touch that file, and the test passed on the CI re-run and 5 times out of 5 locally. The peer review found nothing random in the test and no timers. The likely cause is the default 5-second Vitest time limit on a slow CI machine: this is the heaviest test in the file. It renders the app, reloads it twice, shuffles in and makes many clicks, with a 4 × 30-card library each time.

Description:
As a developer I would like CI to pass or fail only because of the code, so that a slow CI machine doesn't fail a pull request at random.

Requirements / Expected Behaviours:
- Split the test into three smaller tests, each checking one thing:
  1. Unknown or repeated ticked decks in the saved choice are dropped without a notice.
  2. A deck saved twice counts as one tick, so the "Tick at least two decks" message shows under the checkboxes.
  3. An unknown saved mode falls back to One deck.
- Each new test checks everything the old test checked for its part. Nothing that is tested today is lost.
- If one of the new tests is still slow (close to 5 seconds on CI), give it its own longer time limit, with a comment saying why.
- Look for other tests close to the 5-second limit (e.g. with `vitest --reporter=verbose` timings) and list them in the PR. Fix them only if they are also slow on CI.
- The app's behaviour doesn't change.

Possible Test Scenarios I would like to see:

When the saved choice has unknown or repeated ticked decks, they are dropped and no notice is shown

When a deck was saved twice and I shuffle in, I see "Tick at least two decks, or choose One deck instead." under the checkboxes

When the saved mode is unknown, One deck is chosen

Break-and-restore check: break each of the three behaviours in turn and see the matching new test go red

Dependencies:
None.

Branch name Examples:
test/split-slow-saved-choice-test
