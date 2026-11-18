Ticket Code:
CHORE11

Ticket Type:
Chore (refactor)

Feature Name:
Move the Plain Helpers out of lib/ into utils/

Origin:
PR #118 (CHORE10) review, finding R3 (2026-11-18). Standards 3.2 says `lib/` holds "small wrappers around browser APIs or libraries (e.g. storage)" and `utils/` holds "shared helper functions". `apps/web/src/utils/` doesn't exist, so plain helpers ended up in `lib/`:
- Wrappers, which fit `lib/`: `storage.ts` (the browser's saved settings) and `color-mode.ts` (saved settings and the page's `data-color-mode` attribute).
- Plain helpers, which belong in `utils/` by 3.2: `button-classes.ts`, `high-contrast-buttons.ts`, `keep-panel-open.ts` (an attribute name only) and `whole-number.ts` (the shared number check from CHORE10).

The user chose (2026-11-18) to change the code to match the standards, not the standards to match the code, once the other standards updates are in place.

Description:
As a developer I would like each file in `apps/web/src/` to sit in the folder standards 3.2 gives it, so I know where to find a helper and where to put a new one.

Requirements / Expected Behaviours:
- `button-classes.ts`, `high-contrast-buttons.ts`, `keep-panel-open.ts` and `whole-number.ts` move from `apps/web/src/lib/` to `apps/web/src/utils/`, with every import updated.
- `storage.ts` and `color-mode.ts` stay in `lib/`.
- Their unit tests move to match (`test/unit/lib/` → `test/unit/utils/`), and `docs/testing.md` names the new paths.
- Before moving anything, check every file in `apps/web/src/lib/` against standards 3.2 again, since the standards may have changed by then (see Dependencies). Re-check any file added after this ticket was written.
- Nothing the user sees or does changes. Existing tests may only change imports and their own path.

Possible Test Scenarios I would like to see:

typecheck, lint and every test pass after the move, with only import and path changes to tests

No file left in `apps/web/src/lib/` is a plain helper (only wrappers around browser APIs or libraries)

The built CSS is byte-identical before and after (the button class strings must still be found by Tailwind in their new place)

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. `keep-panel-open.ts` holds only an attribute name the panels look up on the page. Should it go to `utils/`, to `config/` (app-wide constants), or join a shared page markers file like CHORE9's `features/deck/utils/dom-markers.ts`?
2. Should a lint rule or test stop new plain helpers landing in `lib/`, or is the standards text enough?
3. CHORE tickets may skip the PR review agent (decided 2026-11-06), but this one changes app code. Should it still get a review agent, as CHORE6–CHORE10 did?

Mockup:
Changes nothing on screen.

Dependencies:
Start after the standards updates are in place, so the move follows the final standards. That means:
- the ARCH2 retro's docs PR moving the newer retro rules into standards §5 and `docs/testing.md`
- CHORE9 (PR #120), which adds `features/deck/utils/dom-markers.ts` and a lint rule on `utils/` imports
- CHORE5 (README), which may describe the folder layout

Branch name Examples:
chore/move-helpers-to-utils
