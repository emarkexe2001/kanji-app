## Ticket

<!-- Ticket code and a link to where the ticket ends up on main, e.g.
[FEAT2](../blob/main/docs/tickets/completed_tickets/FEAT2_card_shuffle_ticket.md)
The link works once the PR is merged (the ticket moves there in this PR).
Until then, the ticket is in the "Files changed" tab. -->

**Ticket:** [CODE](../blob/main/docs/tickets/completed_tickets/...)

## Summary

<!-- What changed and why, in a few short lines. List the main files or parts. -->

## Test Scenarios

<!-- One checkbox for each "Possible Test Scenario", each agreed answer and each
"left out" / "no X" item in the ticket (standards 4.2). Tick it when a test covers it.
Give the test file and the test name. If there is no test, say why, e.g.
"not covered yet – follow-up ticket TEST1". -->

**Possible Test Scenarios**

- [ ] Scenario – `path/to/file.test.tsx`, "test name"

**Agreed answers**

<!-- Delete if the ticket has no agreed answers. -->

- [ ] Answer – `path/to/file.test.tsx`, "test name"

**Left out ("no X")**

<!-- Delete if the ticket leaves nothing out. -->

- [ ] No X – `path/to/file.test.tsx`, "test name"

## Test counts

<!-- Number of tests in each suite, on main before this PR and after it. -->

| Suite | Before (main `abc1234`) | After |
|---|---|---|
| `@kanji/core` | | |
| web unit | | |
| web UI | | |
| scripts | | |

- [ ] `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test` and `npm run check:commits` all pass

## Break-and-restore

<!-- For each new test: break the code it covers, run the test, check it goes red,
then restore (commit first, standards 4.2). Quote the code you changed, not a line
number, as line numbers go stale. -->

| Break (file: `before` → `after`) | Tests run | Result | Restored, tree clean |
|---|---|---|---|
| `src/...`: `code` → `broken code` | `file.test.tsx` – "test name" | red: 1 failed | yes |

## Browser check

<!-- UI changes only. Delete if the PR changes nothing on screen.
The agent's check in a real browser at about 360px, 640px and 1024px wide
(standards 4.2 and 5.4): what was checked and the result. -->

## In-person check

<!-- UI changes only. Delete if the PR changes nothing on screen.
A person uses the app in a real browser and checks it matches the ticket, the agreed
answers and the mockup (standards 5.4). The PR stays a draft until this passes. -->

- **Checked by:**
- **Commit:**
- **Result:**

## After merging

<!-- Anything to do after merging, e.g. "run `npm install`, a dependency was added".
Delete if none. -->
