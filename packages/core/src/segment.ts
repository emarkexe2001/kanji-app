import type { ReadingKind } from './types';

/** Per-kanji data distilled from KANJIDIC2. All readings are hiragana. */
export interface KanjiInfo {
  /** Onyomi readings, e.g. "しょく", "じき". */
  on: string[];
  /** Kunyomi readings: `stem` is the part before the okurigana dot ("た" of "た.べる"), `full` is stem + okurigana. */
  kun: { stem: string; full: string }[];
  /** Short English gloss, e.g. "eat / food". */
  meaning: string;
}

export type KanjiIndex = ReadonlyMap<string, KanjiInfo>;

/** A piece of a word, aligned to the reading. */
export interface AlignedSegment {
  text: string;
  reading?: string;
  kind: ReadingKind;
  /** Kanji this segment's reading/meaning was looked up under (differs from `text` only for 々). */
  source?: string;
}

export const toHiragana = (s: string): string =>
  s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

const isKana = (c: string) => /[ぁ-ゟ゠-ヿ]/.test(c);

/** ん+long-vowel mark etc. are not handled; katakana長音 "ー" is matched literally as okurigana. */
const RENDAKU: Record<string, string[]> = {
  か: ['が'], き: ['ぎ'], く: ['ぐ'], け: ['げ'], こ: ['ご'],
  さ: ['ざ'], し: ['じ'], す: ['ず'], せ: ['ぜ'], そ: ['ぞ'],
  た: ['だ'], ち: ['じ', 'ぢ'], つ: ['ず', 'づ'], て: ['で'], と: ['ど'],
  は: ['ば', 'ぱ'], ひ: ['び', 'ぴ'], ふ: ['ぶ', 'ぷ'], へ: ['べ', 'ぺ'], ほ: ['ぼ', 'ぽ'],
};

interface Candidate {
  kana: string;
  kind: ReadingKind;
}

/** All surface forms a kanji's reading can take at a given position, longest first. */
function candidates(info: KanjiInfo, canVoice: boolean, hasNext: boolean): Candidate[] {
  const bases: Candidate[] = [
    ...info.on.map((kana) => ({ kana, kind: 'onyomi' as const })),
    ...info.kun.flatMap((k) =>
      k.full === k.stem
        ? [{ kana: k.stem, kind: 'kunyomi' as const }]
        : [
            { kana: k.stem, kind: 'kunyomi' as const },
            { kana: k.full, kind: 'kunyomi' as const },
          ],
    ),
  ];

  const out: Candidate[] = [];
  const seen = new Set<string>();
  const add = (kana: string, kind: ReadingKind) => {
    const key = `${kana}|${kind}`;
    if (kana && !seen.has(key)) {
      seen.add(key);
      out.push({ kana, kind });
    }
  };

  for (const { kana, kind } of bases) {
    add(kana, kind);
    if (canVoice) {
      for (const v of RENDAKU[kana[0]] ?? []) add(v + kana.slice(1), kind);
    }
    // Sokuon: 学(がく) + 校 → がっ; 日(にち) + 本 → にっ.
    if (hasNext && /[つちくき]$/.test(kana) && kana.length > 1) {
      add(kana.slice(0, -1) + 'っ', kind);
      if (canVoice) {
        for (const v of RENDAKU[kana[0]] ?? []) add(v + kana.slice(1, -1) + 'っ', kind);
      }
    }
  }
  return out.sort((a, b) => b.kana.length - a.kana.length);
}

/**
 * Splits a written word into per-kanji reading segments plus okurigana.
 *
 *   segmentWord('食べる', 'たべる', idx) → 食(た, kunyomi) + べる(okurigana)
 *
 * Returns null when the reading can't be explained by KANJIDIC readings
 * (e.g. jukujikun such as 今日 → きょう), so callers can skip or special-case those words.
 */
export function segmentWord(
  written: string,
  reading: string,
  index: KanjiIndex,
): AlignedSegment[] | null {
  const chars = [...written];
  const rd = toHiragana(reading);

  const rec = (i: number, j: number, prevKanji: string | null): AlignedSegment[] | null => {
    if (i === chars.length) return j === rd.length ? [] : null;
    const ch = chars[i];

    if (isKana(ch)) {
      if (toHiragana(ch) !== rd[j]) return null;
      const rest = rec(i + 1, j + 1, null);
      return rest && [{ text: ch, kind: 'okurigana' }, ...rest];
    }

    const source = ch === '々' ? prevKanji : ch;
    const info = source ? index.get(source) : undefined;
    if (!source || !info) return null;

    for (const cand of candidates(info, i > 0, i + 1 < chars.length)) {
      if (!rd.startsWith(cand.kana, j)) continue;
      const rest = rec(i + 1, j + cand.kana.length, source);
      if (rest) return [{ text: ch, reading: cand.kana, kind: cand.kind, source }, ...rest];
    }
    return null;
  };

  const raw = rec(0, 0, null);
  if (!raw) return null;

  // Merge adjacent okurigana characters into one segment (e.g. "き" + "い" → "きい").
  const merged: AlignedSegment[] = [];
  for (const seg of raw) {
    const last = merged[merged.length - 1];
    if (seg.kind === 'okurigana' && last?.kind === 'okurigana') last.text += seg.text;
    else merged.push({ ...seg });
  }
  return merged;
}
