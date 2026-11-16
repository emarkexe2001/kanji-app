Ticket Code:
CHORE6

Ticket Type:
Chore (refactor)

Feature Name: 
Split the Shuffled-Out View and Share the "Close on Outside Click" Logic

Origin:
Refactor retro (2026-11-16). `apps/web/src/features/deck/components/shuffled-out-view.tsx` is 567 lines, the biggest file in the app. It holds:
- the "Shuffled out (N)" button;
- the panel, with its Add back and Take out lists, Clear List confirmation and Recover button;
- the pick cards (`PickCard`, `PickCardBody`) with their forced-colours classes;
- the panel's place and look classes;
- its own code for closing on Escape or a click or tap outside (about 50 lines, with the "press started inside" rule from ADJ2_5).

`features/color-mode/components/color-mode-menu.tsx` has a separate copy of "close on Escape or a press outside", written differently (it closes on `pointerdown`, the panel on `click`).

Description:
As a developer I would like the shuffled-out view in smaller files, and one shared way to close a pop-up on Escape or an outside click, so each part is easy to find, read and change, and both pop-ups behave the same way.

Requirements / Expected Behaviours:
- `shuffled-out-view.tsx` is split into smaller files in `features/deck/components/`, e.g. `shuffled-out-button.tsx`, `shuffled-out-panel.tsx` and `pick-card.tsx`. The split is agreed in the questions.
- Closing on Escape or an outside click is one shared hook (e.g. `src/hooks/use-dismiss.ts`), used by the panel and by the colour mode menu. It keeps every rule each has today:
  - the panel: a press that starts inside and ends outside doesn't close it; presses on "Shuffled out (N)" and on anything marked `KEEP_PANEL_OPEN_ATTRIBUTE` don't count as outside;
  - the menu: Escape closes only the menu, not the panel behind it.
- Nothing the user sees or does changes. Every existing UI and e2e test passes unchanged.
- Each new file is under about 250 lines.

Possible Test Scenarios I would like to see:

All existing shuffled-out panel, colour mode menu and floating panel tests pass with no change to them

Unit or UI tests on the shared hook: Escape closes; a click outside closes; a click inside doesn't; a press that starts inside and ends outside doesn't; an element marked to be ignored doesn't

With the colour mode menu open over the open panel, Escape closes only the menu (existing test, keep it passing)

Break-and-restore check: remove the "press started inside" rule from the shared hook and see the ADJ2_5 test go red

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. Which split: button, panel and pick card files, or also a separate file for the panel's class constants?
   Answer (agreed 2026-11-16): Three files: `shuffled-out-button.tsx`, `pick-card.tsx` and `shuffled-out-panel.tsx`. The panel keeps its place and look class constants in its own file.
2. Should the colour mode menu close on `click` like the panel, or keep closing on `pointerdown`? Either way, the user shouldn't notice a change.
   Answer (agreed 2026-11-16): Keep each as it is. The shared hook has an option for each behaviour (the menu closes on `pointerdown`; the panel closes on `click`, with the "press started inside" rule), so nothing the user does changes.
3. CHORE tickets may skip the PR review agent (decided 2026-11-06), but this one changes app code. Should it still get a review agent?
   Answer (agreed 2026-11-16): Yes, it gets a PR review agent.

Mockup:
Changes nothing on screen.

Dependencies:
CHORE7 (shared button styles) and CHORE9 (DOM markers) touch the same file. Do them one after the other.

Branch name Examples:
chore/split-shuffled-out-view
