Ticket Code:
CHORE9

Ticket Type:
Chore (refactor)

Feature Name: 
One Shared File for the Page Markers the Deck Code Looks Up

Origin:
Refactor retro (2026-11-16). Parts of the deck find each other on the page by attributes, not by passing references:
- The "Shuffled out (N)" button is found with `` document.querySelector(`[aria-controls="${SHUFFLED_OUT_PANEL_ID}"]`) `` in three places: `shuffled-out-view.tsx` (`toggleButton` and the outside-click check) and `hooks/use-card-flights.ts` (`intoButton`).
- `use-card-flights.ts` (a hook) imports `SHUFFLED_OUT_PANEL_ID` from `components/shuffled-out-view.tsx` (a component), and `shuffled-out-view.tsx` imports types from the hook, so the two files depend on each other. `deck.tsx` and `use-panel-clearance.ts` use the id too.
- The card flights also look up `data-card-stack`, `data-slim`, `data-flight-source` and `data-flight-clip`, which are written as plain strings in several files.

Note (2026-11-16): CHORE6 splits `shuffled-out-view.tsx` into `shuffled-out-button.tsx`, `pick-card.tsx`, `shuffled-out-panel.tsx` and `shuffled-out-panel-footer.tsx`, and moves the close-on-outside code into `src/hooks/use-dismiss.ts`. If CHORE6 is merged, look for the code below in those files.

Description:
As a developer I would like the page markers the deck code looks up to be defined once, in one shared file, so a renamed marker can't quietly break the card animations or the panel, and hooks don't import from components.

Requirements / Expected Behaviours:
- The panel id, the button lookup and every `data-*` marker the deck code looks up are defined once, in one file in `features/deck/utils/` (e.g. `dom-markers.ts`), with a small helper for each lookup (e.g. `findShuffledOutButton()`).
- No hook imports from a component file.
- Nothing the user sees or does changes. Every existing UI and e2e test passes unchanged.

Possible Test Scenarios I would like to see:

All existing card slide, shuffled-out panel and floating panel tests pass with no change to them

No file in `features/deck/hooks/` imports from `features/deck/components/` (checked by lint, see question 1, or by a test)

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. Should an ESLint import rule stop hooks and utils from importing components (like the existing feature import rules, standards 3.4)?
   Answer (agreed 2026-11-18): Yes. Add an ESLint import rule that stops files in `features/*/hooks/` and `features/*/utils/` from importing from `features/*/components/`, next to the existing feature import rules.
2. Should refs (React `ref`s passed down) replace some of the page lookups instead? That is a bigger change.
   Answer (agreed 2026-11-18): No. Keep the page lookups, behind the helpers in the one shared file. Refs can be a later ticket if wanted.
3. CHORE tickets may skip the PR review agent (decided 2026-11-06), but this one changes app code. Should it still get a review agent?
   Answer (agreed 2026-11-18): Yes, as for CHORE6, CHORE7 and CHORE8.

Mockup:
Changes nothing on screen.

Dependencies:
CHORE6 (split shuffled-out view) touches the same files. Do them one after the other.

Branch name Examples:
chore/dom-markers-module

Completed On:
2026-11-18 (PR #120)
