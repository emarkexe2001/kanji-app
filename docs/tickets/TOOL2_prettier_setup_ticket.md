Ticket Code:
TOOL2

Feature Name: 
Prettier Setup

Origin:
Code standards update (docs/standards/standards.md, section 2.1), adapted from bulletproof-react. The standards now say Prettier formats all code.

Feature Description:
As a developer I would like all code to be formatted the same way automatically, so formatting never comes up in reviews and diffs only show real changes.

Feature Requirements / Expected Behaviours:
Prettier installed at the repo root with a .prettierrc that matches the current code style (single quotes, semicolons, 2-space indent, wide line width)
Tailwind class sorting (prettier-plugin-tailwindcss)
A .prettierignore that skips dist/, node_modules/, data/ and the generated apps/web/public/data/deck.json
npm run format (writes changes) and npm run format:check (checks only) scripts at the root
.editorconfig and .vscode/settings.json recommending "format on save"
A line-endings rule (.gitattributes, e.g. * text=auto eol=lf) so Windows and Mac/Linux don't produce different files
The whole codebase formatted once, in its own commit, so later diffs stay clean

Possible Test Scenarios I would like to see:

When I run npm run format:check on the formatted codebase, it passes

When I save a badly formatted file in VS Code, it is reformatted automatically

When I run npm run format:check on a badly formatted file, it fails and names the file

Dependencies:
None - can be done alongside TOOL1

Branch name Examples:
chore/prettier-setup
