Ticket Code:
CI3

Ticket Type:
CI

Feature Name: 
Publish the App Automatically From main

Origin:
Codebase and app retro (2026-11-16). The app only runs on the developer's machine (`npm run dev:web`). There is no deploy, so it can't be used on a phone or shared. The repo is public, so GitHub Pages is free. The app has no backend, and it already loads `deck.json` from `import.meta.env.BASE_URL` (`apps/web/src/features/deck/hooks/use-deck.ts`), so it can be served from a sub-path such as `/kanji-app/`.

Description:
As a user I would like the latest version of the app to be online at a fixed address, updated each time a pull request merges, so I can study on my phone and anywhere else.

Requirements / Expected Behaviours:
- A GitHub Actions workflow builds the app (`npm run build:web`) and publishes `apps/web/dist` to the chosen host on every push to `main`.
- It publishes only after "Typecheck and test" and "End-to-end tests" pass for that commit. A failing `main` is never published.
- Pull requests don't publish (unless question 2 agrees preview builds).
- The Vite `base` is set for the host's path, and the dev server, `vite preview`, the e2e tests and `deck.json` all still work.
- The published app works like the local one: colour mode start page, saved deck, Shuffle In Cards, and the footer's licence links (CC BY-SA 4.0 for JMdict and KANJIDIC2 needs this attribution when the data is shared).
- The address is added to the README (CHORE5) and the repo's "Website" field.
- `docs/testing.md` or the README says how to check a deploy and how to roll back (e.g. re-run the workflow on an older commit).

Possible Test Scenarios I would like to see:

When a pull request merges into main and the checks pass, the new version is online within a few minutes (checked in real CI and noted in the PR)

When the checks fail on main, nothing is published

When I open the published app on a phone, the start page shows, and after choosing a mode my cards load (checked by hand, and by the e2e smoke test pointed at the published address if agreed)

When the build uses the sub-path base, the e2e tests still pass against `vite preview`

A pull request doesn't publish anything

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. Which host: GitHub Pages (free for public repos, `emarkexe2001.github.io/kanji-app/`), or Netlify, Vercel or Cloudflare Pages (preview builds for each pull request, an account to set up)?
2. Should each pull request get its own preview address, so UI work can be checked on a phone before merging?
3. Should the published version be one that works offline after the first visit (a PWA with a service worker)? That would be its own ticket.
4. A custom domain, or the host's default address?
5. How should a deploy be proved in real CI (CI2's lesson): a throwaway branch, or the first real merge after this ticket?

Mockup:
Changes nothing on screen.

Dependencies:
ARCH2 would make the published app much faster on mobile data, but isn't needed first. UI5 (name and favicon) is worth doing before the app is shared.

Branch name Examples:
ci/deploy-to-github-pages
