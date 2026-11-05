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

Questions / Clarifications:
1. Which tests are in scope: only the four named above, or every UI test near the limit?
   Answer (agreed 2026-11-05): speed up only the four named tests. List every UI test over 2.5 seconds before and after in the PR. Any other test still over 3.5 seconds afterwards gets a follow-up ticket, written in the same PR (and the PR says so). Don't touch `shuffle-in-multiple.test.tsx` (TEST4 owns it) or `card-slides.test.tsx` (TEST5).
   Note (agreed 2026-11-05, after the first 10 runs): the scope grew to two more tests, back-button "when I press Back, the "Card X of Y" counter shows the card I went back to, and my deck has not changed" and shuffled-out-header "when I add cards back from the panel in its new place, they are in my deck, the same as before". Each timed out at 5 seconds in the first run of `npm run test:ui:repeat`, so without them the scenario "10 runs in a row, no test times out" couldn't pass. The other slow tests stay in TEST8.
2. What counts as "still close to 5 seconds", and how long is a test's own time limit?
   Answer (agreed 2026-11-05): a test still over 2.5 seconds after speeding up gets its own 15-second limit (the per-test timeout argument, not one for the whole suite), with a comment saying why.
3. How is "the whole web UI test suite 10 times in a row" shown?
   Answer (agreed 2026-11-05): a table in the PR of 10 full runs on the final commit (each run's pass or fail and its slowest test's time), and a repeat script (`npm run test:ui:repeat` in `apps/web`) that runs the UI suite N times (10 by default) and stops with a failure at the first failing run. It works on Windows (Git Bash) and Linux (CI), has its own test (run by `npm run test:scripts`) and is described in `docs/testing.md` in the same commit.
4. Which flow does this ticket follow?
   Answer (agreed 2026-11-05): a lighter flow. One agent does the speed-ups, the break-and-restore checks and the 10 runs, and a separate review agent comes after. There is no in-person check, as nothing on screen changes.

Dependencies:
None. Can be done before or after TEST4 and TEST5.

Branch name Examples:
test/speed-up-slow-ui-tests

Completed On:
2026-11-05 (PR #67)
