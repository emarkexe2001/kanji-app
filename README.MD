# Kanji Reading Highlighter

A kanji card styled application (Web and Mobile) with colour coding for the different types of reading that can be encountered when looking at different kanjis (Based off onyomi and kunyomi readings). I was really struggling to understand and recall different kanji readings so I decided to make this application to help me better understand different readings! Built using React + Tailwind CSS (Web App)

This application is mainly for learning purposes - both practicing making a web + mobile application during my free time and + for aiding in my Japanese Studies!

## Stack

The web app is built with [React](https://react.dev/) 19, [Vite](https://vite.dev/) 6, [Tailwind CSS](https://tailwindcss.com/) 4 and [TypeScript](https://www.typescriptlang.org/). Tests use Node's test runner (with `tsx`), [Vitest](https://vitest.dev/) with Testing Library, and [Playwright](https://playwright.dev/) for the end-to-end tests. CI uses Node 22.

The repo is an npm workspaces monorepo:

| Folder | What it holds |
|---|---|
| `apps/web` | The web app (`@kanji/web`): the code in `src/`, its tests in `test/` |
| `packages/core` | Shared code with no UI (`@kanji/core`): word types, splitting a word into its kanji readings, and splitting the dictionary into deck files |
| `scripts/` | Repo scripts (building the deck, the commit message check, repeating the UI tests) and their tests in `scripts/test/` |
| `data/` | The source dictionaries the deck is built from (see [data/README.md](data/README.md)) |
| `docs/` | The standards, the testing guide, the tickets and the daily work diary |

## First-time setup

From the repo root:

`npm install` installs every workspace's dependencies and sets up the `commit-msg` git hook (husky, through the `prepare` script).

`npx playwright install chromium` downloads the browser the end-to-end tests use. Run it once per machine, and again when `@playwright/test` is updated.

The built deck files are committed in `apps/web/public/data/`, so the app works straight after cloning.

## Development server
To spin up the project locally please run the following command

`npm run dev:web`

## Build
To build the project please run the following command

`npm run build:web`

## Scripts

Run these from the repo root.

| Command | What it does |
|---|---|
| `npm run dev:web` | Starts the web app's Vite dev server |
| `npm run build:web` | Type-checks the web app and builds it into `apps/web/dist/` |
| `npm run typecheck` | Type-checks `src/` and `test/` in every workspace |
| `npm test` | Every workspace's unit and UI tests, then the `scripts/` tests |
| `npm run test:scripts` | Only the `scripts/` tests |
| `npm run test:e2e` | Builds the web app, serves it on port 4174 and runs the end-to-end tests in Chromium (not part of `npm test`) |
| `npm run lint` | Runs ESLint over the whole repo |
| `npm run format` | Formats every file in place with Prettier |
| `npm run format:check` | Lists any file that isn't formatted, and fails if there is one |
| `npm run data:build` | Rebuilds the deck files in `apps/web/public/data/` from `data/raw/` (see [data/README.md](data/README.md)) |
| `npm run check:commits -- origin/main..HEAD` | Checks the message of every commit on your branch, the same as CI |

The web app (`apps/web/package.json`) has its own scripts. Run them with `-w @kanji/web` from the root, or with `npm run <script>` inside `apps/web`:

| Command | What it does |
|---|---|
| `npm run dev -w @kanji/web` | Starts the Vite dev server (the same as `npm run dev:web`) |
| `npm run build -w @kanji/web` | Type-checks and builds the app (the same as `npm run build:web`) |
| `npm run preview -w @kanji/web` | Serves the last build with `vite preview` |
| `npm run typecheck -w @kanji/web` | Type-checks the web app's `src/` and `test/` |
| `npm run lint -w @kanji/web` | Runs ESLint over `apps/web` only |
| `npm test -w @kanji/web` | The web app's unit tests, then its UI tests |
| `npm run test:unit -w @kanji/web` | Only the web app's unit tests |
| `npm run test:ui -w @kanji/web` | Only the web app's UI tests (Vitest) |
| `npm run test:ui:repeat -w @kanji/web` | The UI tests 10 times in a row, stopping at the first run that fails (add `-- 3` for 3 runs) |
| `npm run test:e2e -w @kanji/web` | The end-to-end tests (the same as `npm run test:e2e`) |

## Checks
To run the checks locally please run the following commands

`npm run typecheck`

`npm test`

`npm run lint`

`npm run format:check`

`npm run check:commits -- origin/main..HEAD`

`npm run test:e2e` (for any change outside `docs/`)

`npm run lint` runs ESLint (`eslint.config.js`) over the whole repo. As well as general code quality, it checks the naming and import rules from `docs/standards/standards.md` (kebab-case file and folder names, no imports between features, shared folders don't import from features or app).

See [docs/testing.md](docs/testing.md) for the types of test, where each lives and more ways to run them.

## Formatting
All code is formatted by [Prettier](https://prettier.io/) (`.prettierrc`: single quotes, semicolons, 2-space indent, 120-character lines, Tailwind classes sorted by `prettier-plugin-tailwindcss`). Files listed in `.prettierignore` (build output, `node_modules`, `data/`, the generated deck files in `apps/web/public/data/` and Markdown docs) are skipped.

`npm run format` formats every file in place.

`npm run format:check` only checks: it lists any file that isn't formatted and fails. CI runs this, so run `npm run format` before pushing if it fails.

In VS Code, install the recommended Prettier extension (`esbenp.prettier-vscode`, suggested when you open the repo); `.vscode/settings.json` turns on format on save. Other editors pick up the basic settings from `.editorconfig`.

Line endings are always LF (`.gitattributes`). If an older Windows checkout still has CRLF files and `npm run format:check` complains about them, run `npm run format` once (git will show no changes). To get LF files back from git instead, commit your work first, then run `git rm -r --cached -q . && git reset --hard` (this discards uncommitted changes), or make a fresh clone.

## Continuous integration
The checks run automatically on GitHub (see `.github/workflows/ci.yml`) on every pull request to `main` and every push to `main`. The workflow installs the project with `npm ci`, then runs `npm run format:check`, `npm run lint`, `npm run typecheck` and `npm test`, and the end-to-end tests in their own job. A docs-only pull request (every file under `docs/` or a Markdown file) runs only the commit message check and the scripts tests (standards 5.4). On pull requests it also checks every commit message against the rules in standards 5.5; a `commit-msg` hook (installed by `npm install`) checks them when you commit too. See `docs/testing.md` to run the check by hand. `main` is protected: changes can only reach it through a pull request, and a pull request can only be merged once this check is green. Direct pushes to `main` are rejected. An approving review is not required yet, because the project has a single maintainer; it will be added when someone else joins.

## Dictionary data and licences

The words and readings come from the [EDRDG](https://www.edrdg.org/) dictionaries, through the JSON versions by [jmdict-simplified](https://github.com/scriptin/jmdict-simplified). The JLPT levels come from [open-anki-jlpt-decks](https://github.com/jamsinclair/open-anki-jlpt-decks). The app's footer credits them:

- JMdict and KANJIDIC2 © EDRDG, used under [CC BY-SA 4.0](https://www.edrdg.org/edrdg/licence.html).
- The JLPT lists from open-anki-jlpt-decks, under the MIT License (`data/raw/jlpt/LICENSE`), based on the lists at [tanos.co.uk](http://www.tanos.co.uk/jlpt/).

[data/README.md](data/README.md) lists the exact source files and how to rebuild the deck.

## Further help

Please refer to the docs folder for further information on parts of this project:

- [docs/standards/standards.md](docs/standards/standards.md): the UI, code, folder, test and git standards
- [docs/testing.md](docs/testing.md): the types of test and how to run them
- [data/README.md](data/README.md): the dictionary data, its licences and rebuilding the deck
- [docs/tickets/](docs/tickets/): the tickets, open and completed
- [docs/daily_work_diary/](docs/daily_work_diary/): a summary of each day's work
