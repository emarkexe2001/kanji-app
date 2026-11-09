Ticket Code:
CHORE3

Feature Name: 
Move Web App to Feature Folder Layout

Origin:
Code standards update (docs/standards/standards.md, sections 2.5, 2.6 and 3.2-3.4), adapted from bulletproof-react. The standards now describe an app/ + features/ + shared folders layout, but all of apps/web/src is currently a flat folder, App.tsx holds several features in one file, and there is no error boundary.

Feature Description:
As a developer I would like the web app's code organised by feature, so each feature's code is in one place, new features (e.g. card categories) have an obvious home, and features stay independent of each other.

Feature Requirements / Expected Behaviours:
apps/web/src follows the layout in standards section 3.2:
- src/app/ - main.tsx, app.tsx and an error boundary around the deck
- src/features/deck/ - deck display, card stack, next / shuffle, useDeck
- src/features/card-limit/ - the card limit control and its validation (deck-size.ts)
- src/components/ - shared components (e.g. word-card if more than one feature uses it)
- src/lib/storage.ts - the safe localStorage helper used by card-limit
Large components in App.tsx are split into their own files in the right feature
No feature imports from another feature - they are combined in src/app/
The error boundary shows a friendly message if the deck fails to render, instead of a blank page
No other behaviour changes

Possible Test Scenarios I would like to see:

When I run npm run typecheck, npm test and npm run build, they all pass

When I run npm run lint (after TOOL1), there are no import rule errors

When I run the app, the deck, next, shuffle and card limit work exactly as before

When the deck throws an error while rendering, a friendly error message is shown instead of a blank page

Dependencies:
CHORE2 (kebab-case names) first. TEST2 (test folders) can be done before or after.

Branch name Examples:
chore/feature-folder-layout

Completed On:
2026-10-14 (PR #10)
