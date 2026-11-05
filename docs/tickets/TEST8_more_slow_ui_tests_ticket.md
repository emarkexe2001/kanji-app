Ticket Code:
TEST8

Ticket Type:
Test

Test Name: 
Speed Up the Other UI Tests Still Over 3.5 Seconds

Origin:
TEST6 (slow UI tests timing out, 2026-11-05). TEST6 sped up the four slowest UI tests. As agreed for TEST6, any other UI test still over 3.5 seconds afterwards gets a follow-up ticket. In full runs of the web UI tests on a developer machine (Windows, `npx vitest run --reporter=verbose` in `apps/web`), these were over 3.5 seconds in at least one of the 10 runs on the TEST6 branch, before the TEST6 scope change (the TEST6 PR lists every run). Two more tests that timed out at 5 seconds there (back-button "Card X of Y" and shuffled-out-header "add cards back from the panel") were fixed in TEST6 instead:
- `shuffled-out.test.tsx`: "when I add several cards back at once, they are all in my deck and my deck size still matches my card limit" (3.3–4.3 seconds)
- `new-card-badge.test.tsx`: "when I shuffle in cards, the cards that were shuffled in show a "New" badge" (3.0–4.2 seconds)
- `new-card-badge.test.tsx`: "when I shuffle in several cards, the ones I haven't seen yet still show "New" until I have seen each one and moved on" (2.6–3.6 seconds)
- `missing-card-data.test.tsx`: "when a card's data is missing completely, that card shows "This card can't be shown." and the other cards, Add Back and the deck still work" (2.4–3.7 seconds)
- `shuffle-in-multiple.test.tsx`: "a card in two ticked decks (e.g. JLPT N4 and Common words) is only counted and shuffled in once" (3.6–4.4 seconds) and "when I shuffle in several cards from multiple decks, my deck size still matches my card limit and the card that was on screen is gone" (2.1–3.8 seconds). TEST4 is also changing this file, so do these after TEST4 is merged.
- `card-slides.test.tsx`: "the cards end up in the shuffled-out list, the same as before" (2.4–4.0 seconds). TEST5 owns this file, so do this one after TEST5 is merged.

TEST6 found the main cause: user-event waits for the next turn of the event loop after every click or key press. On Windows that wait is about 12ms (the timer's tick), and more on a busy machine, so a test with many clicks spends most of its time waiting. Walking the whole deck with Next (`deckContents`) is 10 clicks each time. TEST6 added `NO_PAUSE` to `helpers.tsx` (user-event without that wait) and split tests that walked the deck twice. See "Keeping UI tests fast" in `docs/testing.md`.

Description:
As a developer I would like the tests to pass or fail only because of the code, so that adding new tests doesn't make old ones fail at random on a busy machine.

Requirements / Expected Behaviours:
- Find out why each test above is slow and say so in the PR.
- Make each one faster without checking less, as in TEST6: `NO_PAUSE`, fewer user-event calls for the same check (e.g. several keys in one `user.keyboard` call), or splitting a test that checks several things into smaller tests.
- A test still over 2.5 seconds after that gets its own 15-second limit, with a comment saying why. Don't raise the limit for the whole suite.
- List in the PR every UI test over 2.5 seconds (from `npx vitest run --reporter=verbose`), before and after.
- Change `card-slides.test.tsx` only after TEST5 is merged (TEST5 owns it until then).
- The app's behaviour doesn't change.

Possible Test Scenarios I would like to see:

When I run the whole web UI test suite 10 times in a row (`npm run test:ui:repeat -w @kanji/web`), no test times out

When I run the tests above, each still checks everything it checked before (the same assertions, or split across new tests)

When I break what each test checks, the matching test still goes red

Dependencies:
TEST6. The `shuffle-in-multiple.test.tsx` tests wait for TEST4, and the `card-slides.test.tsx` test waits for TEST5.

Branch name Examples:
test/speed-up-more-slow-ui-tests
