Ticket Code:
CHORE5

Ticket Type:
Chore

Feature Name: 
Bring the README Up to Date

Origin:
Codebase and app retro (2026-11-16). `README.MD` is out of date:
- It says the app is "Built using Angular + Tailwind CSS". It is React 19, Vite 6, Tailwind CSS 4 and TypeScript, in an npm workspaces monorepo (`apps/web`, `packages/core`).
- It says the mobile stack is "TBD" and that the README will be updated once it is decided.
- It leaves out `npm run test:e2e` (and the one-off `npx playwright install chromium` it needs), `npm run data:build`, `npm run test:ui:repeat`, `npm run check:commits` and the short `npm run dev:web` / `npm run build:web` scripts.
- It doesn't link to `docs/testing.md`, `docs/standards/standards.md`, `data/README.md` or the tickets, or say where the deck data comes from.
- It calls the app "Colour Coded Kanji Card App", but the app calls itself "Kanji Reading Highlighter" (see UI5).

Description:
As a developer (or a new collaborator) I would like the README to describe the app as it is, so I can set it up, run every check and find the docs without asking.

Requirements / Expected Behaviours:
- The stack and the monorepo layout are correct.
- Every script in the root and `apps/web` `package.json` that a developer runs is listed, with one line on what it does. First-time setup (`npm install`, the Playwright browser) is included.
- It links to `docs/testing.md`, `docs/standards/standards.md`, `data/README.md`, `docs/tickets/` and `docs/daily_work_diary/`.
- It names the dictionary data and its licences, matching the app's footer (JMdict and KANJIDIC2 under CC BY-SA 4.0, the JLPT lists under MIT).
- It uses the app name agreed in UI5.
- The "why I made this" introduction keeps the user's own words, with only the facts corrected.
- It changes only `README.MD`, so the PR is docs-only (standards 5.4).

Possible Test Scenarios I would like to see:

When I follow the README from a fresh clone, `npm install`, `npm run dev:web`, every check and `npm run test:e2e` all run (checked by hand and noted in the PR)

Every script named in the README exists in a `package.json`, and every link in it points to a file that exists (checked by hand, or by a scripts test, see question 1)

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. Should a scripts test check that every script and link in the README exists, so it can't go stale again? A new test would make the PR no longer docs-only.
   Answer (agreed 2026-11-18): No. The PR stays docs-only. Every script and link in the README is checked by hand, and the check is noted in the PR.
2. Should the mobile app line stay ("Mobile platform stack (TBD)") or be removed until a mobile ticket exists?
   Answer (agreed 2026-11-18): Remove it until a mobile ticket exists.

Dependencies:
UI5 decides the app name. Agree the name first.
Note (2026-11-18): the name is agreed: "Kanji Reading Highlighter" (UI5 answer 1). The user chose to finish UI5 before CHORE5 starts.

Branch name Examples:
docs/update-readme

Completed On:
2026-11-18 (PR #127)
