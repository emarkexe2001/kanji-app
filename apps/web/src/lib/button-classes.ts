import { HC_EMERALD_BUTTON, HC_INDIGO_BUTTON, HC_ROSE_BUTTON, HC_SKY_BUTTON } from './high-contrast-buttons';

/**
 * The filled, colour-coded buttons (CHORE7): one place for their Light, Dark and High contrast
 * looks, used on plain `<button>`s as `className={buttonClass('sky', 'header')}`. Where the button
 * sits (e.g. `w-full`, `col-span-2`, `shrink-0`) stays with the button, added after this.
 *
 * The colour rule (standards §1): each colour says what the button does at a glance, and red
 * (rose) is only for deleting and other dangerous actions.
 * - sky: the Shuffled-out list ("Shuffled out (N)", "Recover cleared list (N)")
 * - indigo: Deck Shuffle
 * - emerald: putting cards into the deck (Shuffle In Cards, Add Back Cards)
 * - rose: Clear List and "Yes, Clear List"
 *
 * Next, Back, Cancel and the − / + buttons keep their own looks. Every class is written out in
 * full so Tailwind's scanner finds it: never build one from pieces such as `bg-${colour}-600`.
 */
export type ButtonVariant = 'sky' | 'indigo' | 'emerald' | 'rose';

/**
 * - header: "Shuffled out (N)" in the header.
 * - full: the 48px buttons under the card, Deck Shuffle and Shuffle In Cards.
 * - panel: the Shuffled-out panel's buttons, with less padding so two fit side by side in 300px.
 */
export type ButtonSize = 'header' | 'full' | 'panel';

/** What every filled button has: rounded, bold, a shadow, and it shrinks a little when pressed. */
const BASE = 'rounded-xl font-semibold shadow-sm transition active:scale-95';

/** The colour, its lighter hover, white text, and the High contrast look (see high-contrast-buttons.ts). */
const VARIANTS: Record<ButtonVariant, string> = {
  sky: `bg-sky-600 text-white hover:bg-sky-500 ${HC_SKY_BUTTON}`,
  indigo: `bg-indigo-600 text-white hover:bg-indigo-500 ${HC_INDIGO_BUTTON}`,
  emerald: `bg-emerald-600 text-white hover:bg-emerald-500 ${HC_EMERALD_BUTTON}`,
  rose: `bg-rose-600 text-white hover:bg-rose-500 ${HC_ROSE_BUTTON}`,
};

const SIZES: Record<ButtonSize, string> = {
  header: 'px-4 py-2 text-sm',
  full: 'px-4 py-3',
  panel: 'px-2 py-2 text-sm',
};

/** The classes for a filled button of this colour and size. */
export const buttonClass = (variant: ButtonVariant, size: ButtonSize) => `${BASE} ${SIZES[size]} ${VARIANTS[variant]}`;
