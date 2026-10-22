import type { ReactNode } from 'react';
import {
  COMMON_COLOR,
  JLPT_COLORS,
  NEW_COLOR,
  READING_COLORS,
  READING_LABELS,
  type ReadingSegment,
  type WordEntry,
} from '@kanji/core';

const NEUTRAL_HEADER = '#64748b';

// Literal class names so Tailwind's scanner generates them.
const HL_CLASS = {
  onyomi: 'hl-onyomi',
  kunyomi: 'hl-kunyomi',
  okurigana: 'hl-okurigana',
} as const;

/** Appends ~10% alpha to a 6-digit hex color for the tinted pill backgrounds. */
const tint = (hex: string) => `${hex}1a`;

function SegmentRow({ seg }: { seg: ReadingSegment }) {
  const color = READING_COLORS[seg.kind];
  const detail =
    seg.kind === 'okurigana'
      ? `Grammar: ${seg.grammar ?? 'Inflection Suffix'}`
      : seg.rootMeaning
        ? `Root Meaning: "${seg.rootMeaning}"`
        : null;

  return (
    <li className="border-t border-dashed border-slate-200 py-2 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-bold text-slate-900">
          {seg.text}
          {seg.reading && <span className="ml-1 font-normal text-slate-600">({seg.reading})</span>}
        </span>
        <span className="text-sm font-bold underline decoration-2 underline-offset-2" style={{ color }}>
          {READING_LABELS[seg.kind]}
        </span>
      </div>
      {detail && (
        <p
          className="mt-1 inline-block rounded-sm border-l-[3px] px-2 py-0.5 text-sm font-semibold"
          style={{ color, borderColor: color, backgroundColor: tint(color) }}
        >
          {detail}
        </p>
      )}
    </li>
  );
}

/** The word with its colour-coded reading highlights, then its reading. */
function Word({ entry, compact }: { entry: WordEntry; compact: boolean }) {
  // The compact card's word isn't a heading, so the card on screen keeps the only card heading.
  const Tag = compact ? 'p' : 'h2';
  return (
    <Tag className={`flex flex-wrap items-baseline ${compact ? 'gap-x-1 text-sm lg:text-base' : 'gap-x-3 text-3xl'}`}>
      <span>
        {entry.segments.map((seg, i) => (
          <span key={i} className={HL_CLASS[seg.kind]}>
            {seg.text}
          </span>
        ))}
      </span>
      <span className={`font-normal text-slate-500 ${compact ? 'text-[9px] lg:text-[10px]' : 'text-lg'}`}>
        【{entry.reading}】
      </span>
    </Tag>
  );
}

/** The diagonal "NEW" ribbon across the top-right corner of a card that was shuffled in. */
function NewRibbon({ id }: { id?: string }) {
  return (
    <span
      id={id}
      style={{ backgroundColor: NEW_COLOR }}
      className="pointer-events-none absolute top-3 -right-8 w-28 rotate-45 py-0.5 text-center text-[11px] font-extrabold tracking-widest text-slate-900 uppercase shadow-sm"
    >
      New
    </span>
  );
}

/**
 * A word's card. The card on screen shows everything. `compact` is the smaller version used in
 * the lists of cards to pick (FEAT2_5): the header, the word and the meaning, with no Reading
 * Breakdown, and `children` at the bottom (e.g. "From JLPT N4"). `isNew` adds the "NEW" ribbon.
 * Since ADJ2 it is smaller again, so more fit in the floating panel: a 14px word and 8-10px text
 * below the lg breakpoint (the phone pop-up), a 16px word and 9-11px text from lg up.
 * `idPrefix` gives the compact card's meaning and ribbon the ids `<idPrefix>-meaning` and
 * `<idPrefix>-new`, so a pick card can have screen readers read them out (FEAT2_6).
 */
export function WordCard({
  entry,
  compact = false,
  isNew = false,
  idPrefix,
  children,
}: {
  entry: WordEntry;
  compact?: boolean;
  isNew?: boolean;
  idPrefix?: string;
  children?: ReactNode;
}) {
  const headerColor = entry.jlpt ? JLPT_COLORS[entry.jlpt] : NEUTRAL_HEADER;
  // Only the card on screen is an article, so it can be told apart from the cards in the lists.
  const Root = compact ? 'div' : 'article';

  return (
    <Root
      className={`relative w-full overflow-hidden bg-white ring-1 ring-slate-200 ${
        compact ? 'rounded-lg shadow-sm' : 'max-w-sm rounded-xl shadow-lg'
      }`}
    >
      <header
        className={`font-bold tracking-wide text-white ${compact ? 'px-2 py-0.5 text-[8px] lg:text-[9px]' : 'px-4 py-2 text-xs'}`}
        style={{ backgroundColor: headerColor }}
      >
        {entry.jlpt ? `JLPT ${entry.jlpt}` : 'Vocabulary'}
      </header>
      {isNew && <NewRibbon id={idPrefix && `${idPrefix}-new`} />}

      {compact ? (
        <div className="space-y-1 px-2 py-1.5">
          <Word entry={entry} compact />
          <p id={idPrefix && `${idPrefix}-meaning`} className="text-[10px] meaning-text lg:text-[11px]">
            {entry.meaning}
          </p>
          {children}
        </div>
      ) : (
        <div className="space-y-3 px-4 py-4">
          <div>
            <Word entry={entry} compact={false} />
            {entry.common && (
              <p className="mt-1 badge-common" style={{ color: COMMON_COLOR }}>
                ★ Common Word
              </p>
            )}
          </div>

          <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <h3 className="mb-2 text-xs font-bold tracking-wider text-slate-400">READING BREAKDOWN</h3>
            <ul>
              {entry.segments.map((seg, i) => (
                <SegmentRow key={i} seg={seg} />
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-xs font-bold text-slate-500">Full Word Meaning</h3>
            <p className="meaning-text">{entry.meaning}</p>
          </section>
        </div>
      )}
    </Root>
  );
}
