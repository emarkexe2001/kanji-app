Ticket Code:
PROC1

Feature Name: 
PR Test Scenario Checklist

Origin:
Retro of PR #1 (feature/card-limit). Two of that ticket's "Possible Test Scenarios" ("deck size shown should match the limit" and "shuffle keeps the deck size the same and removes an old card") were never tested, and nothing in the PR made that easy to spot.

Feature Description:
As a reviewer I would like every pull request to list each "Possible Test Scenario" from its ticket as a checklist, with each item linked to the test that covers it, so I can see at a glance whether the ticket has been fully tested before I approve the merge.

Feature Requirements / Expected Behaviours:
A pull request template is added at .github/pull_request_template.md
The template has a "Ticket" field (ticket code + link to the ticket file) and a "Test Scenarios" section
Each test scenario from the ticket is written as a checkbox with the name / path of the test that covers it
A scenario with no test must be explained in the PR (e.g. "not covered yet - follow-up ticket TEST1")

Possible Test Scenarios I would like to see:

When I open a new pull request on GitHub, the description is pre-filled with the template

The template contains the Ticket and Test Scenarios sections

Dependencies:
None - PROC2 adds to the same template

Branch name Examples:
chore/pr-template
