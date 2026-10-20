/**
 * Reads the JLPT vocabulary lists in data/raw/jlpt/ (CSV files from
 * jamsinclair/open-anki-jlpt-decks, see data/README.md) so build-deck.ts can tag JMdict words
 * with their JLPT level. The files are treated as plain data: they are only parsed here.
 */
import type { JlptLevel } from '../packages/core/src/types';

/** Easiest first: a word listed under several levels is put in the easiest one. */
export const JLPT_LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export interface JlptListEntry {
  /** The written forms to match, e.g. ["会う"]. Empty when the expression is kana only. */
  writings: string[];
  /** The reading in hiragana, e.g. "あう". */
  reading: string;
}

/** Splits CSV text into rows of fields. Handles quoted fields with commas, "" escapes and newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ''));
}

const hasKanji = (s: string) => /[㐀-䶿一-鿿々]/.test(s);
const toHiragana = (s: string) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

/**
 * Removes the notes the lists add around a word: "(かん)" style comments, "～" placeholders for
 * prefixes and suffixes, and spaces. "一昨日;おととい" style alternatives are split apart.
 */
export function cleanForms(raw: string): string[] {
  return raw
    .replace(/[(（][^)）]*[)）]/g, '')
    .split(/[;；、,/／・]/)
    .map((s) => s.replace(/[～〜~\s]/g, ''))
    .filter((s) => s !== '');
}

/** Parses one level's CSV (header: expression,reading,meaning,tags,guid) into entries. */
export function parseJlptCsv(text: string): JlptListEntry[] {
  const [header, ...rows] = parseCsv(text);
  const col = (name: string) => {
    const i = header.findIndex((h) => h.trim().toLowerCase() === name);
    if (i < 0) throw new Error(`JLPT list has no "${name}" column`);
    return i;
  };
  const exprCol = col('expression');
  const readingCol = col('reading');

  return rows.map((r) => {
    const writings = cleanForms(r[exprCol] ?? '').filter(hasKanji);
    let reading = toHiragana(cleanForms(r[readingCol] ?? '')[0] ?? '');
    // Some する verbs are listed as 運動 / うんどうする: match the noun, as JMdict lists it.
    if (reading.endsWith('する') && writings.length && writings.every((w) => hasKanji(w.slice(-1)))) {
      reading = reading.slice(0, -2);
    }
    return { writings, reading };
  });
}

/** The key a JLPT list entry and a JMdict writing/reading pair are matched on. */
export const matchKey = (writing: string, reading: string) => `${writing}|${toHiragana(reading)}`;
