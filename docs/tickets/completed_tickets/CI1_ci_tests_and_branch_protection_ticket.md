Ticket Code:
CI1

Feature Name: 
CI Checks + Branch Protection on main

Origin:
Retro of PR #1 (feature/card-limit). The standards say all tests must pass before a feature branch is merged and that a PR must be reviewed first, but nothing enforces this - it relies on someone remembering to run the tests.

Feature Description:
As the project owner I would like tests and type-checking to run automatically on every pull request, and I would like main to be protected so a PR can only be merged when the checks pass and it has been approved.

Feature Requirements / Expected Behaviours:
A GitHub Actions workflow (.github/workflows/ci.yml) runs on every pull request to main and every push to main
The workflow runs npm ci, npm run typecheck and npm test
Branch protection on main: require a pull request, require the CI check to pass, require 1 approval, no direct pushes
README explains the checks that run on a PR

Possible Test Scenarios I would like to see:

When I open a PR where all tests pass, the CI check shows green and the PR can be merged once approved

When I open a PR with a failing test, the CI check shows red and the merge button is blocked

When I try to push directly to main, the push is rejected

Dependencies:
None (branch protection is set in GitHub settings by the repo owner)

Branch name Examples:
ci/github-actions

Completed On:
2026-10-13
