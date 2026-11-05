Ticket Code:
PROC2

Feature Name: 
PR Standards Check Section

Origin:
Retro of PR #1 (feature/card-limit). The PR broke two written standards without anyone noticing: tests were placed in src/ instead of a test folder, and the UI still showed the total number of words ("of 17,400 words") which the UI standards say should be hidden.

Feature Description:
As a reviewer I would like every pull request to include a short "Standards Check" so the author confirms the change follows docs/standards/standards.md before asking for review.

Feature Requirements / Expected Behaviours:
The pull request template (from PROC1) gets a "Standards Check" section with checkboxes for:
- UI Standards (consistent header/footer/font, colour-coded buttons, only shows info the user needs)
- Test Standards (scenarios covered, validation messages tested, all tests pass)
- Folder Structure Standards (code / tests / docs in their correct folders)
- Questions asked on the ticket before starting (see PROC3)
Any box left unticked must have a short reason

Possible Test Scenarios I would like to see:

When I open a new pull request, the Standards Check section is in the description

Answers (agreed 2026-11-04):
- The Standards Check section goes right after the Summary section, so reviewers see it early.
- The questions box reads "Questions about the ticket were asked and answered before starting, or none were needed (standards 5.1)", so a clear ticket can still tick it.
- A box that doesn't apply (e.g. §1 UI Standards when nothing changes on screen) is left unticked with a short reason. There is no "N/A" option.

Dependencies:
PROC1 (pull request template)

Branch name Examples:
chore/pr-standards-check

Completed On:
2026-11-04 (PR #65)
