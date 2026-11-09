import type { ReactNode } from 'react';
import {
  CARD_COLORS_BY_MODE,
  FALLBACK_HEADER,
  FALLBACK_INK,
  JLPT_COLORS_BY_MODE,
  NEW_COLOR,
  READING_COLORS_BY_MODE,
  READING_LABELS,
  modeColor,
  type ColorMode,
  type ReadingSegment,
  type WordEntry,
} from '@kanji/core';
import { useColorMode } from '../../../hooks/use-color-mode';

// Literal class names so Tailwind's scanner generates them.
const HL_CLASS = {
  onyomi: 'hl-onyomi',
  kunyomi: 'hl-kunyomi',
  okurigana: 'hl-okurigana',
} as const;

/**
 * Appends an alpha to a 6-digit hex color for the tinted pill backgrounds: ~10% in Light, and a
 * little more (~16%) in Dark so the pill still shows on the dark box (FEAT5, as in the mockup).
 * High contrast (FEAT5_5) has no tint at all: the note is on black, with only its coloured bar.
 */
const TINT_ALPHA: Record<ColorMode, string> = { light: '1a', dark: '29', 'high-contrast': '00' };
const tint = (hex: string, mode: ColorMode) => (mode === 'high-contrast' ? 'transparent' : `${hex}${TINT_ALPHA[mode]}`);

/**
 * The colours of a card's header in `mode`: the JLPT level's colour (or the no-level colour) with
 * white text in Light and Dark, and black text in High contrast (FEAT5_5, `hc:text-black`). If the
 * mode's colour is missing, the header is black with white text instead (`ink`, set inline so it
 * beats `hc:text-black`), so it is always readable.
 */
function headerColors(entry: WordEntry, mode: ColorMode): { background: string; ink?: string } {
  const background = entry.jlpt
    ? modeColor(JLPT_COLORS_BY_MODE, mode, entry.jlpt, '')
    : modeColor(CARD_COLORS_BY_MODE, mode, 'noLevel', '');
  return background ? { background } : { background: FALLBACK_HEADER.background, ink: FALLBACK_HEADER.ink };
}

