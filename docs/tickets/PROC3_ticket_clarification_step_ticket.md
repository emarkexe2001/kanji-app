Ticket Code:
PROC3

Feature Name: 
Ticket Clarification Step Before Coding

Origin:
Retro of PR #1 (feature/card-limit). The ticket was titled "Card Categories" but described the card limit, and the standards say a deck needs "at least 1-5 cards" while the ticket says the minimum is 1. Work started without asking about either, even though the standards say to ask questions when a ticket needs clarifying.

Feature Description:
As the ticket author I would like any mismatch between a ticket and the standards (or within the ticket itself) to be raised as a question before any code is written, so that the feature is built to what I actually want.

Feature Requirements / Expected Behaviours:
A "Questions / Clarifications" section is added to the ticket format (and to example_ticket.md)
Before starting a ticket, the developer reads the ticket against docs/standards/standards.md and writes any conflicts or unclear points in that section
Answers are written back into the ticket so the decision is recorded
The Other Standards section of standards.md is updated to describe this step
Fix the existing issues found: the selectable-card_limit ticket's Feature Name should be "Selectable Card Limit", and the minimum deck size should be agreed (1 or 5) and made the same in the ticket and the standards

Possible Test Scenarios I would like to see:

When I open example_ticket.md, it contains a Questions / Clarifications section

When I read the standards and the card limit ticket, they agree on the minimum deck size

Dependencies:
None

Branch name Examples:
docs/ticket-clarification-step
