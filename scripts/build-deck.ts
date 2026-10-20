/**
 * Builds the study deck from the raw dictionary files in data/raw/
 * (JMdict + KANJIDIC2, JSON conversions from scriptin/jmdict-simplified).
 *
 *   npm run data:build
 *
 * Output: apps/web/public/data/deck.json — an array of WordEntry, one per JMdict word
 * that contains kanji and whose reading can be split across its kanji. Words on the JLPT
 * vocabulary lists in data/raw/jlpt/ get their `jlpt` level; the app builds its decks
 * (JLPT N5–N1 and Common words) from that field and the `common` flag.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  segmentWord,
  toHiragana,
  type KanjiIndex,
  type KanjiInfo,
  type ReadingSegment,
  type JlptLevel,
  type WordEntry,
} from '../packages/core/src';
import { JLPT_LEVELS, matchKey, parseJlptCsv, type JlptListEntry } from './jlpt-list';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = join(ROOT, 'data', 'raw');
const JLPT_DIR = join(RAW, 'jlpt');
const OUT = join(ROOT, 'apps', 'web', 'public', 'data', 'deck.json');

const findRaw = (prefix: string): string => {
  const f = readdirSync(RAW).find((n) => n.startsWith(prefix) && n.endsWith('.json'));
  if (!f) throw new Error(`No ${prefix}*.json in ${RAW} — unzip the release archives first.`);
  return join(RAW, f);
};
const readJson = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

// ---------- KANJIDIC2 → KanjiIndex ----------
interface KdReading {
  type: string;
  value: string;
}
interface KdChar {
  literal: string;
  readingMeaning?: { groups: { readings: KdReading[]; meanings: { lang: string; value: string }[] }[] };
}

function buildKanjiIndex(chars: KdChar[]): Map<string, KanjiInfo> {
  const index = new Map<string, KanjiInfo>();
  for (const c of chars) {
    const groups = c.readingMeaning?.groups ?? [];
    const on: string[] = [];
    const kun: KanjiInfo['kun'] = [];
    const meanings: string[] = [];

    for (const g of groups) {
      for (const r of g.readings) {
        if (r.type === 'ja_on') on.push(toHiragana(r.value.replace(/[.-]/g, '')));
        else if (r.type === 'ja_kun') {
          const [stem, ...ok] = r.value.replace(/-/g, '').split('.');
          if (stem) kun.push({ stem, full: stem + ok.join('') });
        }
      }
      for (const m of g.meanings) if (m.lang === 'en') meanings.push(m.value);
    }
    if (on.length || kun.length) {
      index.set(c.literal, { on, kun, meaning: meanings.slice(0, 2).join(' / ') });
    }
  }
  return index;
}

// ---------- JMdict → WordEntry ----------
interface JmKanji {
  text: string;
  common: boolean;
  tags: string[];
}
interface JmKana {
  text: string;
  common: boolean;
  tags: string[];
  appliesToKanji: string[];
}
interface JmSense {
  partOfSpeech: string[];
  appliesToKanji: string[];
  appliesToKana: string[];
  gloss: { lang: string; text: string }[];
}
interface JmWord {
  id: string;
  kanji: JmKanji[];
  kana: JmKana[];
  sense: JmSense[];
}

/** Writings/readings flagged irregular, rare, outdated or search-only aren't good study forms. */
const BAD_KANJI_TAGS = new Set(['sK', 'iK', 'oK', 'rK', 'ateji']);
const BAD_KANA_TAGS = new Set(['sk', 'ik', 'ok', 'rk']);

const MAX_MEANING_CHARS = 70;

const applies = (list: string[], text: string) => list.includes('*') || list.includes(text);
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const hasKanji = (s: string) => /[㐀-䶿一-鿿]/.test(s);

function meaningOf(w: JmWord, written: string, reading: string): string {
  const senses = w.sense.filter((s) => applies(s.appliesToKanji, written) && applies(s.appliesToKana, reading));
  // Up to 2 senses × 2 glosses, but stop adding glosses once the text passes MAX_MEANING_CHARS
  // (always keeping the first) so cards stay readable.
  const parts: string[] = [];
  let len = 0;
  outer: for (const s of senses.slice(0, 2)) {
    const glosses = s.gloss.filter((g) => g.lang === 'eng').slice(0, 2);
    const kept: string[] = [];
    for (const g of glosses) {
      if (len > 0 && len + g.text.length > MAX_MEANING_CHARS) {
        if (kept.length) parts.push(kept.join(', '));
        break outer;
      }
      kept.push(g.text);
      len += g.text.length + 2;
    }
    if (kept.length) parts.push(kept.join(', '));
  }
  return capitalize(parts.join('; '));
}

function grammarLabel(pos: string[], isLast: boolean): string {
  if (!isLast) return 'Connecting Kana';
  if (pos.some((p) => p.startsWith('v'))) return 'Verb Inflection Suffix';
  if (pos.includes('adj-i')) return 'Adjective Inflection Suffix';
  if (pos.includes('adj-na')) return 'Adjectival Noun Suffix';
  if (pos.some((p) => p.startsWith('adv'))) return 'Adverb Suffix';
  return 'Fixed Kana Suffix';
}

