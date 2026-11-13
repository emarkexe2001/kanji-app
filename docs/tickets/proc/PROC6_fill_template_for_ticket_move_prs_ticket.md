Ticket Code:
PROC6

Feature Name: 
Say How a Ticket Move Pull Request Fills In the Template

Origin:
PROC5 follow-up (2026-11-13). PROC5 (PR #85) made ticket moves happen only after the ticket's pull request merges, in a separate follow-up pull request (standards 5.4). The PR template was written for pull requests that do a ticket's work, so it doesn't fit a move pull request:
- The §5 Standards Check box says "ticket not moved in this PR (it moves after merging, standards 5.4)", but moving tickets is the whole point of a move pull request. In PR #87 (the PROC5 move) the sweep agent ticked the box and added "this is the follow-up move PR for #85, so moving PROC5 is its purpose".
- The Ticket link is meant to point to the open folder `docs/tickets/<type>/`, but a move pull request's ticket is leaving that folder. PRs #84 and #87 pointed it at `completed_tickets/<type>/` and added "The link works once this PR is merged". One move pull request can move several tickets, and the template has room for one.
- Standards 5.4's example shows `Completed On: 2026-10-30 (PR #58)` on one line, but every ticket in `completed_tickets/` (e.g. TEST7, PROC4) puts `Completed On:` on its own line with the date and PR on the next. The sweep agents copied the files, not the standard.
Each agent so far has made up its own answer. The next one may make up a different one.

Feature Description:
As the developer I would like the standards and the PR template to say how a ticket move pull request fills in the template, so every move pull request looks the same and no agent has to guess.

Feature Requirements / Expected Behaviours:
- Standards 5.4 says how a move pull request fills in the §5 box (see question 1).
- Standards 5.4 says what a move pull request puts in the Ticket field, including when it moves several tickets (see question 2).
- The PR template's §5 box and Ticket comment point move pull requests to that part of 5.4, without making the template longer than a line or two.
- Standards 5.4's `Completed On:` example and the tickets in `completed_tickets/` use the same layout (see question 3).
- `scripts/test/pull-request-template.test.ts` checks the new wording, and each new check is shown to fail when the wording is broken.
- Nothing else in the standards, the template or the app changes. Past move pull requests (#79, #84, #87) aren't edited.

Possible Test Scenarios I would like to see:

When I read standards 5.4, it says how a move pull request fills in the §5 box and the Ticket field

When I open a new pull request from the template, the §5 box and the Ticket comment point move pull requests to standards 5.4

When I compare the `Completed On:` example in standards 5.4 with the tickets in `completed_tickets/`, they use the same layout

Questions / Clarifications:
1. How should a move pull request fill in the §5 box? Options: (a) tick it with a short note, "this is the follow-up move PR for #n", as PR #87 did; (b) change the box to "ticket not moved in this PR, unless this is a follow-up move PR (standards 5.4)" so it can be ticked as it is.
2. What goes in a move pull request's Ticket field? Options: (a) the code of each moved ticket, linked to its new `completed_tickets/<type>/` path, with "(work merged in PR #n)" and "The link works once this PR is merged", as PRs #84 and #87 did; (b) "None: ticket move" plus a list of the moved tickets in the Summary.
3. Which `Completed On:` layout is right? Options: (a) two lines, as every ticket in `completed_tickets/` has it, and change the 5.4 example to match; (b) one line, as in the 5.4 example, and leave existing tickets as they are.

Dependencies:
PROC5 (PR #85, merged 2026-11-13). Best done after the PROC5 move pull request (#87) is merged.

Branch name Examples:
docs/move-pr-template