/** One row of the Reading Breakdown, in the reading's colour for the mode that is on (FEAT5). */
function SegmentRow({ seg }: { seg: ReadingSegment }) {
  const mode = useColorMode();
  const color = modeColor(READING_COLORS_BY_MODE, mode, seg.kind, FALLBACK_INK[mode]);
  const detail =
    seg.kind === 'okurigana'
      ? `Grammar: ${seg.grammar ?? 'Inflection Suffix'}`
      : seg.rootMeaning
        ? `Root Meaning: "${seg.rootMeaning}"`
        : null;

  return (
    <li className="border-t border-dashed border-box-line py-2 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-bold text-ink-strong">
          {seg.text}
          {seg.reading && <span className="ml-1 font-normal text-muted-strong">({seg.reading})</span>}
        </span>
        <span className="text-sm font-bold underline decoration-2 underline-offset-2" style={{ color }}>
          {READING_LABELS[seg.kind]}
        </span>
      </div>
      {detail && (
        <p
          className="mt-1 inline-block rounded-sm border-l-[3px] px-2 py-0.5 text-sm font-semibold"
          style={{ color, borderColor: color, backgroundColor: tint(color, mode) }}
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
    <Tag className={`flex flex-wrap items-baseline ${compact ? 'gap-x-1 text-sm wide:text-base' : 'gap-x-3 text-3xl'}`}>
      <span>
        {entry.segments.map((seg, i) => (
          <span key={i} className={HL_CLASS[seg.kind]}>
            {seg.text}
          </span>
        ))}
      </span>
      <span className={`font-normal text-muted ${compact ? 'text-[9px] wide:text-[10px]' : 'text-lg'}`}>
        【{entry.reading}】
      </span>
    </Tag>
  );
}

/** The slim card's meaning (ADJ2_5): one line, ending in … if longer. The text itself is all there. */
const SLIM_MEANING = 'line-clamp-1';

/**
 * The diagonal "NEW" ribbon across the top-right corner of a card that was shuffled in. In High
 * contrast (FEAT5_5) it is brighter, with black text and a 2px black edge instead of its shadow.
 * If the mode's colour is missing it is white, so its dark text stays readable.
 */
function NewRibbon({ id }: { id?: string }) {
  const mode = useColorMode();
  const color = modeColor(CARD_COLORS_BY_MODE, mode, 'newRibbon', mode === 'high-contrast' ? '#ffffff' : NEW_COLOR);
  return (
    <span
      id={id}
      style={{ backgroundColor: color }}
      className="pointer-events-none absolute top-3 -right-8 w-28 rotate-45 py-0.5 text-center text-[11px] font-extrabold tracking-widest text-slate-900 uppercase shadow-sm hc:text-black hc:shadow-[0_0_0_2px_#000]"
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
 * below the wide layout (the pop-up, WIDE_LAYOUT_MIN_WIDTH), a 16px word and 9-11px text in it.
 * `slim` is the card on screen while the shuffled-out pop-up is open (ADJ2_5): its header, word,
 * reading and meaning at their normal size, with no Reading Breakdown, and the ★ Common Word
 * badge and the "Full Word Meaning" label hidden from view (screen readers still hear them). The
 * meaning is kept to one line, ending in … if it is longer; only how it is drawn is cut, so
 * screen readers still hear all of it.
 * `idPrefix` gives the compact card's meaning and ribbon the ids `<idPrefix>-meaning` and
 * `<idPrefix>-new`, so a pick card can have screen readers read them out (FEAT2_6).
 */
export function WordCard({
  entry,
  compact = false,
  isNew = false,
  slim = false,
  idPrefix,
  children,
}: {
  entry: WordEntry;
  compact?: boolean;
  isNew?: boolean;
  slim?: boolean;
  idPrefix?: string;
  children?: ReactNode;
}) {
  const mode = useColorMode();
  const header = headerColors(entry, mode);
  // Only the card on screen is an article, so it can be told apart from the cards in the lists.
  const Root = compact ? 'div' : 'article';

  return (
    // In High contrast (FEAT5_5) the card has a 2px white ring and no shadow.
    <Root
      className={`relative w-full overflow-hidden bg-card ring-1 ring-card-line hc:shadow-none hc:ring-2 ${
        compact ? 'rounded-lg shadow-sm' : 'max-w-sm rounded-xl shadow-lg'
      }`}
    >
      <header
        className={`font-bold tracking-wide text-white hc:text-black ${compact ? 'px-2 py-0.5 text-[8px] wide:text-[9px]' : 'px-4 py-2 text-xs'}`}
        style={{ backgroundColor: header.background, color: header.ink }}
      >
        {entry.jlpt ? `JLPT ${entry.jlpt}` : 'Vocabulary'}
      </header>
      {isNew && <NewRibbon id={idPrefix && `${idPrefix}-new`} />}

      {compact ? (
        <div className="space-y-1 px-2 py-1.5">
          <Word entry={entry} compact />
          <p id={idPrefix && `${idPrefix}-meaning`} className="text-[10px] meaning-text wide:text-[11px]">
            {entry.meaning}
          </p>
          {children}
        </div>
      ) : (
        <div className="space-y-3 px-4 py-4">
          <div>
            <Word entry={entry} compact={false} />
            {entry.common && (
              <p
                className={slim ? 'sr-only' : 'mt-1 badge-common'}
                style={{ color: modeColor(CARD_COLORS_BY_MODE, mode, 'common', FALLBACK_INK[mode]) }}
              >
                ★ Common Word
              </p>
            )}
          </div>

          {!slim && (
            <section className="rounded-lg border border-box-line bg-box p-3">
              <h3 className="mb-2 text-xs font-bold tracking-wider text-faint">READING BREAKDOWN</h3>
              <ul>
                {entry.segments.map((seg, i) => (
                  <SegmentRow key={i} seg={seg} />
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3 className={slim ? 'sr-only' : 'text-xs font-bold text-muted'}>Full Word Meaning</h3>
            <p className={`meaning-text ${slim ? SLIM_MEANING : ''}`}>{entry.meaning}</p>
          </section>
        </div>
      )}
    </Root>
  );
}
