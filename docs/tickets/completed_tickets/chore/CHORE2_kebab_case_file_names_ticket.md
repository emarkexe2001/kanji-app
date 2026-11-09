Ticket Code:
CHORE2

Feature Name: 
Rename Files to kebab-case

Origin:
Code standards update (docs/standards/standards.md, section 2.2). Files and folders must now use kebab-case, but the app currently uses WordCard.tsx, App.tsx, useDeck.ts and deckSize.ts.

Feature Description:
As a developer I would like every file name to follow the same kebab-case rule, so names are predictable and there are no case-sensitivity problems between Windows, Mac and Linux.

Feature Requirements / Expected Behaviours:
Rename all source and test files in apps/web, packages/core and scripts to kebab-case, for example:
- apps/web/src/App.tsx -> app.tsx
- apps/web/src/components/WordCard.tsx -> word-card.tsx
- apps/web/src/useDeck.ts -> use-deck.ts
- apps/web/src/deckSize.ts -> deck-size.ts
Use git mv so file history is kept (on Windows a change of case only may need a two-step rename)
Update every import to the new names
Component and function names inside the files stay the same (WordCard, useDeck)
No behaviour changes in this PR - renames only

Possible Test Scenarios I would like to see:

When I run npm run typecheck, npm test and npm run build after the rename, they all pass

When I run the app, it works exactly as before

When I run npm run lint (after TOOL1), there are no file naming errors

Dependencies:
Best done before CHORE3 (folder layout), so files are only moved once with their final names

Branch name Examples:
chore/kebab-case-file-names

Completed On:
2026-10-14
