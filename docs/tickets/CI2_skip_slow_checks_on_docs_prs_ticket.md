Ticket Code:
CI2

Ticket Type:
CI

Feature Name: 
Skip the Slow Checks on Docs-Only Pull Requests

Origin:
User request (2026-11-06). PR #71, a docs-only ticket PR, failed CI on a flaky UI test (the one TEST5 fixed) that its changes couldn't affect. Docs-only PRs change no app code, so the app's lint, typecheck and tests add time and random failures for no benefit.

Description:
As a developer I would like a pull request that only changes docs to skip the app's slow checks, so docs PRs merge quickly and can't be held up by app tests they can't affect, while the quick checks that do read docs still run.

Requirements / Expected Behaviours:
- A pull request is "docs-only" when every file it changes is under `docs/` or is a Markdown (`.md`) file anywhere in the repo, e.g. `.github/pull_request_template.md`. Any other file (code, tests, config, `package.json`, the CI workflow itself) makes it a normal PR.
- On a docs-only PR, CI skips `npm run format:check`, `npm run lint`, `npm run typecheck` and the app's tests (`@kanji/core`, web unit and web UI tests).
- On a docs-only PR, CI still runs the commit message check (`npm run check:commits`) and the scripts tests (`npm run test:scripts`). They are quick, and the scripts tests read the standards, the PR template, `docs/tickets/example_ticket.md` and `docs/testing.md`.
- Every other PR, and every push to `main`, runs all the checks, as today.
- The required check "Typecheck and test" still reports a result on every PR, so branch protection keeps working. Don't use `paths-ignore` on the workflow: a required check that never runs leaves the PR stuck as "waiting" and it can't be merged.
- The CI workflow says in a comment what counts as docs-only and why the scripts tests still run.
- `docs/standards/standards.md` (5.4) says which checks run on a docs-only PR.

Questions / Clarifications:
(Check this ticket against docs/standards/standards.md before starting.)
1. What still runs on a docs-only PR?
   Answer (agreed 2026-11-06): only the quick checks: the commit message check and the scripts tests. Lint, typecheck, format check and the app's tests are skipped.
2. Where does it go in the ticket order?
   Answer (agreed 2026-11-06): after TEST5 and before CHORE4: TEST5, then CI2, then CHORE4, then TEST8.
3. Which flow does this ticket follow?
   Answer (agreed 2026-11-06): a lighter flow: one agent makes the change and its tests, then a separate review agent, then the PR retro agent after merge. It isn't a `CHORE` ticket, so it keeps its review agent. There is no in-person check, as nothing on screen changes.

Possible Test Scenarios I would like to see:

When a PR changes only files in `docs/` or `.md` files, CI passes "Typecheck and test" without running lint, typecheck or the app's tests, and the PR can be merged

When a docs-only PR breaks a scripts test (e.g. removes the Questions / Clarifications section from `example_ticket.md`), CI fails

When a docs-only PR has a commit message that breaks standards 5.5, CI fails

When a PR changes a docs file and any other file (e.g. a test or `package.json`), every check runs

When a PR changes only `.github/workflows/ci.yml`, every check runs

When a commit is pushed to `main`, every check runs

A scripts test checks the docs-only rule (e.g. a small function that takes a list of changed files and says whether the PR is docs-only), covering: only `docs/` files, only `.md` files outside `docs/`, a mix with a code file, and the CI workflow file

Break-and-restore check: break the docs-only rule (e.g. treat every PR as docs-only) and see the scripts test go red

Dependencies:
Start after TEST5 (PR #72, merged 2026-11-06). Do before CHORE4, which edits the same standards section (5.4).

Branch name Examples:
ci/skip-slow-checks-on-docs-prs
