Ticket Code:
TEST15

Ticket Type:
Test (refactor)

Test Name: 
Make the Docs Tests Check Structure, Not Exact Wording

Origin:
Test refactor check (2026-11-16). Several scripts tests read the repo's docs and check exact phrases in them:
- `scripts/test/pull-request-template.test.ts`: 466 lines, 75 `assert.match` / `assert.doesNotMatch` checks on the PR template and standards.
- `scripts/test/ticket-clarification.test.ts`: 20 such checks, on the standards, the example ticket and a completed ticket.
- `scripts/test/e2e-setup.test.ts`: 19 such checks, on `docs/testing.md` and other files.

They were added by PROC and TEST tickets to make sure a rule really landed in the docs, and they have caught real gaps (e.g. PROC5's old-wording check). But many check an exact phrase, so rewording a sentence, even without changing the rule, breaks a test and turns a docs-only pull request into a test change. Some also check that old wording is gone, which adds up as rules change.

Description:
As a developer I would like the docs tests to check that each rule and section is there, not the exact sentence, so I can reword the docs freely and the tests still catch a missing rule or section.

Requirements / Expected Behaviours:
- Review every text check in `scripts/test/` that reads a doc, and sort each into one of:
  - **structure** (a section, box, heading or order exists): keep;
  - **key term** (a rule's key words, e.g. "docs-only", `gh pr ready`, "Completed On"): keep, matched loosely (case, spacing, line breaks);
  - **exact phrase or old wording**: drop, or loosen to a key term.
  The sorted list, with the reason for each, goes in the PR.
- Tests that check real behaviour (e.g. `check-commit-message`, `docs-only-changes`, `repeat-ui-tests`) are not touched.
- Every rule a test checks today is still checked by something, unless the user agrees to drop it.
- A guide in `docs/testing.md` says how to write a docs test: check structure and key terms, not sentences.

Possible Test Scenarios I would like to see:

When I reword a sentence in the standards or PR template without changing its rule, the scripts tests still pass (shown in the PR with a throwaway rewording)

When I delete a rule or section the tests cover (e.g. the Standards Check section, the "Questions / Clarifications" step, the docs-only rule), a scripts test goes red (break-and-restore, one per kept test group)

The scripts tests still pass on main's docs

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. Should the "old wording is gone" checks (`assert.doesNotMatch`) all be dropped, or kept for a while after each rule change?
2. Should the agent bring the sorted list to the user for approval before dropping any check?

Mockup:
Changes nothing on screen.

Dependencies:
None. Not at the same time as a ticket that changes the standards or the PR template (e.g. PROC6).

Branch name Examples:
test/lighter-docs-wording-tests
