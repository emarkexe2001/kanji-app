Ticket Code:
TEST10

Ticket Type:
Test

Test Name: 
Test Where Focus Goes When the Colour Mode Menu Closes From an Outside Press

Origin:
CHORE6 test agent (PR #93, 2026-11-16). When the colour mode menu closes because of a press outside it, `apps/web/src/features/color-mode/components/color-mode-menu.tsx` does this:

```ts
// Focus would be lost with the menu, so it goes back to the button; the press then moves it
// on to whatever it lands on, as usual.
if (wrapperRef.current?.contains(document.activeElement)) buttonRef.current?.focus();
setOpen(false);
```

So focus goes back to the colour mode button only if focus was inside the menu (e.g. on one of its options). If focus was somewhere else, it is left alone. No test covers this. `color-mode.test.tsx` checks that an outside press closes the menu and that pressing Next still works ("when I press outside the open menu, it closes…", "a press outside the menu still does what it was for…"), but not where focus ends up. Removing that line, or always focusing the button, would pass every test today. CHORE6 moved this code into the shared `useDismiss` call and didn't change it, so it was left out of scope there.

Description:
As a keyboard or screen reader user, when the colour mode menu closes because I pressed somewhere else, I would like focus to end up in a sensible place, not lost on the page, so I can carry on from where I am. As a developer I would like a test that catches it if this breaks.

Requirements / Expected Behaviours:
- Tests cover both sides of the rule: focus inside the menu, and focus outside it.
- Tests only. No app code changes. If a test shows the app doesn't do what the comment says, stop and report it, and don't fix it here.
- The tests go in `apps/web/test/ui-tests/color-mode.test.tsx` (or a new file next to it if that one is getting long), and follow `docs/testing.md`.

Possible Test Scenarios I would like to see:

When the menu is open with focus on one of its options and I press on an empty part of the page, the menu closes and focus is on the colour mode button

When the menu is open with focus on one of its options and I press a button outside it (e.g. Next), the menu closes and focus ends up where the press put it (or on the colour mode button if the press doesn't move focus), and the button's action still happens

When the menu is open but focus is outside it (e.g. I opened it with a click, then focused the card limit field) and I press outside, the menu closes and focus is not moved to the colour mode button

When the menu closes from an outside press, focus is never left on the page itself (`document.body`)

Break-and-restore check: remove the `buttonRef.current?.focus()` line and see the first scenario go red; change the check so it always focuses the button and see the third scenario go red

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. In jsdom, a pointer press on a button doesn't move focus the way a real browser does. Should the "press a button outside" scenario be checked in a UI test (with user-event's pointer actions), in an e2e test in a real browser, or both?

Mockup:
Changes nothing on screen.

Dependencies:
CHORE6 (PR #93) should be merged first, as it moves this code into the shared `useDismiss` call.

Branch name Examples:
test/colour-menu-focus-after-outside-press
