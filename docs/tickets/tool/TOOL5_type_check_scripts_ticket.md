Ticket Code:
TOOL5

Ticket Type:
Tool

Tool Name: 
Type-Check the scripts/ Folder

Origin:
TEST2 (PR #54, 2026-10-30). TEST2 made `npm run typecheck` cover the test folders in `apps/web` and `packages/core`. The root `scripts/` folder has no tsconfig, so neither its scripts (`build-deck.ts`, `check-commit-message.ts`, `jlpt-list.ts`) nor its tests (`scripts/test/*.test.ts`) are type-checked. `tsx` runs them without checking types, so a type error there only shows up when the script breaks.

Description:
As a developer I would like the build scripts and their tests to be type-checked like the rest of the code, so that type errors are caught by `npm run typecheck` and CI before they break a script.

Requirements / Expected Behaviours:
- Add a tsconfig for `scripts/` that covers both the scripts and `scripts/test/`, using Node's types (the scripts run in Node, not the browser).
- `npm run typecheck` from the repo root also type-checks `scripts/`, so CI checks it too (CI already runs `npm run typecheck`).
- Follow the same approach as TEST2 where it fits (e.g. shared compiler settings, `@types/node`).
- Fix any type errors that show up without changing what the scripts or tests do, and list each fix in the PR.
- The scripts still run the same way (`npm run data:build`, `npm run check:commits`, `npm run test:scripts`).
- Update `docs/testing.md` (or wherever TEST2 describes typecheck) to say `scripts/` is type-checked.

Possible Test Scenarios I would like to see:

When I run npm run typecheck from the repo root, the scripts in scripts/ and the tests in scripts/test/ are type-checked and it passes

When I put a type error in a script or a script test, npm run typecheck fails, and passes again once it is removed

When I run npm run test:scripts, npm run check:commits and npm run data:build, they still work as before

When CI runs on a PR with a type error in scripts/, the typecheck step fails

Dependencies:
TEST2 (PR #54) should be merged first, as it adds `@types/node` and the test-folder typecheck setup this ticket builds on.

Branch name Examples:
tool/type-check-scripts
