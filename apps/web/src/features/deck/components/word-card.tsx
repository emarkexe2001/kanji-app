import {
  COMMON_COLOR,
  JLPT_COLORS,
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
          {seg.reading && (
            <span className="ml-1 font-normal text-slate-600">({seg.reading})</span>
          )}
        </span>
        <span
          className="text-sm font-bold underline decoration-2 underline-offset-2"
          style={{ color }}
        >
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

export function WordCard({ entry }: { entry: WordEntry }) {
  const headerColor = entry.jlpt ? JLPT_COLORS[entry.jlpt] : NEUTRAL_HEADER;

  return (
    <article className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200">
      <header
        className="px-4 py-2 text-xs font-bold tracking-wide text-white"
        style={{ backgroundColor: headerColor }}
      >
        {entry.jlpt ? `JLPT ${entry.jlpt}` : 'Vocabulary'}
      </header>

      <div className="space-y-3 px-4 py-4">
        <div>
          <h2 className="flex flex-wrap items-baseline gap-x-3 text-3xl">
            <span>
              {entry.segments.map((seg, i) => (
                <span key={i} className={HL_CLASS[seg.kind]}>
                  {seg.text}
                </span>
              ))}
            </span>
            <span className="text-lg font-normal text-slate-500">【{entry.reading}】</span>
          </h2>
          {entry.common && (
            <p className="badge-common mt-1" style={{ color: COMMON_COLOR }}>
              ★ Common Word
            </p>
          )}
        </div>

        <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h3 className="mb-2 text-xs font-bold tracking-wider text-slate-400">
            READING BREAKDOWN
          </h3>
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
    </article>
  );
}
