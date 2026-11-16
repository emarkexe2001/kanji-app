Ticket Code:
CHORE7

Ticket Type:
Chore (refactor)

Feature Name: 
One Place for the Button Styles

Origin:
Refactor retro (2026-11-16). The filled, colour-coded buttons (standards §1) build their classes by hand each time: a background, a hover colour, white text, padding, rounding, shadow and `active:scale-95`, plus the matching High contrast class from `features/deck/utils/high-contrast-buttons.ts` (`HC_SKY_BUTTON`, `HC_INDIGO_BUTTON`, `HC_EMERALD_BUTTON`, `HC_ROSE_BUTTON`). That pairing is written out 7 times across `deck.tsx`, `shuffle-in-control.tsx` and `shuffled-out-view.tsx`. A new button has to copy one and remember its High contrast class. `high-contrast-buttons.ts` also sits in the deck feature, so other features (e.g. UI4's Try again in `app/`) can't use it under standards 3.4.

Description:
As a developer I would like one way to make a colour-coded button, with its Light, Dark and High contrast looks built in, so every button looks and behaves the same and new buttons can't miss a mode.

Requirements / Expected Behaviours:
- One helper or component in a shared folder (e.g. `src/components/button.tsx` or `src/lib/button-classes.ts`) gives each button colour (sky, indigo, emerald, rose, and the Next and Back styles if agreed) and size (header, panel, full width) with its High contrast look.
- Every filled button in the app uses it. `high-contrast-buttons.ts` moves to the shared place or is folded into it.
- The colour rule from standards §1 is noted next to it (e.g. rose is for deleting and other dangerous actions).
- Nothing on screen changes in any mode. The rendered classes may change, but how each button looks doesn't.
- Every existing UI, e2e and colour mode test passes unchanged.

Possible Test Scenarios I would like to see:

All existing high contrast, colour mode and button tests pass with no change to them

Each variant gives its High contrast classes (unit or UI test on the helper)

Screenshots of every button in Light, Dark and High contrast, before and after, show no change (agent browser check, noted in the PR)

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. A `<Button variant="…">` component, or a `buttonClass(variant)` helper that keeps plain `<button>` elements?
   Answer (agreed 2026-11-16): A `buttonClass(variant, size)` helper in `src/lib/`, used on plain `<button>` elements.
2. Should Next, Back, the panel's Cancel and the stepper buttons (− +) use it too, or only the filled colour buttons?
   Answer (agreed 2026-11-16): Only the filled colour buttons: Shuffled out, Deck Shuffle, Shuffle In Cards, Add Back Cards, Clear List, Yes, Clear List and Recover cleared list. Next, Back, Cancel and the stepper buttons keep their own styles.
3. CHORE tickets may skip the PR review agent (decided 2026-11-06), but this one changes app code. Should it still get a review agent?
   Answer (agreed 2026-11-16): Yes, it gets a PR review agent.

Mockup:
Changes nothing on screen.

Dependencies:
UI4 (Try again button) could use it, so doing this first helps. CHORE6 touches the same files.

Branch name Examples:
chore/shared-button-styles
