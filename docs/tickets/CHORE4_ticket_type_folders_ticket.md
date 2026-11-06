Ticket Code:
CHORE4

Ticket Type:
Chore

Feature Name: 
Sort Tickets into Ticket-Type Folders

Origin:
User request (2026-11-06). `docs/tickets/` has 15 open tickets and `docs/tickets/completed_tickets/` has 27 finished ones, all in one flat folder each, so tickets of the same type are hard to find together.

Description:
As a developer I would like every ticket, open or completed, to sit in a folder for its ticket type, so I can see at a glance which feature, test, tooling or process tickets there are, and new tickets have an obvious home.

Requirements / Expected Behaviours:
- Open tickets move from `docs/tickets/` into a folder for their type, and completed tickets move from `docs/tickets/completed_tickets/` into a folder for their type there:
  ```
  docs/tickets/
    example_ticket.md          (stays here: it is the template)
    feat/  adj/  ui/  test/  tool/  ci/  chore/  proc/  arch/
    completed_tickets/
      feat/  adj/  ui/  test/  tool/  ci/  chore/  proc/  arch/
  ```
- The type comes from the ticket code (standards 5.6): `FEAT` → `feat/`, `ADJ` → `adj/`, `UI` → `ui/`, `TEST` → `test/`, `TOOL` → `tool/`, `CI` → `ci/`, `CHORE` → `chore/`, `PROC` → `proc/`, `ARCH` → `arch/`. Follow-ups go with their parent (e.g. `FEAT2_5` in `feat/`).
- Only make a folder when a ticket goes in it. No empty folders.
- Move files with `git mv`, so each ticket keeps its history. File names don't change.
- Nothing in a ticket's text changes, apart from links or paths to other tickets that the move breaks.
- Everything that points at a ticket path is updated to the new path, including:
  - standards 5.4 ("Move finished tickets") and 5.6 (ticket types: add the folder for each type)
  - `.github/pull_request_template.md` (the Ticket link example and the §5 box)
  - `scripts/test/pull-request-template.test.ts` and `scripts/test/ticket-clarification.test.ts`
  - `docs/testing.md`
  - the comment in `apps/web/src/features/card-limit/utils/deck-size.ts`
  - links between tickets (e.g. in CHORE1 and PROC3)
- The standards say where new tickets go from now on: a new ticket goes in `docs/tickets/<type>/`, and when it is finished it moves to `docs/tickets/completed_tickets/<type>/` in its own PR, as today.
- A check stops tickets landing in the wrong place again: a scripts test that fails if a ticket file isn't in the folder for its code. Exceptions are `example_ticket.md` and any agreed under question 3.

Questions / Clarifications:
(Check this ticket against docs/standards/standards.md before starting.)
1. How are open and completed tickets laid out?
   Answer (agreed 2026-11-06): type folders in both places: `docs/tickets/<type>/` for open tickets and `docs/tickets/completed_tickets/<type>/` for completed ones. The rule "move finished tickets to `completed_tickets/`" stays.
2. What are the type folders called?
   Answer (agreed 2026-11-06): the lower-case ticket code: `feat/`, `adj/`, `ui/`, `test/`, `tool/`, `ci/`, `chore/`, `proc/`, `arch/`.
3. Two open tickets have no code: `card_category_ticket.md` and `selectable-card_limit_ticket.md`. The card limit looks already built (PR #1, `feature/card-limit`). Should they get codes, and where do they go?
   Answer: (to be agreed)
4. Merged PR descriptions and old daily diary entries link to the old paths (e.g. `../blob/main/docs/tickets/completed_tickets/FEAT2_...`). Leave those links as they are, or fix the diary links too? (Old PR descriptions can only be edited one by one on GitHub.)
   Answer: (to be agreed)
5. Which flow does this ticket follow?
   Answer: (to be agreed. Suggested: the lighter flow for docs and process tickets. One agent makes the change and its test, with break-and-restore, then a separate review agent, then the retro.)

Possible Test Scenarios I would like to see:

When I look in `docs/tickets/`, the only ticket file left at the top is `example_ticket.md`. Every other open ticket is in the folder for its code

When I look in `docs/tickets/completed_tickets/`, every ticket is in the folder for its code, and no ticket file is left at the top

When I run `git log --follow` on a moved ticket, its history from before the move is shown

When I search the repo (outside `.claude/` and `node_modules/`) for an old ticket path, nothing is found, apart from what was agreed under question 4

When I run `npm run test:scripts`, the new check passes. When I put a ticket in the wrong folder (e.g. a `TEST` ticket in `feat/`), or back at the top of `docs/tickets/`, it fails and names the file

When I run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test` and `npm run check:commits`, they all pass

Break-and-restore check: move one ticket to the wrong folder and see the new check go red, then move it back

Dependencies:
Start after TEST5's PR is merged, as TEST5 moves its own ticket into `completed_tickets/`. No other ticket PR should be open while this one is, because it moves every ticket file. Agree its place in the order (TEST5, then TEST8) before starting.

Branch name Examples:
chore/ticket-type-folders
