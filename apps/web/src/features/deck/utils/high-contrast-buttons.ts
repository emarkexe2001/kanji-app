/**
 * The coloured buttons in High contrast (FEAT5_5): black with white text and a 2px outline in the
 * button's colour, drawn inside the button (an inset ring) so its size doesn't change. No shadow,
 * and a #262626 fill under the pointer. Clear List's text is red as well as its outline. The
 * classes only apply in High contrast (the `hc:` variant in index.css).
 */
const HC_OUTLINED = 'hc:bg-page hc:text-ink hc:shadow-none hc:ring-2 hc:ring-inset hc:hover:bg-hc-hover';

/** "Shuffled out (N)" and "Recover cleared list (N)". */
export const HC_SKY_BUTTON = `${HC_OUTLINED} hc:ring-hc-sky`;
/** Deck Shuffle. */
export const HC_INDIGO_BUTTON = `${HC_OUTLINED} hc:ring-hc-indigo`;
/** Shuffle In Cards and Add Back Cards. */
export const HC_EMERALD_BUTTON = `${HC_OUTLINED} hc:ring-hc-emerald`;
/**
 * Clear List and "Yes, Clear List": red text and outline. Under the pointer the text turns white
 * (15.13:1 on #262626; red there is only 6.76:1) and the red outline stays (agreed 2026-11-09).
 */
export const HC_ROSE_BUTTON = `${HC_OUTLINED} hc:text-hc-rose hc:ring-hc-rose hc:hover:text-ink`;

/**
 * A disabled button in High contrast (FEAT5_5, agreed 2026-11-09), for Shuffle In Cards when
 * there's no other deck: it doesn't fade (no opacity, which would turn white text grey). It is
 * black with white text and a 2px dashed white outline drawn inside it, so its size doesn't
 * change. (The other disabled controls, the − / + buttons and a "Shuffle in from" option, write
 * the same look with their own `disabled:` / `has-disabled:` classes.)
 */
export const HC_DISABLED_BUTTON =
  'hc:bg-page hc:text-ink hc:opacity-100 hc:shadow-none hc:outline-2 hc:outline-dashed hc:-outline-offset-2 hc:outline-ink';
