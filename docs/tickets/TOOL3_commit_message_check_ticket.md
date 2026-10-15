Ticket Code:
TOOL3

Feature Name: 
Commit Message Check

Origin:
Peer review of PR #15 (UI1 follow-up). The first push had commit messages where the title, description and Co-Authored-By line were all squashed onto one line (a multi-line `-m` message on Windows). Rewriting them needed a force-push, which wasn't allowed, so the work was moved to a new branch and the old one had to be deleted by hand. Nothing checks commit messages against standards 5.5 today.

Feature Description:
As a developer I would like a badly formatted commit message to be caught when I commit, and again in CI, so it never reaches a pull request and never needs a force-push to fix.

Feature Requirements / Expected Behaviours:
A commit-msg hook (e.g. husky, or lefthook if it is also wanted for TOOL2's formatting) that is installed automatically by npm install
The hook rejects a commit when:
- the title is longer than 72 characters
- the second line is not blank
- there is no description after the blank line
Merge commits and git's own revert messages are allowed through
The same check runs in CI on every commit in the PR (origin/main..HEAD), as a step in the existing "Typecheck and test" job or a new required check
A failed check says which rule was broken and shows the offending title
Standards 5.5 updated to describe the rules the check enforces, how to write a multi-line message safely on Windows (`git commit -F <file>` or an editor, not a multi-line `-m`), and whether force-pushing your own feature branch is allowed
docs/testing.md or the README says how to run the check by hand

Possible Test Scenarios I would like to see:

When I commit with a short title, a blank line and a description, the commit succeeds

When I commit with everything on one line, the hook rejects it and tells me the title is too long / the description is missing

When I commit with no blank line between the title and the description, the hook rejects it

When I push a branch with a badly formatted commit (e.g. made with --no-verify), CI fails and names the commit

When I make a merge commit from origin/main, the check lets it through

Dependencies:
None. The rules can be tightened later once the commit format question with Hong (standards section 6) is settled. If TOOL2 lands first, use the same hook tool.

Branch name Examples:
chore/commit-message-check
