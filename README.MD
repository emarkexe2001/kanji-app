# Colour Coded Kanji Card App

A kanji card styled application (Web and Mobile) with colour coding for the different types of reading that can be encountered when looking at different kanjis (Based off onyomi and kunyomi readings). I was really struggling to understand and recall different kanji readings so I decided to make this application to help me better understand different readings! Built using Angular + Tailwind CSS (Web App)

This application is mainly for learning purposes - both practicing making a web + mobile application during my free time and + for aiding in my Japanese Studies!

Stack: React /Tailwind - Mobile platform stack (TBD) - will update this read me again once I have decided on this

## Development server
To spin up the project locally please run the following command

`npm run dev -w @kanji/web`

## Build
To build the project please run the following command

`npm run build -w @kanji/web`

## Checks
To run the checks locally please run the following commands

`npm run typecheck`

`npm test`

`npm run lint`

`npm run format:check`

`npm run lint` runs ESLint (`eslint.config.js`) over the whole repo. As well as general code quality, it checks the naming and import rules from `docs/standards/standards.md` (kebab-case file and folder names, no imports between features, shared folders don't import from features or app).

## Formatting
All code is formatted by [Prettier](https://prettier.io/) (`.prettierrc`: single quotes, semicolons, 2-space indent, 120-character lines, Tailwind classes sorted by `prettier-plugin-tailwindcss`). Files listed in `.prettierignore` (build output, `node_modules`, `data/`, the generated `deck.json` and Markdown docs) are skipped.

`npm run format` formats every file in place.

`npm run format:check` only checks: it lists any file that isn't formatted and fails. CI runs this, so run `npm run format` before pushing if it fails.

In VS Code, install the recommended Prettier extension (`esbenp.prettier-vscode`, suggested when you open the repo); `.vscode/settings.json` turns on format on save. Other editors pick up the basic settings from `.editorconfig`.

Line endings are always LF (`.gitattributes`). If an older Windows checkout still has CRLF files and `npm run format:check` complains about them, run `npm run format` once (git will show no changes).

## Continuous integration
The checks run automatically on GitHub (see `.github/workflows/ci.yml`) on every pull request to `main` and every push to `main`. The workflow installs the project with `npm ci`, then runs `npm run format:check`, `npm run lint`, `npm run typecheck` and `npm test`. `main` is protected: changes can only reach it through a pull request, and a pull request can only be merged once this check is green. Direct pushes to `main` are rejected. An approving review is not required yet, because the project has a single maintainer; it will be added when someone else joins.

## Further help

Please refer to the docs folder for further information on parts of this project