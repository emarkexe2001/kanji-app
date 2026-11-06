Ticket Code:
TEST5

Ticket Type:
Test

Test Name: 
Fix the Flaky "Shuffle In Cards Again and Again" Test

Origin:
TEST2 (PR #54, 2026-10-30). While checking test counts, the TEST2 agent saw `apps/web/test/ui-tests/card-slides.test.tsx` fail in the test "pressing Shuffle In Cards again and again: every card ends up in the right place, with the right count". The failure was `expected 2 to be 3` at `expect(shownCount()).toBe(3)` after `landNext()`. It failed once in 8 runs on the TEST2 branch and once in 10 runs on main (69c48e5), so TEST2 didn't cause it. Neither the test nor the code it uses changed in PR #54. This is a different test from the one in TEST4.

Cause found (2026-11-06): the test, not `landNext()` or the app. Shuffle In Cards only leaves out the cards in the deck (FEAT1), so the third press could draw the card the first press had shuffled in (and the second press had shuffled out). That card goes back into the deck and leaves the shuffled-out list, so the count rightly stays at 2. When it failed, `sliding()` held only the right sliding card. Forcing that draw (`Math.random` always 0) made the old test fail 10 times out of 10. The fixed test chooses the card drawn on each press.

Description:
As a developer I would like CI to pass or fail only because of the code, so that a test that fails at random doesn't block a pull request or hide a real bug.

Requirements / Expected Behaviours:
- Find out why the test sometimes fails, and say in the PR what the cause was and how it was proved (e.g. a run that fails every time once the cause is forced).
- One place to look first: `landNext()` finishes `sliding()[0]`, the oldest animation still running. If another animation (e.g. the new card dropping on, or the count bump) is sometimes older than the last sliding card, `landNext()` finishes that one instead, and the third card never lands. The deck order is random, so this might depend on which cards are drawn. This is only a guess and needs checking.
- If the cause is in the test, fix the test so it always checks the same thing (e.g. land the sliding card itself, or fix the deck order). Don't make the test weaker or remove checks.
- If the cause is in the app (a card can really fail to land or be counted), say so in the PR and ask before changing app behaviour.
- Check the other tests in `card-slides.test.tsx` that use `landNext()` or `sliding()[0]` for the same problem, and fix any that have it.
- The app's behaviour doesn't change, unless agreed after the point above.

Questions / Clarifications:
(Check this ticket against docs/standards/standards.md before starting.)
1. Which flow does this ticket follow?
   Answer (agreed 2026-11-06): a lighter flow. One agent finds the cause, fixes the test, and does the break-and-restore checks and the repeat runs. A separate review agent comes after. There is no in-person check, as nothing on screen changes.
2. What if it turns out to be an app bug?
   Answer (agreed 2026-11-06): if the fix is small (a few lines of app code), fix it in this ticket's PR, with a test that fails without the fix and passes with it, and explain the bug in plain English in the PR. If the fix is bigger, stop and ask before changing app code.
3. If the cause is the shared `landNext()` helper, how far does the fix go?
   Answer (agreed 2026-11-06): fix the shared helper so it always lands a sliding card, protecting every test in the file that uses it. Re-check each affected test, and don't weaken any of them.

Possible Test Scenarios I would like to see:

When I run the card-slides tests 50 times in a row (e.g. `npx vitest run test/ui-tests/card-slides.test.tsx --repeat 50` or a loop), they pass every time

When I force the cause found (e.g. a fixed deck order or animation order), the old test fails and the fixed test passes

When I press Shuffle In Cards three times quickly and let the last card land, the Shuffled out count is 3, all three cards are in the list and none is left in the deck

Break-and-restore check: stop the last card from being counted when it lands, and see the test go red every time

Dependencies:
None. Do this after TEST4 and before TEST8 (order agreed 2026-11-05: TEST4, then TEST5, then TEST8).

Branch name Examples:
test/fix-flaky-shuffle-in-again-test
