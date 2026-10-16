Ticket Code:
ARCH1

Feature Name:
Replace the stray "nextjs" package and move the web app to Next.js

Origin:
Spotted while starting TOOL2/TOOL3 (2026-10-16). The root package.json has `"nextjs": "^0.0.3"` under dependencies. That is an unrelated, empty npm package, not Next.js (Next.js is published as `next`). It was added in the first commit (70345c7) and nothing imports it. The user wants it removed and the web app moved to real Next.js.

Feature Description:
As a developer I would like the web app to run on Next.js (the `next` package) instead of Vite, and the wrong `nextjs` package gone, so the project uses the framework we meant to use and has no dead dependencies.

Feature Requirements / Expected Behaviours:
Remove `nextjs` from the root package.json and package-lock.json (do this as its own first commit)
Add `next` to apps/web and use the App Router (apps/web/src/app/), with a root layout and a single page that renders the current app
The app is still client-only with no backend: use a static export (`output: 'export'`) and mark the interactive components with 'use client'
apps/web/public/data/deck.json is still served and loaded by use-deck.ts. Replace `import.meta.env.BASE_URL` with a Next.js equivalent (e.g. a plain `/data/deck.json` path, or `basePath` if one is set)
Tailwind v4 keeps working via `@tailwindcss/postcss` instead of `@tailwindcss/vite`
The page title "Kanji Reading Highlighter" and lang="en" move from index.html into the root layout's metadata
Scripts in apps/web: `dev` (next dev), `build` (next build), `start`/`preview` for the static output, `typecheck`, `lint`, `test` unchanged. Root `dev:web` and `build:web` still work
Remove Vite-only files and packages that are no longer needed (index.html, src/app/main.tsx, vite.config.ts, @vitejs/plugin-react, @tailwindcss/vite, vite). Keep Vitest for the UI tests: vitest.config.ts gets its own React plugin/config instead of merging vite.config.ts
ESLint: add the Next.js rules (eslint-config-next or @next/eslint-plugin-next) and make sure the folder/import rules from TOOL1 still pass with the App Router file names (layout.tsx, page.tsx)
.gitignore covers .next/ and out/; Prettier and ESLint ignore them too (if TOOL2 has landed)
CI ("Typecheck and test" job, name unchanged) still passes, and also runs `npm run build:web`
Standards updated: the intro line ("React + Vite + Tailwind"), the barrel-file note that mentions Vite, and section 3 if the folder layout changes. README updated with the new dev/build commands

Possible Test Scenarios I would like to see:

When I run npm run dev:web, the app opens and the deck loads with the same cards as before

When I change the card limit and press shuffle, the app behaves exactly as it does on Vite today

When I run npm run build:web, it produces a static site that works when served from the output folder

When I run npm test, all existing unit and UI tests pass without being rewritten (only setup/config changes)

When I search the repo for "nextjs" or "vite" (outside node_modules and the lockfile), only Vitest remains

Dependencies:
Start after TOOL2 (Prettier) and TOOL3 (commit message check) are merged. All three change package.json, package-lock.json and ci.yml, and TOOL2 reformats the whole codebase.

Open questions (ask before starting):
Is static export enough, or do we want a Next.js server later (API routes, server components that fetch data)? This ticket assumes static export, which matches "no backend" in the standards.
Should Vite stay in standards section 6 as an option, or is Next.js now the decision?

Branch name Examples:
chore/nextjs-migration
