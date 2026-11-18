// CHORE9: inside a feature, hooks and utils must not import from its components (standards 3.4,
// agreed answer 1). ESLint enforces it with `import/no-restricted-paths` in eslint.config.js; these
// tests lint small made-up files placed in the real feature folders with the real config.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import ts from 'typescript';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const FEATURES = 'apps/web/src/features';
const RULE = 'import/no-restricted-paths';
const MESSAGE = 'Hooks and utils must not import from components.';

const eslint = new ESLint({ cwd: ROOT });

/** The `import/no-restricted-paths` messages for `code` linted as if it were the file at `path`. */
const restrictedPaths = async (path: string, code: string) => {
  const [result] = await eslint.lintText(code, { filePath: `${ROOT}${path}` });
  return result.messages.filter((message) => message.ruleId === RULE).map((message) => message.message);
};

/** Asserts that ESLint stops `code` at `path` with the hooks-and-utils message. */
const assertBlocked = async (path: string, code: string) => {
  const messages = await restrictedPaths(path, code);
  assert.equal(messages.length, 1, `expected one ${RULE} error for ${path}, got ${JSON.stringify(messages)}`);
  assert.match(messages[0], new RegExp(MESSAGE.replace('.', '\\.')));
};

/** Asserts that ESLint lets `code` at `path` through the import rules. */
const assertAllowed = async (path: string, code: string) => {
  assert.deepEqual(await restrictedPaths(path, code), [], `${path} should be allowed`);
};

describe('hooks and utils importing components (lint)', () => {
  // The imported files are real (an import the resolver can't find isn't checked); the importing
  // files are made up, so nothing on disk changes.
  it('stops a deck hook importing a value from a deck component', async () => {
    await assertBlocked(
      `${FEATURES}/deck/hooks/lint-probe.ts`,
      "import { CardStack } from '../components/card-stack';\nexport const probe = CardStack;\n",
    );
  });

  it('stops a deck hook importing only a type from a deck component', async () => {
    await assertBlocked(
      `${FEATURES}/deck/hooks/lint-probe.ts`,
      "import type { CardStack } from '../components/card-stack';\nexport type Probe = typeof CardStack;\n",
    );
  });

  it('stops a deck util importing from a deck component, value or type', async () => {
    await assertBlocked(
      `${FEATURES}/deck/utils/lint-probe.ts`,
      "import { Deck } from '../components/deck';\nexport const probe = Deck;\n",
    );
    await assertBlocked(
      `${FEATURES}/deck/utils/lint-probe.ts`,
      "import type { Deck } from '../components/deck';\nexport type Probe = typeof Deck;\n",
    );
  });

  it('covers every feature, not just the deck (card-limit hooks and utils)', async () => {
    const code =
      "import { CardLimitControl } from '../components/card-limit-control';\nexport const probe = CardLimitControl;\n";
    await assertBlocked(`${FEATURES}/card-limit/hooks/lint-probe.ts`, code);
    await assertBlocked(`${FEATURES}/card-limit/utils/lint-probe.ts`, code);
  });

  it('stops a hook in a subfolder of hooks/ too', async () => {
    await assertBlocked(
      `${FEATURES}/deck/hooks/nested/lint-probe.ts`,
      "import { CardStack } from '../../components/card-stack';\nexport const probe = CardStack;\n",
    );
  });

  it('still lets components import hooks and utils, and hooks import utils', async () => {
    await assertAllowed(
      `${FEATURES}/deck/components/lint-probe.tsx`,
      "import { useStudyDeck } from '../hooks/use-study-deck';\nimport { findCardStack } from '../utils/dom-markers';\nexport const probe = [useStudyDeck, findCardStack];\n",
    );
    await assertAllowed(
      `${FEATURES}/deck/hooks/lint-probe.ts`,
      "import { findCardStack } from '../utils/dom-markers';\nimport { useReducedMotion } from './use-reduced-motion';\nexport const probe = [findCardStack, useReducedMotion];\n",
    );
  });

  it('lets a component import another component', async () => {
    await assertAllowed(
      `${FEATURES}/deck/components/lint-probe.tsx`,
      "import { CardStack } from './card-stack';\nexport const probe = CardStack;\n",
    );
  });
});

/** Every .ts/.tsx file under `dir` (relative to the repo root). */
const filesUnder = (dir: string): string[] =>
  readdirSync(`${ROOT}${dir}`, { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return filesUnder(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });

/** Every module a file imports or re-exports from, type-only and `import()` included. */
const importsOf = (path: string): string[] => {
  const source = ts.createSourceFile(path, readFileSync(`${ROOT}${path}`, 'utf8'), ts.ScriptTarget.Latest, true);
  const found: string[] = [];
  const visit = (node: ts.Node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      if (ts.isStringLiteral(node.moduleSpecifier)) found.push(node.moduleSpecifier.text);
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      const literal = node.argument.literal;
      if (ts.isStringLiteral(literal)) found.push(literal.text);
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      found.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
};

describe('hooks and utils importing components (the code today)', () => {
  const features = readdirSync(`${ROOT}${FEATURES}`, { withFileTypes: true }).filter((entry) => entry.isDirectory());

  it('has no file in a feature’s hooks/ or utils/ importing from its components/', () => {
    const offenders: string[] = [];
    for (const feature of features) {
      for (const dir of ['hooks', 'utils']) {
        let files: string[];
        try {
          files = filesUnder(`${FEATURES}/${feature.name}/${dir}`);
        } catch {
          continue; // the feature has no such folder
        }
        for (const file of files) {
          for (const specifier of importsOf(file)) {
            if (/(^|\/)components(\/|$)/.test(specifier)) offenders.push(`${file} → ${specifier}`);
          }
        }
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('checks the deck’s hooks, which used to import from components', () => {
    // So the test above isn't passing because it found no files to read.
    const hooks = filesUnder(`${FEATURES}/deck/hooks`);
    assert.ok(hooks.includes(`${FEATURES}/deck/hooks/use-card-flights.ts`));
    assert.ok(importsOf(`${FEATURES}/deck/hooks/use-card-flights.ts`).includes('../utils/dom-markers'));
  });
});
