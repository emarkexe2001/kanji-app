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

These same checks run automatically on GitHub (see `.github/workflows/ci.yml`) on every pull request to `main` and every push to `main`. The workflow installs the project with `npm ci`, then runs `npm run typecheck` and `npm test`. A pull request can only be merged once this check is green and the pull request has been approved.

## Further help

Please refer to the docs folder for further information on parts of this project