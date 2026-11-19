Ticket Code:
TEST11

Ticket Type:
Test

Test Name: 
Fix the Flaky "Deck Shuffle… the Deck Is Not Saved Again" Test

Origin:
CHORE6 and CHORE7 (PRs #93 and #97, 2026-11-16). This test in `apps/web/test/ui-tests/new-card-badge.test.tsx` sometimes fails:

```ts
test('when I press Deck Shuffle on a deck with no new cards, the deck is not saved again', async () => {
  const user = await renderApp(DECKS);
  const setItem = vi.spyOn(Storage.prototype, 'setItem');
  for (let i = 0; i < 3; i++) await user.click(deckShuffleButton());
  expect(deckSaves(setItem)).toHaveLength(0);
```

Each time it saw **1 deck save where it expected 0**. It never timed out, so it is not one of the slow tests in TEST8. What was seen:
- On untouched main, during CHORE6: failed once in a full `npm test` run. The file then passed 20 of 20 on its own.
- On the CHORE7 branch: failed once in a full run, then passed 20 of 20 three times on its own.
- 30 runs of the file on its own (CHORE7 test agent):

  | Code | Where it ran | Failures |
  |---|---|---|
  | CHORE7 branch | PR worktree, 3 rounds | 1, 2 and 0 (3 of 90) |
  | main | main checkout, 2 rounds | 0 and 0 (0 of 60) |
  | main `d6c4ffb` | PR worktree | 2 of 30 |

  So main's code fails too, and how often depends on where it runs. CHORE7 only changed class names, so it isn't the cause.

**Possible cause (a guess, not checked):** the spy on `setItem` starts straight after `renderApp`. If the app's own save of the deck it just loaded (the `saveDeck` effect in `use-study-deck.ts`) hasn't run yet on a busy machine, the spy counts it. That is like TEST4, where the app's own save ran later than the test expected. The other "is not saved again" tests in the same `describe` block have the same shape, so they may be flaky too.

**Cause found (TEST11, 2026-11-19):** the guess was right, and it is the test, not the app. The app's save of the deck it just opened runs in an effect, which React runs in a later turn of the event loop. Testing Library's `findByText` (inside `renderApp`) also ends by waiting one turn. Whichever of the two runs first decides whether that save lands before or after the test's spy starts, so the result depends on how busy the machine is. Proved by forcing it: with the app's first save made to run two turns late (a throwaway change), both "Next" and "Deck Shuffle" tests failed 20 of 20 with the same "got 1" error, and with TEST4's `performance.now` trick the "Next" test failed 20 of 20. The fixed tests passed 20 of 20 under each. The app saves the deck once when it opens and never again after Next or Deck Shuffle when nothing changed. The "one new card" test isn't affected: its spy starts after clicks, and React runs the effects before each click returns. The `shuffled-out.test.tsx` failures are not this cause (those tests don't count saves); they are TEST8's slowness, and their evidence is now in TEST8.

Also seen, maybe related: two `shuffled-out.test.tsx` tests ("when I add several cards back at once…", about 5.1s, and "when I reload the app, the shuffled-out list is still there") failed in 2 full runs while a CHORE7 break was in place. The file passed 43 of 43 on its own. The error text wasn't captured. Check whether this is the same cause or TEST8's slowness.

Description:
As a developer I would like this test to pass every time unless the app really saves the deck again, so a red run always means a real problem and nobody has to re-run CI to get past it.

Requirements / Expected Behaviours:
- Find the cause and prove it, as TEST4 and TEST5 did: make it fail on purpose (e.g. delay the app's save effect, or make React's scheduler yield after every task) so the old test fails every time, and show the fixed test passes every time under the same conditions.
- Once the cause is found, add a "Cause found:" line to this Origin, so the guess above isn't left standing.
- If the cause is the test, fix the test only. If the app really saves the deck again when nothing changed, stop and report it, as that's an app bug for its own ticket.
- Check the other "is not saved again" tests in `new-card-badge.test.tsx` for the same problem, and fix them the same way if they have it.
- Check whether the `shuffled-out.test.tsx` failures share the cause. If they don't, note them in TEST8 or a new ticket instead.
- Update `docs/testing.md` if the fix gives a rule other tests should follow (e.g. "wait for the app's first save before spying on storage").
- **Added 2026-11-16 (CHORE7 retro):** add Dark mode checks for the two filled buttons the Dark tests don't cover yet: "Yes, Clear List" and "Recover cleared list (N)". `color-mode.test.tsx` checks 5 of the 7 filled buttons in Dark. Check each of the two has its Dark look, the same way the other 5 are checked. Tests only, no app change.

Possible Test Scenarios I would like to see:

When the app's first save is forced to run late, the old test fails every time and the fixed test passes every time (e.g. 20 of 20 each)

When I run `new-card-badge.test.tsx` on its own 50 times, every run passes

When I run the full web UI tests 10 times (`npm run test:ui:repeat`), this test passes every time

When the app really does save the deck again after Deck Shuffle on a deck with no new cards (a break), the fixed test goes red (break-and-restore)

When the app is in Dark mode, "Yes, Clear List" and "Recover cleared list (N)" each have their Dark look (added 2026-11-16), and a break in either button's colours turns its test red

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. If the `shuffled-out.test.tsx` failures turn out to be TEST8's slowness, should they be added to TEST8 or left alone?
   Answer (agreed 2026-11-19): Add them to TEST8 with the evidence (test names, times, error text), so they are fixed with the other slow tests.

Mockup:
Changes nothing on screen.

Dependencies:
None. Can be done alongside TEST8, but not at the same time as it if both change `new-card-badge.test.tsx`.

Branch name Examples:
test/flaky-deck-not-saved-again
