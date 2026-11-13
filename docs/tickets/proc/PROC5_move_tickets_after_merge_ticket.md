Ticket Code:
PROC5

Feature Name: 
Move Finished Tickets After Their PR Is Merged

Origin:
FEAT5 retro (2026-11-11). FEAT5's ticket stayed in the open folder for 12 days after its PR (#58) merged, because the move was put off "until after merging" and nobody owned it. It was moved by PR #79. The user then changed the rule on 2026-11-11: moving a ticket during development made it look complete while its PR still had work outstanding. Tickets now move only after their PR is merged, in a separate follow-up PR, and a check before each new task finds any that were missed. Found as R8 in the TEST7 review (PR #80): the standards and the PR template still describe the old rule.

Feature Description:
As the developer I would like the standards and the PR template to say that a ticket moves to `completed_tickets/` only after its PR is merged, in its own follow-up PR, so the open folder never shows a ticket as complete while its work is still in review, and agents follow the same rule.

Feature Requirements / Expected Behaviours:
- Standards 5.4 "Move finished tickets" says: a ticket moves from `docs/tickets/<type>/` to `docs/tickets/completed_tickets/<type>/` with `git mv` only after its pull request is merged, in a separate follow-up pull request from a `docs/` branch. The ticket's own pull request never moves it. The `Completed On:` line gives the date the ticket's pull request was merged and its number, e.g. `Completed On: 2026-10-30 (PR #58)`.
- Standards 5.4 says a ticket isn't complete until its pull request is merged.
- Standards 5.4 describes the check before starting a new task: compare every ticket still in `docs/tickets/<type>/` with merged pull requests, and open a follow-up pull request moving each ticket whose work is merged. PRs that only add or edit the ticket don't count.
- The 5.4 "Layout review before merging" bullet no longer says "merging the PR marks its ticket complete".
- Standards 5.6 "Where tickets go" says finished tickets move after merging, in a follow-up pull request (see 5.4).
- The PR template's §5 Standards Check box no longer asks for "ticket moved to `completed_tickets/<type>/`". It asks that the ticket is not moved in this PR.
- The PR template's Ticket link points to the open folder, `../blob/main/docs/tickets/<type>/...` (see question 1). Standards 5.4 says the follow-up PR also edits each merged PR's Ticket link to point to `completed_tickets/<type>/`, and that one follow-up PR moves every finished ticket the check finds, one commit per ticket (see question 2).
- `scripts/test/pull-request-template.test.ts` and any other scripts tests that check this wording are updated, and each changed check is shown to fail when the wording is broken.
- Nothing else in the standards or the app changes.

Possible Test Scenarios I would like to see:

When I read standards 5.4, it says a ticket moves only after its PR is merged, in a separate follow-up PR, with the merge date in `Completed On:`

When I read standards 5.4, it describes the check for finished tickets before starting a new task

When I read standards 5.4 and 5.6, nothing says the ticket's own PR moves it or that merging the PR marks it complete

When I open a new pull request from the template, the §5 box asks that the ticket is not moved in this PR, and the Ticket link points to the open folder

When a follow-up PR moves finished tickets, each merged PR's Ticket link is edited to point to `completed_tickets/<type>/`

Questions / Clarifications:
1. The PR template's Ticket link points to `../blob/main/docs/tickets/completed_tickets/<type>/...`. With the new rule the ticket is still in `docs/tickets/<type>/` when the PR merges, so that link is broken until the follow-up PR merges, and a link to the open folder breaks after it. Where should it point?
   Answer (agreed 2026-11-11): to the open folder, `../blob/main/docs/tickets/<type>/...`, as it is when the PR is opened. The follow-up PR that moves the ticket also edits the merged PR's description (`gh pr edit`) so its Ticket link points to `completed_tickets/<type>/`.
2. Should the follow-up be one PR per ticket, or one PR that moves every finished ticket found by the check?
   Answer (agreed 2026-11-11): one PR for every finished ticket the check finds, with one commit per ticket.

Dependencies:
TEST7 (PR #80) must be merged first, as it also edits standards 5.3/5.4 and the PR template's checks line.

Branch name Examples:
docs/move-tickets-after-merge
