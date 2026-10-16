Ticket Code:
ARCH1

Feature Name:
Remove the stray "nextjs" package

Origin:
Spotted while starting TOOL2/TOOL3 (2026-10-16). The root package.json has `"nextjs": "^0.0.3"` under dependencies. That is an unrelated, empty npm package, not Next.js (Next.js is published as `next`). It was added in the first commit (70345c7) and nothing imports it.

A move from Vite to Next.js was considered and put on hold: the app is one screen with no backend, so Next.js adds little today. Revisit it if the app gains several pages, user accounts or server-side data, or pages that need to show up in search engines.

Feature Description:
As a developer I would like the wrong `nextjs` package removed, so the project has no dead dependencies and nobody thinks the app uses Next.js.

Feature Requirements / Expected Behaviours:
Remove `nextjs` from the root package.json and package-lock.json with `npm uninstall nextjs` (the root then has no "dependencies" section, which is fine)
Nothing else in the repo refers to the `nextjs` package
The web app stays on Vite; no other dependencies change

Possible Test Scenarios I would like to see:

When I run npm ci, npm run typecheck, npm run lint and npm test, they all pass as before

When I run npm run dev:web, the app opens and the deck loads

When I search the repo for "nextjs" (outside node_modules), only this ticket mentions it

Dependencies:
None. Easiest after TOOL2 and TOOL3 are merged, since all three change package-lock.json.

Branch name Examples:
chore/remove-nextjs-package
