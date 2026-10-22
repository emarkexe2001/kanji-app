Ticket Code:
FEAT5

Feature Name: 
Colour Mode Toggle (Light, Dark and High Contrast)

Origin:
Requested 2026-10-22 while starting FEAT2_6, which makes picked cards visible in the system's high-contrast mode. I would also like to choose the look inside the app itself.

Feature Description:
As a user I would like a toggle in the app to switch between a light (white) mode, a dark (black) mode and a high-contrast mode, so I can pick the look that is easiest for me to read.

Feature Requirements / Expected Behaviours:
- A toggle lets me choose Light, Dark or High contrast.
- Light mode is the app as it looks today.
- Dark mode uses a black/dark background with light text across the whole app (header, deck, cards, Shuffled-out panel, controls and footer).
- High-contrast mode uses only strong colours with a contrast of at least 7:1 for text: no faint greys, thick clear outlines on buttons, inputs and picked cards, and focus outlines that are always easy to see.
- The colour coding still works in every mode: the reading colours (onyomi, kunyomi, okurigana), the JLPT header colours, the green/red pick colours, red danger buttons and the NEW ribbon can still be told apart, and the text on them stays readable. The colours come from the shared tokens in @kanji/core, with a version per mode where needed.
- My choice is remembered the next time I open the app (saved through the storage helper, so the app still works when storage is blocked).
- The page switches mode straight away, with no reload and no flash of the wrong mode when the app opens.
- The toggle can be used with the keyboard and tells screen readers which mode is on.
- If the device itself is in forced-colours (Windows high contrast) mode, that still wins, as in FEAT2_6.
- Everything else in the app stays the same.

Possible Test Scenarios I would like to see:

When I choose Dark, the app switches to dark mode straight away

When I choose High contrast, the app switches to high-contrast mode straight away

When I choose Light, the app looks as it does today

When I choose a mode and open the app again, the same mode is still on

When storage is blocked, the toggle still works and the app does not crash (the choice just isn't remembered)

When I use the toggle with the keyboard, a screen reader hears which mode is on

Failure paths (see docs/testing.md - each one needs a UI test, and each test must be checked to fail when the code it covers is broken):

When the saved mode is broken or unknown, the app opens in the default mode instead of crashing

Layout check (see docs/standards/standards.md 4.2): look at every mode in a real browser at about 360px, 640px and 1024px, including the open Shuffled-out panel, and note it in the PR

Open Questions (to confirm before starting, with a mockup first - standards 5.1):
- Where does the toggle go: in the header next to the title (beside "Shuffled out (N)"), in the footer, or somewhere else?
- What does the toggle look like: three buttons side by side (Light / Dark / High contrast), one button that cycles through the modes, or a dropdown? Words, icons or both?
- Which mode is used the first time I open the app: Light, or the device's own light/dark setting?
- High contrast: black background with white and yellow text (like Windows), or white background with black text, or should I be able to choose both?
- Should switching modes have a short fade, or change instantly (and always instantly when reduced motion is on)?
- This ticket covers several pieces (a toggle, dark colours for every part of the app, high-contrast colours). Should it be split into smaller tickets (e.g. FEAT5 toggle + dark mode, FEAT5_5 high-contrast mode) before starting (standards 5.1)?

Dependencies:
FEAT2_6 should be merged first, since it adds the forced-colours styling for picked cards and the shared NEW ribbon colour token, which this ticket builds on.

Branch name Examples:
feature/colour-mode-toggle
