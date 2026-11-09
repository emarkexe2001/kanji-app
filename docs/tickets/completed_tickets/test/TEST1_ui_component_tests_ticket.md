Ticket Code:
TEST1

Feature Name: 
UI Component Tests + Testing Document

Origin:
Retro of PR #1 (feature/card-limit). Only the input-parsing logic was tested; there are no tests that check what the user actually sees on screen, and the standards ask for UI tests in a ui-tests folder plus a document describing the test types.

Feature Description:
As a developer I would like UI component tests for the web app, so that behaviour the user sees (number of cards shown, validation messages, shuffle) is tested and not just the logic behind it. I would also like a document that explains the different types of tests in the project.

Feature Requirements / Expected Behaviours:
Vitest + React Testing Library (or similar) set up for apps/web
UI tests live in apps/web/test/ui-tests/
docs/testing.md describes the test types used (unit tests, UI/component tests, e2e tests if/when added), where each lives and how to run them
npm test from the repo root runs the UI tests as well as the existing unit tests
Backfill the missing card-limit scenarios from the selectable-card_limit ticket

Possible Test Scenarios I would like to see:

When I set a card limit, the card deck size shown should match that limit

When I have a card limit and I shuffle in a new card, the card deck size stays the same and an old card is removed

When I enter a card limit of 0, a validation message is shown and the deck does not change

When I enter a card limit higher than 150, a validation message is shown and the deck does not change

When I press Next, a new card is shown

Dependencies:
Best done after TEST2 (test folder structure)

Branch name Examples:
test/ui-component-tests

Completed On:
2026-10-14 (PR #12)
