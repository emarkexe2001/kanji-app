Ticket Code:
TEST5

Ticket Type:
Test

Test Name: 
Fix the Flaky "Shuffle In Cards Again and Again" Test

Origin:
TEST2 (PR #54, 2026-10-30). While checking test counts, the TEST2 agent saw `apps/web/test/ui-tests/card-slides.test.tsx` fail in the test "pressing Shuffle In Cards again and again: every card ends up in the right place, with the right count". The failure was `expected 2 to be 3` at `expect(shownCount()).toBe(3)` after `landNext()`. It failed once in 8 runs on the TEST2 branch and once in 10 runs on main (69c48e5), so TEST2 didn't cause it. Neither the test nor the code it uses changed in PR #54. This is a different test from the one in TEST4.

Description:
As a developer I would like CI to pass or fail only because of the code, so that a test that fails at random doesn't block a pull request or hide a real bug.

Requirements / Expected Behaviours:
- Find out why the test sometimes fails, and say in the PR what the cause was and how it was proved (e.g. a run that fails every time once the cause is forced).
- One place to look first: `landNext()` finishes `sliding()[0]`, the oldest animation still running. If another animation (e.g. the new card dropping on, or the count bump) is sometimes older than the last sliding card, `landNext()` finishes that one instead, and the third card never lands. The deck order is random, so this might depend on which cards are drawn. This is only a guess and needs checking.
- If the cause is in the test, fix the test so it always checks the same thing (e.g. land the sliding card itself, or fix the deck order). Don't make the test weaker or remove checks.
- If the cause is in the app (a card can really fail to land or be counted), say so in the PR and ask before changing app behaviour.
- Check the other tests in `card-slides.test.tsx` that use `landNext()` or `sliding()[0]` for the same problem, and fix any that have it.
- The app's behaviour doesn't change, unless agreed after the point above.

Possible Test Scenarios I would like to see:

When I run the card-slides tests 50 times in a row (e.g. `npx vitest run test/ui-tests/card-slides.test.tsx --repeat 50` or a loop), they pass every time

When I force the cause found (e.g. a fixed deck order or animation order), the old test fails and the fixed test passes

When I press Shuffle In Cards three times quickly and let the last card land, the Shuffled out count is 3, all three cards are in the list and none is left in the deck

Break-and-restore check: stop the last card from being counted when it lands, and see the test go red every time

Dependencies:
None. Can be done before or after TEST4.

Branch name Examples:
test/fix-flaky-shuffle-in-again-test
