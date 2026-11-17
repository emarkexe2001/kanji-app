Ticket Code:
CI4

Ticket Type:
CI

Feature Name: 
Skip the Slow Checks on main After a Docs-only Merge

Origin:
User request (2026-11-17). Since CI2, a docs-only pull request skips the format check, lint, typecheck, the app's tests and the e2e run, so its CI takes about 45s. But merging it runs every check again on `main`. `ci.yml` does this on purpose: "a push to main never takes the docs-only path". For example, PR #108 (one ticket file) took 47s on the PR and 2m 32s on `main` after merging. Most merges are docs-only (tickets, answers, the diary and ticket moves), so `main` spends most of its CI time re-checking code that hasn't changed.

Description:
As a developer I would like merging a docs-only pull request to skip the slow checks on `main` too, so CI time goes on changes that can affect the app.

Requirements / Expected Behaviours:
- On a push to `main`, the docs-only check compares the pushed commit with the `main` it replaced, e.g. the merge commit's first parent (`git diff --name-only --no-renames HEAD^1 HEAD`). It uses the same rule as today (`scripts/docs-only-changes.ts`: everything under `docs/` or a `.md` file).
- If the push is docs-only, "Typecheck and test" and "End-to-end tests" skip the same steps they skip on a docs-only PR. Otherwise every check runs, as today.
- If the comparison can't be made (e.g. the first commit, a push of several commits at once, or a missing parent), every check runs. When in doubt, run everything.
- Both required checks still report on every push, so nothing waits forever (CI2's reason for `if:` instead of `paths-ignore`).
- The comment at the top of `ci.yml` and `docs/testing.md` explain the new rule.

Possible Test Scenarios I would like to see:

When a docs-only PR merges into main, the run on main skips lint, typecheck, the app's tests and e2e, and passes (proved in real CI)

When a PR that changes code merges into main, the run on main runs every check (proved in real CI)

When a push to main holds several commits, or the parent can't be found, every check runs

When a merged PR moves a code file into docs/, every check runs on main (--no-renames, as in CI2)

The scripts tests still pass, and any new helper has unit tests

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. What should a push to main be compared with: the merge commit's first parent (`HEAD^1`), or the push event's `before` commit (`github.event.before`)? `before` also covers a push of several commits, but it is all zeros for a new branch and can be missing after a force push.
2. Should the skip also require the previous `main` commit's checks to have passed? Without that, a docs-only merge on top of a broken `main` would show green and hide the break.
3. How is it proved in real CI (CI2's lesson)? For example, a throwaway base branch that gets the workflow change, with one docs-only and one code merge into it. Pushes to that branch must count as "main" for the test.
4. CI3 (publish from main) plans to publish only after both checks pass. Should a docs-only push to main still publish? The app wouldn't change, so publishing would only cost time.

Mockup:
Changes nothing on screen.

Dependencies:
None. If CI3 is done first, answer 4 applies to its workflow too.

Branch name Examples:
ci/skip-slow-checks-on-main-after-docs-merge
