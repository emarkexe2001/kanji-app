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

`npm run lint` runs ESLint (`eslint.config.js`) over the whole repo. As well as general code quality, it checks the naming and import rules from `docs/standards/standards.md` (kebab-case file and folder names, no imports between features, shared folders don't import from features or app). It is not part of CI yet; it will be added once Prettier (TOOL2) is set up too.

The typecheck and test checks run automatically on GitHub (see `.github/workflows/ci.yml`) on every pull request to `main` and every push to `main`. The workflow installs the project with `npm ci`, then runs `npm run typecheck` and `npm test`. On pull requests it also checks every commit message against the rules in standards 5.5; a `commit-msg` hook (installed by `npm install`) checks them when you commit too. See `docs/testing.md` to run the check by hand. `main` is protected: changes can only reach it through a pull request, and a pull request can only be merged once this check is green. Direct pushes to `main` are rejected. An approving review is not required yet, because the project has a single maintainer; it will be added when someone else joins.

## Further help

Please refer to the docs folder for further information on parts of this project