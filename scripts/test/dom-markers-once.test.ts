// CHORE9: the page markers the deck code looks up (the Shuffled-out panel's id and the `data-*`
// markers) are written once, in apps/web/src/features/deck/utils/dom-markers.ts, and nothing else
// in the app looks the button up by `aria-controls` itself. Reads the app's code, ignoring comments
// and import paths: only strings, template text and JSX attribute names count.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SRC = 'apps/web/src';
const MARKERS_FILE = `${SRC}/features/deck/utils/dom-markers.ts`;
const MARKERS = ['shuffled-out-panel', 'data-card-stack', 'data-slim', 'data-flight-source', 'data-flight-clip'];

/** Every .ts/.tsx file under `dir` (relative to the repo root). */
const filesUnder = (dir: string): string[] =>
  readdirSync(`${ROOT}${dir}`, { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return filesUnder(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });

/** The text written in code in a file: strings, template text and JSX attribute names (not comments or import paths). */
const writtenTextOf = (path: string, code: string): string[] => {
  const source = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true);
  const found: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      // Visit what's imported, not where from (e.g. '../components/shuffled-out-panel').
      if (ts.isExportDeclaration(node) && node.exportClause) visit(node.exportClause);
      return;
    }
    if (ts.isStringLiteralLike(node)) found.push(node.text);
    else if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) found.push(node.text);
    else if (ts.isJsxAttribute(node)) found.push(node.name.getText(source));
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
};

const writtenText = (path: string) => writtenTextOf(path, readFileSync(`${ROOT}${path}`, 'utf8'));

/** How many times `marker` is written as a whole word (not part of a longer name) in `texts`. */
const countOf = (marker: string, texts: string[]) => {
  const pattern = new RegExp(`(?<![\\w-])${marker}(?![\\w-])`, 'g');
  return texts.reduce((count, text) => count + (text.match(pattern)?.length ?? 0), 0);
};

const files = filesUnder(SRC);
const others = files.filter((file) => file !== MARKERS_FILE);

describe('the deck’s page markers, written once', () => {
  it('reads the app’s code, the markers file included', () => {
    // So the tests below aren't passing because they found nothing to read.
    assert.ok(files.includes(MARKERS_FILE));
    assert.ok(others.length > 20, `only ${others.length} other files found under ${SRC}`);
  });

  for (const marker of MARKERS) {
    it(`writes "${marker}" once in dom-markers.ts and nowhere else in the app`, () => {
      assert.equal(countOf(marker, writtenText(MARKERS_FILE)), 1, `"${marker}" in ${MARKERS_FILE}`);
      const elsewhere = others.filter((file) => countOf(marker, writtenText(file)) > 0);
      assert.deepEqual(elsewhere, [], `"${marker}" is also written in these files`);
    });
  }

  it('looks the "Shuffled out (N)" button up by aria-controls only in dom-markers.ts', () => {
    const lookups = (texts: string[]) => texts.filter((text) => text.includes('aria-controls=')).length;
    assert.equal(lookups(writtenText(MARKERS_FILE)), 1);
    assert.deepEqual(
      others.filter((file) => lookups(writtenText(file)) > 0),
      [],
    );
  });

  it('catches a marker written as a bare JSX attribute or inside a selector', () => {
    // The scan itself: the markers used to be written like this before CHORE9.
    const sample = (code: string) => writtenTextOf('sample.tsx', code);
    assert.equal(countOf('data-card-stack', sample('const a = <div data-card-stack data-slim={x} />;')), 1);
    assert.equal(
      countOf('data-slim', sample("document.querySelector('[data-card-stack]')?.hasAttribute('data-slim');")),
      1,
    );
    assert.equal(countOf('shuffled-out-panel', sample('const b = `[aria-controls="shuffled-out-panel"]`;')), 1);
    assert.equal(countOf('shuffled-out-panel', sample("const c = 'shuffled-out-panel-footer';")), 0);
    // Comments and import paths don't count.
    assert.equal(countOf('data-flight-clip', sample('// the data-flight-clip wrapper\nconst d = 1;')), 0);
    assert.equal(countOf('shuffled-out-panel', sample("import { X } from './shuffled-out-panel';")), 0);
  });
});
