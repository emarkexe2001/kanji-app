// ESLint config for the whole monorepo. Enforces the code standards in
// docs/standards/standards.md: section 2.1 (code quality), 2.2 (kebab-case file names)
// and 3.4 (import rules between app/, features/ and shared folders).
import { readdirSync } from 'node:fs';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import checkFile from 'eslint-plugin-check-file';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

const WEB_SRC = './apps/web/src';

// One import zone per feature, so a new feature folder is covered without editing this file.
const features = readdirSync(new URL(`${WEB_SRC}/features`, import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

export default tseslint.config(
  { ignores: ['**/dist/', '**/node_modules/', 'data/', 'apps/web/public/', '.claude/'] },

  js.configs.recommended,
  tseslint.configs.recommended,

  // Environments: the web app runs in the browser, scripts and config files run in Node.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['scripts/**/*.ts', '*.config.{js,ts}', '**/*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },

  // React
  {
    files: ['apps/web/**/*.tsx'],
    ...react.configs.flat.recommended,
    settings: { react: { version: 'detect' } },
  },
  { files: ['apps/web/**/*.tsx'], ...react.configs.flat['jsx-runtime'] },
  { files: ['apps/web/**/*.{ts,tsx}'], ...reactHooks.configs.flat['recommended-latest'] },

  // Naming (standards 2.2): files and folders use kebab-case, tests in test/ included
  // (e.g. deck-size.test.ts, ui-tests/). Config files are exempt.
  {
    files: ['**/*.{ts,tsx,js}'],
    ignores: ['*.config.{js,ts}', '**/*.config.{js,ts}'],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        { '**/*.{ts,tsx,js}': 'KEBAB_CASE' },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': ['error', { '{apps,packages,scripts}/**/': 'KEBAB_CASE' }],
    },
  },

  // Import rules (standards 3.4): code flows one way, shared -> features -> app.
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { import: importPlugin },
    settings: {
      'import/resolver': {
        typescript: {
          project: ['apps/web/tsconfig.json', 'packages/core/tsconfig.json'],
          noWarnOnMultipleProjects: true,
        },
      },
    },
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            ...features.map((feature) => ({
              target: `${WEB_SRC}/features/${feature}`,
              from: `${WEB_SRC}/features`,
              except: [`./${feature}`],
              message: 'Features must not import from other features. Combine them in src/app/ instead.',
            })),
            {
              target: `${WEB_SRC}/features`,
              from: `${WEB_SRC}/app`,
              message: 'Features must not import from src/app/.',
            },
            {
              target: ['components', 'hooks', 'lib', 'types', 'utils'].map((dir) => `${WEB_SRC}/${dir}`),
              from: [`${WEB_SRC}/features`, `${WEB_SRC}/app`],
              message: 'Shared folders must not import from features/ or app/.',
            },
            {
              target: './packages/core',
              from: './apps',
              message: '@kanji/core must never import from apps/.',
            },
          ],
        },
      ],
    },
  },

  // Turn off rules that clash with Prettier (TOOL2). Must stay last.
  prettier,
);
