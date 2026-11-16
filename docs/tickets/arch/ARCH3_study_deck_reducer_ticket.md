Ticket Code:
ARCH3

Ticket Type:
Architecture (refactor)

Feature Name: 
Turn the Study Deck Hook Into a Reducer

Origin:
Refactor retro (2026-11-16). `apps/web/src/features/deck/hooks/use-study-deck.ts` is 414 lines and holds the whole study deck's state in one `useState`. Its actions are written in two different styles:
- `next`, `back`, `deckShuffle`, `chooseDeck`, `setChoice`, `clearShuffledOut` and `recoverCleared` work only inside `setState((s) => …)`, from the latest state.
- `setLimit`, `shuffleIn` and `addBack` first work out the result from `state` (the state at the last render), then apply it inside `setState((s) => …)` along with values from `s`. Today this is safe because React re-renders between two clicks. But the two states could disagree if two actions ever ran before a re-render, and the mix makes the code harder to follow.
- Only `next`, `back` and `deckShuffle` are stable (`useCallback`). Every other action, and `decks` and `sources`, is a new function or array each render.

The card limit also has two owners. `useCardLimit` (`features/card-limit/hooks/use-card-limit.ts`) holds and saves it, and the study deck keeps its own copy (`StudyState.limit`). `apps/web/src/app/app.tsx` has to call both (`setLimit(size); study.setLimit(size);`) to keep them the same.

Description:
As a developer I would like every study deck action to be one pure, tested function of the current state, so the deck's rules are easy to follow and change, and can't act on an old state.

Requirements / Expected Behaviours:
- The study deck's state changes go through one reducer (`useReducer`), with one action for each of today's changes (next, back, deck shuffle, choose deck, set limit, set choice, clear unticked, shuffle in, add back, clear list, recover cleared).
- The reducer is a plain function in `features/deck/utils/` with no React in it, like `study-deck.ts`, and is covered by unit tests (`test/unit/deck/`).
- Each action works only from the state the reducer is given. Nothing reads the state from the last render.
- Actions that can fail (shuffle in, add back) still return their message to the caller, and change nothing when they fail.
- The actions and the `decks` and `sources` lists are stable between renders unless what they depend on changes.
- The card limit has one owner. The agreed owner holds it, saves it (`kanji.deckSize`) and keeps the deck the right size. `app.tsx` makes one call.
- Randomness (`Math.random`) and time (`Date.now`) are passed in, so the reducer tests can fix them.
- Nothing the user sees or does changes. Saved data stays the same, and every existing UI and e2e test passes unchanged.

Possible Test Scenarios I would like to see:

Unit tests on the reducer for each action: next, back (with and without history), deck shuffle, choose deck, set limit up and down, set choice, shuffle in (success and each error), add back (success and each error), clear list and recover

When two Shuffle In Cards actions run one after the other with no render between them, the second works from the first's result (unit test on the reducer)

When I change the card limit, the deck size, the saved limit and "Card X of N" all change together, with one call from the app (UI test)

All existing UI tests and e2e tests pass with no change to them

Break-and-restore check: break one reducer action (e.g. shuffle in leaves the card on screen) and see its unit test and the matching UI test go red

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. Which should own the card limit: the study deck (and `useCardLimit` is removed), or the card-limit feature (and the study deck takes the limit only as an input)? Standards 3.4 says features don't import from each other, so it may need to move through `app/`.
2. Should the saving (the `useEffect`s that write to storage) stay in the hook, or move into a small separate hook?
3. Should this wait until ARCH4 (storage keys) is done, or go first?

Mockup:
Changes nothing on screen.

Dependencies:
Best done before FEAT7, FEAT8 and FEAT9, which all add state to the study deck. CHORE8 (missing card types) touches the same hook. Do them one after the other, not at the same time.

Branch name Examples:
chore/study-deck-reducer
