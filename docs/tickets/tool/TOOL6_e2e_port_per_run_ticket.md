Ticket Code:
TOOL6

Ticket Type:
Tool

Tool Name:
Let Each e2e Run Choose Its Own Port

Origin:
PR #118 (CHORE10) retro (2026-11-18). Three ticket agents (CHORE10, CHORE9 and UI5) ran their checks on one machine at once. `apps/web/playwright.config.ts` always serves the build on port 4174 (`const PORT = 4174`, with `--strictPort`), so the runs fought over it:
- CHORE9's agent lost its server mid-run twice, when CHORE10's run took the port.
- Each agent worked around it with an untracked copy of the Playwright config on another port (4197, 4198, 4199), deleted afterwards. A copy isn't type-checked, isn't what CI runs, and is easy to leave behind.
The user agreed on 2026-11-18 to fix this, to speed up working on several tickets at once.

Description:
As a developer (or an agent) running several branches at once, I would like each e2e run to use its own port, so two runs on one machine never stop each other.

Requirements / Expected Behaviours:
- `npm run test:e2e` still serves on port 4174 when nothing else is set, so CI and a normal run don't change.
- An environment variable (e.g. `E2E_PORT`) sets a different port for one run. Both the server (`vite preview --port`) and `baseURL` use it.
- A value that isn't a whole number from 1024 to 65535 stops the run with a clear message, not a confusing server error.
- `--strictPort` stays, so a port already in use still stops the run with an error, never a silent switch to another port.
- `docs/testing.md` explains the variable next to the port 4174 line, with a Windows PowerShell and a bash example. It adds a rule: when several runs share a machine, give each its own port.
- `scripts/test/e2e-setup.test.ts` covers the new behaviour, since it already checks the Playwright config.

Possible Test Scenarios I would like to see:

When I run the e2e tests with nothing set, the build is served on port 4174 (as today)

When I set the port variable to another free port, the build is served there, and the tests open the app there

When I set the port variable to something that isn't a valid port, the run stops with a message naming the variable

When I start two e2e runs at once on different ports, both finish without stopping each other

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. What should the variable be called: `E2E_PORT`, `PLAYWRIGHT_PORT` or something else?
   Answer (agreed 2026-11-19): `E2E_PORT`. It is short and matches the `test:e2e` script and the "e2e" wording in `docs/testing.md`.
2. Should the agent briefings (and standards 5) also say "one e2e run at a time unless each has its own port", or is the testing.md rule enough?
   Answer (agreed 2026-11-19): Both. `docs/testing.md` explains how, and one line in standards 5.4, next to the "At most 2 code tickets at once" rule (PR #129), says each e2e run that shares a machine uses its own `E2E_PORT`. The 2-ticket limit and the `--workers=1` advice stay as they are. They are looked at again after this ticket merges (agreed 2026-11-18).
3. Busy-machine timeouts in the web UI tests (TEST8) were the other cost of running agents at once. Should this ticket also cap the web UI tests' workers when a variable is set, or leave that to TEST8 and TEST9?
   Answer (agreed 2026-11-19): Leave it to TEST8 and TEST9. This ticket only changes the e2e port.
4. (Added 2026-11-19, from the feature agent.) Should a value with a leading zero, e.g. `04180`, be accepted as port 4180, or rejected?
   Answer (agreed 2026-11-19): Accept it as 4180. It is the same port, so it does no harm. A test covers it, so it is a deliberate choice.

Dependencies:
None. It changes `playwright.config.ts`, which TEST9 (e2e flakiness at 8 workers) may also change, so don't run the two at the same time. Agreed order (2026-11-18): after the CHORE tickets, with TEST9.

Branch name Examples:
tool/e2e-port-per-run
