Ticket Code:
CHORE1

Feature Name: 
Repo + Branch Housekeeping

Origin:
Retro of PR #1 (feature/card-limit). After the merge there is a stray local master branch pointing at the feature branch, the local main is behind origin/main, the merged feature branch is still around, and the standards refer to "master" while the repo uses "main". The empty another_ticket.md file is also unused.

Feature Description:
As a developer I would like the repo to have one clear main branch, no leftover branches from merged work, and documents that use the same branch name as the repo.

Feature Requirements / Expected Behaviours:
Delete the local master branch
Update local main to match origin/main
Delete the merged feature/card-limit branch (local and remote) - or turn on "Automatically delete head branches" in GitHub settings
Replace "master" with "main" in docs/standards/standards.md
Remove or fill in docs/tickets/another_ticket.md

Possible Test Scenarios I would like to see:

When I run git branch -a, only main (and any branches still in progress) are listed

When I search the docs for "master", nothing is found

Dependencies:
None

Branch name Examples:
chore/repo-housekeeping

Completed On:
2026-10-13 (PR #4)
