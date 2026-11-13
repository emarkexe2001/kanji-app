Ticket Code:
TEST9

Ticket Type:
Test

Test Name: 
Stop e2e Tests Timing Out When Many Run at Once

Origin:
TEST7 review (PR #80, finding R2, 2026-11-11), left as an open question in that PR and raised again by the TEST7 retro (2026-11-13). Playwright's `workers` option isn't set in `apps/web/playwright.config.ts`, so it uses its default, half the machine's CPU cores. That is 8 on the developer machine (Windows). In repeat runs of the e2e tests (`npx playwright test --workers=N --repeat-each=20` in `apps/web`, 40 tests each run):

| Workers | Before R2 fix (`ba59384`) | After R2 fix (`279fed4`) |
|---|---|---|
| 4 | 40 passed (56.2s) | 40 passed (58.0s) |
| 8 (this machine's default) | 10 failed, 30 passed (2.3m) | 10 failed, 30 passed (2.1m) |

The R2 fix (`waitForDeck(page)` in `test/e2e/helpers.ts`, which waits up to 20s for the first card while the 5.4 MB dictionary loads) didn't help at 8 workers. Only 2 of the 10 "after" failures were that deck wait. The rest hit Playwright's 30s *test* timeout in `page.goto`, `page.reload` or even "while setting up "page"", so the machine seems overloaded by 8 browsers plus one `vite preview` server, not only by the dictionary download. CI uses 2 workers (GitHub's runner has 2 cores) and passes. There are only 2 e2e tests today, so a normal `npm run test:e2e` doesn't hit this yet, but it will as TEST7_5 and later tickets add e2e tests.

Description:
As a developer I would like `npm run test:e2e` to pass on my machine with its default settings, so that a red e2e run always means the code is broken, never that too many tests ran at once.

Requirements / Expected Behaviours:
- Find out why the tests time out at 8 workers and say so in the PR, with evidence (e.g. CPU use during the run, how long `page.goto` and the dictionary download take at 4 and at 8 workers, and whether the single `vite preview` server is the bottleneck).
- Fix it so the e2e tests pass at this machine's default worker count, without retries (the config's `retries: 0` stays) and without raising the 30s test timeout for every test.
- If the fix limits the number of workers, say in a comment in `playwright.config.ts` why that number was chosen (see question 1).
- CI keeps passing and doesn't get slower by more than a few seconds.
- If `docs/testing.md` or the comments in `playwright.config.ts` describe workers or timeouts, they match the change.
- The app's behaviour doesn't change.

Possible Test Scenarios I would like to see:

When I run `npx playwright test --repeat-each=20` in `apps/web` with the default number of workers, all 40 tests pass, in 3 runs in a row

When I run the same with `--workers=4`, all 40 tests pass, as before (the same number of runs before and after)

When the CI e2e job runs on this PR, it passes and its time is shown in the PR next to a recent run on main

When I break what a smoke test checks (e.g. look for a button that doesn't exist), the e2e run still goes red

Questions / Clarifications:
1. If the cause is that the machine can't run 8 browsers at once, the simplest fix is a lower worker limit in `playwright.config.ts` (e.g. `workers: process.env.CI ? undefined : 4`, or a share of the cores such as `'50%'` of a smaller number). Is a limit OK, or should the tests be made lighter so they run at the full default (e.g. caching the dictionary between tests)?
2. Should this wait until there are more e2e tests (TEST7_5), so the fix is tested against a realistic number of tests instead of 2 tests repeated 20 times?

Dependencies:
TEST7 (PR #80, merged 2026-11-13). Best done after TEST7_5, which adds more e2e tests (see question 2).

Branch name Examples:
test/e2e-many-workers-time-out
