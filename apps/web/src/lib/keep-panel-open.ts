/**
 * Marks a part of the page that the Shuffled-out cards panel doesn't count as "outside" it: a press
 * there doesn't close the panel. The colour mode button and its menu have it (FEAT5), so changing
 * the mode leaves the panel as it is. Kept here so the two features can share it without
 * importing from each other.
 */
export const KEEP_PANEL_OPEN_ATTRIBUTE = 'data-keep-panel-open';
