Ticket Code:
UI2

Ticket Type:
UI fix

Feature Name: 
Cards Crash When the Browser Can't Read a Device Setting

Origin:
FEAT5_1 (PR #60, 2026-11-04). The browser re-check on the final commit (921df75) made `window.matchMedia` throw an error, to check the B1 fix. The start page worked, in Light. But after choosing a mode, the cards area showed "Something went wrong showing the cards. Please reload the page to try again." The header and the colour mode button still worked.

The cause is two deck hooks that read device settings:
- `apps/web/src/features/deck/hooks/use-reduced-motion.ts` (the "reduce motion" setting)
- `apps/web/src/features/deck/hooks/use-wide-layout.ts` (whether the screen is wide enough for the floating Shuffled-out panel)

Both check that `window.matchMedia` exists, but don't catch it throwing. When it throws, the deck crashes into its error boundary (`DeckErrorBoundary`). These hooks are older than FEAT5_1 and behave the same on `main`. Before FEAT5_1 the whole deck crashed on load in the same case. The colour mode code already guards this call (`deviceDarkQuery()` in `src/lib/color-mode.ts`, and the `index.html` script).

Real browsers don't normally throw here, so this is low priority. It can happen in some locked-down or unusual browsers and embedded views.

Description:
As a user, if my browser can't tell the app my device settings, I would like to still see and use my cards, with the app using sensible defaults, rather than an error message.

Requirements / Expected Behaviours:
- If reading a device setting throws, the deck still shows and works, with no error message.
- "Reduce motion" falls back to off (the slide animations play), as it does today when `matchMedia` is missing.
- The wide layout falls back to "not wide" (the Shuffled-out panel pops up over the page), as it does today when `matchMedia` is missing.
- Use one guarded way to read a media query for all three places (the two deck hooks and the colour mode's `deviceDarkQuery()`), e.g. a small helper in `src/lib/`, rather than three copies of the try/catch.
- Nothing changes when `matchMedia` works: the same animations, layout and live updates when the setting changes.
- Check the rest of `apps/web/src` for any other unguarded `matchMedia` call and fix it the same way.

Possible Test Scenarios I would like to see:

When reading a device setting throws and I open the app with a saved mode, my cards show and I can use Next, Shuffle and Shuffle In Cards, with no error message

When reading a device setting throws and I choose a mode on the start page, my cards show, with no error message

When reading a device setting throws, the card slide animations still play (reduce motion is treated as off)

When reading a device setting throws, the Shuffled-out panel pops up over the page (the narrow layout), at any screen width

When `matchMedia` works, reduce motion and the wide layout still follow the device setting live, as before

Break-and-restore check: remove the guard from the shared helper and see the "throws" tests go red

Dependencies:
FEAT5_1 (PR #60) should be merged first, as it adds `deviceDarkQuery()`, which this ticket moves into the shared helper.

Branch name Examples:
fix/media-query-crash
