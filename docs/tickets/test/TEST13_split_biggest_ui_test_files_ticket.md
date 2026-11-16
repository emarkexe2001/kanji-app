Ticket Code:
TEST13

Ticket Type:
Test (refactor)

Test Name: 
Split the Two Biggest UI Test Files

Origin:
Test refactor check (2026-11-16). Two UI test files are much bigger than the rest:
- `apps/web/test/ui-tests/card-slides.test.tsx`: 1,133 lines, 52 tests in 9 `describe` blocks (Shuffle In Cards slides, lowering the card limit, Add Back Cards, reduced motion, pressing a button mid-slide, slides only being seen, other ways a slide is cut short, the slim card under the pop-up, changing colour mode mid-slide).
- `apps/web/test/ui-tests/shuffled-out.test.tsx`: 1,009 lines, 45 tests in 5 `describe` blocks, roughly one per ticket (FEAT2, FEAT2_5, FEAT2_6, failure paths, FEAT2_7).

The next biggest is 640 lines. Big files are slow to read and to find a test in. Vitest runs test files in parallel but the tests inside a file one after another, so one long file can hold up the whole run. Two of `shuffled-out.test.tsx`'s tests are in TEST8 for being slow and timing out.

Description:
As a developer I would like these two files split into smaller files by topic, so each is easy to read, and the test run can spread them across workers.

Requirements / Expected Behaviours:
- Each file is split along its `describe` blocks into files of about 400 lines or fewer (the exact split agreed in the questions), named by topic in kebab-case (e.g. `card-slides-add-back.test.tsx`, `shuffled-out-recover.test.tsx`).
- Shared setup in each file (helpers, word lists, `beforeEach`) moves to the shared helpers (see TEST12) or a small shared file next to them, not copied into each new file.
- No test changes: the same names, steps and checks. The total test count stays the same.
- Time a full web UI run before and after (3 runs each, same machine) and note the result in the PR. It's fine if it isn't faster, but it mustn't be slower.
- `docs/testing.md`'s list of test files is updated.

Possible Test Scenarios I would like to see:

The web UI test count before and after is the same, and every test passes in 3 full runs

Every test name from the two old files is in exactly one new file (checked with a script or grep in the PR)

The full web UI run time before and after, 3 runs each, is noted in the PR

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. Split by `describe` block (9 + 5 files, some very small), or group small blocks together (e.g. about 4 files each)? The agent should count lines per block first and propose a split with real line counts.
2. Should any other file over about 500 lines (e.g. `color-mode.test.tsx` at 640) be split in the same PR?

Mockup:
Changes nothing on screen.

Dependencies:
TEST12 (shared helpers) first. Not at the same time as TEST8 or TEST11, which change tests in `shuffled-out.test.tsx` and nearby files.

Branch name Examples:
test/split-biggest-ui-test-files