function toEntry(w: JmWord, kanji: KanjiIndex): WordEntry | null {
  const writings = w.kanji.filter((k) => !k.tags.some((t) => BAD_KANJI_TAGS.has(t)) && hasKanji(k.text));
  // Prefer common writings, keeping JMdict order otherwise.
  writings.sort((a, b) => Number(b.common) - Number(a.common));

  for (const wr of writings) {
    const readings = w.kana
      .filter((k) => applies(k.appliesToKanji, wr.text) && !k.tags.some((t) => BAD_KANA_TAGS.has(t)))
      .sort((a, b) => Number(b.common) - Number(a.common));

    for (const rd of readings) {
      const aligned = segmentWord(wr.text, rd.text, kanji);
      if (!aligned) continue;

      const meaning = meaningOf(w, wr.text, rd.text);
      if (!meaning) continue;

      const pos = w.sense.find((s) => applies(s.appliesToKanji, wr.text))?.partOfSpeech ?? [];
      const segments: ReadingSegment[] = aligned.map((seg, i) => {
        if (seg.kind === 'okurigana') {
          return { text: seg.text, kind: 'okurigana', grammar: grammarLabel(pos, i === aligned.length - 1) };
        }
        return {
          text: seg.text,
          reading: seg.reading,
          kind: seg.kind,
          rootMeaning: kanji.get(seg.source ?? seg.text)?.meaning || undefined,
        };
      });

      return {
        id: w.id,
        word: wr.text,
        reading: toHiragana(rd.text),
        common: wr.common || rd.common,
        segments,
        meaning,
      };
    }
  }
  return null;
}

// ---------- JLPT levels ----------
/** Every writing|reading pair of a JMdict word, so a JLPT list entry can match any of its forms. */
function keysOf(w: JmWord): string[] {
  const keys: string[] = [];
  for (const k of w.kanji) {
    for (const r of w.kana) if (applies(r.appliesToKanji, k.text)) keys.push(matchKey(k.text, r.text));
  }
  return keys;
}

const listKeys = (e: JlptListEntry) => e.writings.map((wr) => matchKey(wr, e.reading));

const jlptLists = new Map<JlptLevel, JlptListEntry[]>(
  JLPT_LEVELS.map((level) => [level, parseJlptCsv(readFileSync(join(JLPT_DIR, `${level.toLowerCase()}.csv`), 'utf8'))]),
);
// A word on more than one list goes in the easiest level, so the JLPT decks never overlap.
const levelByKey = new Map<string, JlptLevel>();
for (const [level, entries] of jlptLists) {
  for (const e of entries) {
    for (const key of listKeys(e)) if (!levelByKey.has(key)) levelByKey.set(key, level);
  }
}
const easiest = (levels: JlptLevel[]) => JLPT_LEVELS.find((l) => levels.includes(l));

// ---------- main ----------
const kanjiChars: KdChar[] = readJson(findRaw('kanjidic2-en')).characters;
const kanjiIndex = buildKanjiIndex(kanjiChars);

const words: JmWord[] = readJson(findRaw('jmdict-eng-common')).words;
const deck: WordEntry[] = [];
const deckKeys = new Set<string>();
let withKanji = 0;
const skipped: string[] = [];

for (const w of words) {
  if (!w.kanji.some((k) => hasKanji(k.text))) continue; // kana-only words have nothing to highlight
  withKanji++;
  const entry = toEntry(w, kanjiIndex);
  if (!entry) {
    skipped.push(w.kanji[0].text);
    continue;
  }
  const keys = keysOf(w);
  const jlpt = easiest(keys.flatMap((k) => levelByKey.get(k) ?? []));
  if (jlpt) entry.jlpt = jlpt;
  for (const k of keys) deckKeys.add(k);
  deck.push(entry);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(deck));

const kb = (statSync(OUT).size / 1024).toFixed(0);
console.log(`KANJIDIC kanji indexed : ${kanjiIndex.size}`);
console.log(`JMdict words (common)  : ${words.length}`);
console.log(`  …containing kanji    : ${withKanji}`);
console.log(`  …segmented into deck : ${deck.length} (${((deck.length / withKanji) * 100).toFixed(1)}%)`);
console.log(`  …skipped             : ${skipped.length}  e.g. ${skipped.slice(0, 15).join(' ')}`);
console.log(`  …Common words deck   : ${deck.filter((e) => e.common).length}`);
console.log('JLPT lists: entries with kanji matched to a deck word (kana-only entries have nothing to highlight):');
for (const [level, entries] of jlptLists) {
  const withKanjiEntries = entries.filter((e) => e.writings.length);
  const unmatched = withKanjiEntries.filter((e) => !listKeys(e).some((k) => deckKeys.has(k)));
  const tagged = deck.filter((e) => e.jlpt === level).length;
  console.log(
    `  ${level}: ${entries.length} entries, ${entries.length - withKanjiEntries.length} kana-only, ` +
      `${withKanjiEntries.length - unmatched.length} matched, ${unmatched.length} unmatched ` +
      `(e.g. ${unmatched
        .slice(0, 8)
        .map((e) => e.writings[0])
        .join(' ')}); ${tagged} deck words tagged ${level}`,
  );
}
console.log(`Wrote ${OUT} (${kb} KB)`);
