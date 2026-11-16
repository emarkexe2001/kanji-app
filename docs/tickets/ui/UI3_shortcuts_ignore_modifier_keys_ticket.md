Ticket Code:
UI3

Ticket Type:
UI fix

Feature Name: 
Keyboard Shortcuts Fire With Ctrl, Cmd and Alt

Origin:
Codebase and app retro (2026-11-16). The deck's key handler in `apps/web/src/features/deck/components/deck.tsx` (`onKey`) only checks `e.key`. It never checks `ctrlKey`, `metaKey` or `altKey`. So:
- **Ctrl+S / Cmd+S** (save page) does a Deck Shuffle, and the browser's Save dialog opens too. The deck the user was studying is shuffled by accident.
- **Alt+← / Alt+→** (browser back and forward) also move a card back or on, at the same time as the browser leaves the page.
- **Ctrl+← / Ctrl+→** (move by word, and other system shortcuts) move cards too.

Holding an arrow key down also races through the deck, because key repeats (`e.repeat`) each count as a press.

Description:
As a user I would like the app's shortcuts (← back, → next, S deck shuffle) to only fire when I press the key on its own, so browser and system shortcuts never shuffle or move my cards by accident.

Requirements / Expected Behaviours:
- ←, → and S do nothing in the app while Ctrl, Cmd (Meta) or Alt is held. The browser's own shortcut still works as normal.
- ←, → and S on their own work as today.
- The shortcuts still stay off while typing in a field or using a menu (today's `isTyping` check), and also in any `contenteditable` element.
- A key press another handler has already dealt with (`e.defaultPrevented`) is ignored.
- The keyboard hint under the controls ("Keyboard: ← back · → next · S deck shuffle") doesn't change.

Possible Test Scenarios I would like to see:

When I press Ctrl+S, the deck isn't shuffled and the card on screen stays the same

When I press Cmd+S (Meta), the deck isn't shuffled

When I press Alt+← or Alt+→, the card on screen doesn't change

When I press Ctrl+← or Ctrl+→, the card on screen doesn't change

When I press ←, → or S on their own, Back, Next and Deck Shuffle still work

When I type S in the "Cards to shuffle in" or card limit field, the deck isn't shuffled (already covered, keep it passing)

Break-and-restore check: remove the modifier check and see the Ctrl+S and Alt+arrow tests go red

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. Should Shift+S still do a Deck Shuffle? Today it does, because the key is lower-cased. Caps Lock gives the same "S".
2. Should holding an arrow key down keep moving through cards (today), or move one card per press (ignore `e.repeat`)?
3. This changes nothing on screen. Is a mockup needed (standards 5.1), or is "changes nothing on screen" enough in its place?

Branch name Examples:
fix/shortcuts-ignore-modifier-keys
