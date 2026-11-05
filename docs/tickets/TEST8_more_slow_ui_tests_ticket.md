Ticket Code:
TEST8

Ticket Type:
Test

Test Name: 
Speed Up the Other UI Tests Still Over 3.5 Seconds

Origin:
TEST6 (slow UI tests timing out, 2026-11-05). TEST6 sped up the four slowest UI tests. As agreed for TEST6, any other UI test still over 3.5 seconds afterwards gets a follow-up ticket. In full runs of the web UI tests on a developer machine (Windows, `npx vitest run --reporter=verbose` in `apps/web`), these were over 3.5 seconds in at least one run (the TEST6 PR lists every run):
- `back-button.test.tsx`: "when I press Back, the "Card X of Y" counter shows the card I went back to, and my deck has not changed" (about 3.9–4.1 seconds)
- `shuffled-out-header.test.tsx`: "when I add cards back from the panel in its new place, they are in my deck, the same as before" (about 3.5–3.8 seconds)
- `shuffled-out.test.tsx`: "when I add several cards back at once, they are all in my deck and my deck size still matches my card limit" (about 3.4–3.6 seconds)
- `shuffle-in-multiple.test.tsx`: "a card in two ticked decks (e.g. JLPT N4 and Common words) is only counted and shuffled in once" (about 3.5–4.0 seconds). TEST4 is also changing this file, so do this one after TEST4 is merged.

TEST6 found the main cause: user-event waits for the next turn of the event loop after every click or key press. On Windows that wait is about 12ms (the timer's tick), and more on a busy machine, so a test with many clicks spends most of its time waiting. Walking the whole deck with Next (`deckContents`) is 10 clicks each time. TEST6 added `NO_PAUSE` to `helpers.tsx` (user-event without that wait) and split tests that walked the deck twice. See "Keeping UI tests fast" in `docs/testing.md`.

Description:
As a developer I would like the tests to pass or fail only because of the code, so that adding new tests doesn't make old ones fail at random on a busy machine.

Requirements / Expected Behaviours:
- Find out why each test above is slow and say so in the PR.
- Make each one faster without checking less, as in TEST6: `NO_PAUSE`, fewer user-event calls for the same check (e.g. several keys in one `user.keyboard` call), or splitting a test that checks several things into smaller tests.
- A test still over 2.5 seconds after that gets its own 15-second limit, with a comment saying why. Don't raise the limit for the whole suite.
- List in the PR every UI test over 2.5 seconds (from `npx vitest run --reporter=verbose`), before and after.
- Don't change `card-slides.test.tsx` (TEST5 owns it).
- The app's behaviour doesn't change.

Possible Test Scenarios I would like to see:

When I run the whole web UI test suite 10 times in a row (`npm run test:ui:repeat -w @kanji/web`), no test times out

When I run the tests above, each still checks everything it checked before (the same assertions, or split across new tests)

When I break what each test checks, the matching test still goes red

Dependencies:
TEST6. The `shuffle-in-multiple.test.tsx` test waits for TEST4.

Branch name Examples:
test/speed-up-more-slow-ui-tests
