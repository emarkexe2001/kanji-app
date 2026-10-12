Ticket Code:
PROC4

Feature Name: 
Keep Docs Changes Out of Feature PRs

Origin:
Retro of PR #1 (feature/card-limit). The PR included an unrelated "Changed ticket name" commit, and the tickets themselves were committed straight to main instead of through a branch and PR.

Feature Description:
As a reviewer I would like each pull request to contain only the change it is about, so it is quick to review, and I would like docs / ticket changes to go through their own small PR rather than straight onto main.

Feature Requirements / Expected Behaviours:
standards.md "Other Standards" is updated to say:
- Every change to main, including docs and tickets, goes through a branch and a PR
- Docs / ticket changes use a docs/ branch (e.g. docs/add-tickets) and their own PR
- A feature PR only contains commits for that feature
Branch name prefixes are listed: feature/, fix/, test/, docs/, chore/, ci/

Possible Test Scenarios I would like to see:

When I read standards.md, the branch prefixes and the "one change per PR" rule are written down

Dependencies:
CI1 (branch protection stops direct pushes to main)

Branch name Examples:
docs/pr-scope-standards
