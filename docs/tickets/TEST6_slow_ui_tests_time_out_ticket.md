Ticket Code:
TEST6

Ticket Type:
Test

Test Name: 
Stop the Slowest UI Tests Timing Out as the Test Suite Grows

Origin:
FEAT5_1 (colour mode start page, 2026-11-03). While running the web UI tests, the FEAT5_1 test agent saw four existing tests time out at Vitest's default 5-second limit, in some full runs but not others:
- `back-button.test.tsx`: "Back remembers the last 50 cards I saw, then carries on in deck order"
- `shuffle-in.test.tsx`: "when I pick the N5 deck, every card in my deck is an N5 word"
- `shuffled-out.test.tsx`: "when I add a card back, it is shown and in my deck, it leaves the list, the card I picked to swap out moves to the list, and my deck size still matches my card limit"
- `deck.test.tsx`: "when I press Deck Shuffle, a different card from my deck is shown and no card enters or leaves the deck"

FEAT5_1 didn't cause this. On `main` (0911270) the same tests take 4–5 seconds even when they pass, and three of them timed out on `main` in a run with `--reporter=verbose` (which adds a little load). On the FEAT5_1 branch, which adds one more test file, two of four local full runs had 1–4 of them time out. A follow-on test in `shuffled-out.test.tsx` ("when I add several cards back at once…") then failed once as well, probably because the timed-out test was still running. Each test passes when run on its own. CI has passed so far. TEST4 is about a different slow test (in `shuffle-in-multiple.test.tsx`) and asked for a list of other tests near the limit; these are those tests.

Description:
As a developer I would like the tests to pass or fail only because of the code, so that adding new tests doesn't make old ones fail at random on a busy machine.

Requirements / Expected Behaviours:
- Find out why each of the four tests is slow (e.g. a 200-word library, many clicks with user-event, pressing Next through the whole deck) and say so in the PR.
- Make each one faster without checking less, e.g. a smaller library where the size doesn't matter, or fewer clicks for the same check. Split a test that checks several things into smaller tests, as in TEST4.
- If a test is still close to 5 seconds after that, give it its own longer time limit, with a comment saying why. Don't raise the limit for the whole suite.
- List in the PR every UI test over 2.5 seconds (from `npx vitest run --reporter=verbose`), before and after.
- The app's behaviour doesn't change.

Possible Test Scenarios I would like to see:

When I run the whole web UI test suite 10 times in a row on a developer machine, no test times out

When I run the four tests above, each still checks everything it checked before (the same assertions, or split across new tests)

When I break what each test checks (e.g. let Back keep 49 cards, or let Deck Shuffle add a card), the matching test still goes red

Dependencies:
None. Can be done before or after TEST4 and TEST5.

Branch name Examples:
test/speed-up-slow-ui-tests
