Ticket Code:
TOOL1

Feature Name: 
ESLint Setup

Origin:
Code standards update (docs/standards/standards.md, sections 2.1 and 3.4), adapted from bulletproof-react. The standards now require ESLint to pass, and ESLint is what enforces the naming and import rules.

Feature Description:
As a developer I would like ESLint set up across the monorepo, so common mistakes are caught early and the naming, folder and import rules in the standards are checked automatically instead of relying on reviewers to spot them.

Feature Requirements / Expected Behaviours:
ESLint (flat config, eslint.config.js) set up at the repo root for all workspaces, with TypeScript, React and React Hooks rules
eslint-config-prettier included so ESLint and Prettier (TOOL2) don't conflict
File and folder names must be kebab-case (eslint-plugin-check-file), except test/ folders and config files
Import rules from standards section 3.4 (import/no-restricted-paths):
- shared folders (components, hooks, lib, types, utils) cannot import from features/ or app/
- features/ cannot import from app/
- one feature cannot import from another feature
- packages/core cannot import from apps/
An npm run lint script at the root (and in each workspace)
The existing code passes lint, or any rule that can't pass yet (e.g. kebab-case before CHORE2) is listed with a TODO pointing at its ticket
CI (CI1) runs npm run lint once both tickets are done

Possible Test Scenarios I would like to see:

When I run npm run lint on the current code, it passes

When I add a file called MyComponent.tsx, lint fails with a naming error

When a file in src/features/card-limit imports from src/features/deck, lint fails with an import error

When a file in src/components imports from src/features, lint fails with an import error

Dependencies:
TOOL2 (Prettier) can be done alongside. The kebab-case rule fully passes after CHORE2.

Branch name Examples:
chore/eslint-setup
