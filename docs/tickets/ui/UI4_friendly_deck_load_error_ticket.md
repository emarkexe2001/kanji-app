Ticket Code:
UI4

Ticket Type:
UI fix

Feature Name: 
A Friendly Message and Try Again When the Cards Can't Load

Origin:
Codebase and app retro (2026-11-16). When `deck.json` fails to load, `apps/web/src/features/deck/hooks/use-deck.ts` builds the message `HTTP 404. Did you run "npm run data:build"?` and `apps/web/src/app/app.tsx` shows it as "Couldn't load the word deck: …". That hint is for developers. A user can't run it, doesn't know what HTTP 404 means, and has no way to try again except reloading the page.

Also, a `deck.json` that loads but isn't a list of words (e.g. a broken or half-written build) isn't checked. It crashes later, in `buildLibrary`, into the deck error boundary's "Something went wrong" message.

Description:
As a user, if my cards can't load (e.g. my connection drops), I would like a plain message that tells me what to do and a button to try again, without reloading the page or seeing developer messages.

Requirements / Expected Behaviours:
- The message is in plain words, e.g. "Couldn't load your word cards. Check your connection and try again." It doesn't show HTTP codes, error text or npm commands.
- A "Try again" button loads the cards again without reloading the page. While it loads, "Loading dictionary…" shows again.
- If it works the second time, the deck shows as normal, with the saved deck, card limit and colour mode all kept.
- If it fails again, the message and button show again.
- The developer detail (the error and the `npm run data:build` hint) goes to the browser console (`console.error`), and may also show on screen in dev builds only (`import.meta.env.DEV`).
- A `deck.json` that isn't a list (array) of words shows the same friendly message, not the error boundary.
- The message is announced to screen readers (`role="alert"`), and the button can be reached and pressed with the keyboard.
- The button follows the colour-coded button rule (standards §1) and works in Light, Dark and High contrast.

Possible Test Scenarios I would like to see:

When the cards fail to load, I see the friendly message and a Try again button, and no HTTP code or npm command

When I press Try again and the cards load, the deck shows with my saved deck and card limit

When I press Try again and it fails again, the message and button show again

When `deck.json` loads but isn't a list of words, I see the friendly message, not "Something went wrong"

When the cards fail to load, the developer detail is written to the console

When the cards fail to load in High contrast, the message and button are readable (e2e or UI test)

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. What exact wording should the message and button use?
2. What colour should Try again be? The existing colours are emerald (Shuffle In Cards), indigo (Deck Shuffle), slate (Next) and outline (Back).
3. Should dev builds still show the `npm run data:build` hint on screen, or only in the console?
4. Should the app try again by itself once (e.g. after 2 seconds) before showing the button?

Mockup:
Needed before work starts (standards 5.1): today's error screen and the new one, at 360px and 1024px, in Light, Dark and High contrast.

Branch name Examples:
fix/friendly-deck-load-error
