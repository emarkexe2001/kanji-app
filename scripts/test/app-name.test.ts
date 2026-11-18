// UI5: the app has one name, "Kanji Reading Highlighter" (answer 1). UI5 changes only the README's
// first heading line to it (answer 9); CHORE5 rewrites the rest of the README later, so only the
// first line is checked here. The page title and header are checked in the web app's tests.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
// The file is README.MD in git today. Found by name in any case, so the test works on a
// case-sensitive file system (CI) and still finds it if it is renamed to README.md.
const README_NAMES = readdirSync(ROOT).filter((name) => name.toLowerCase() === 'readme.md');
const README_PATH = resolve(ROOT, README_NAMES[0] ?? 'README.md');

const NAME = 'Kanji Reading Highlighter';
const OLD_NAME = 'Colour Coded Kanji Card App';

const firstLine = () => readFileSync(README_PATH, 'utf8').split(/\r?\n/)[0];

describe('the README heading (UI5, answer 9)', () => {
  it('there is exactly one README at the repo root', () => {
    assert.equal(README_NAMES.length, 1, README_NAMES.join(', '));
  });

  it('starts with the heading "# Kanji Reading Highlighter"', () => {
    assert.equal(firstLine(), `# ${NAME}`);
  });

  it('no longer uses the old name "Colour Coded Kanji Card App" in that heading', () => {
    assert.ok(!firstLine().includes(OLD_NAME), firstLine());
  });
});
