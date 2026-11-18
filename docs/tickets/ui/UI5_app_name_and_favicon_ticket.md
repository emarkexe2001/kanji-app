Ticket Code:
UI5

Ticket Type:
UI fix

Feature Name: 
One App Name, and a Favicon

Origin:
Codebase and app retro (2026-11-16).
- **No favicon.** `apps/web/index.html` has no icon link and `apps/web/public/` has no icon, so the browser's request for `/favicon.ico` gets a 404, and the tab shows the browser's blank page icon.
- **Two names.** The page title and the header both say "Kanji Reading Highlighter" (`index.html` and `src/app/app.tsx`), but the README calls the app "Colour Coded Kanji Card App". The repo and package are `kanji-app`.
- **No description.** There is no `<meta name="description">`, so a shared link or search result has no summary.

Description:
As a user I would like the app to have one name everywhere and its own icon in the browser tab, so I can find it among my tabs and bookmarks.

Requirements / Expected Behaviours:
- One agreed name is used in the page title, the header and the README.
- The app has a favicon (an SVG, plus a PNG fallback if needed) that is clear at 16px and 32px, on both light and dark browser tab bars.
- No request for an icon gets a 404, in dev or in the production build.
- The page has a short `<meta name="description">`.
- The header stays on one line from 320px up (FEAT5 rule), whatever the new name is.

Possible Test Scenarios I would like to see:

When I open the app, the page title is the agreed name (e2e)

When I open the app, the header shows the agreed name (UI test)

When I open the production build, the favicon loads and no request gets a 404 (e2e)

When the screen is 320px wide, the header name stays on one line (e2e)

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. Which name: "Kanji Reading Highlighter", "Colour Coded Kanji Card App", or something new?
   Answer (agreed 2026-11-18): "Kanji Reading Highlighter", the name the page title and header already use. CHORE5 uses it in the README.
2. What should the icon show (e.g. a kanji such as 読 or 字 on a JLPT-coloured card)? The mockup will show options side by side.
   Answer (agreed 2026-11-18): option B, 字 in white on an N3 indigo tile (`#6366f1`) with rounded corners (`rx` 7 on a 32-unit viewBox). The kanji is turned into a path (an outline) in the SVG, not left as text, so it looks the same on devices without Japanese fonts. At 16px only 字 keeps its strokes; white on `#6366f1` is 4.47:1, and the tile is 3.41:1 on a light tab bar and 3.60:1 on a dark one.
3. Should this also add a home-screen icon and web app manifest (so it can be added to a phone's home screen), or leave that to CI3 or a later ticket?
   Answer (agreed 2026-11-18): not in UI5. Leave them to CI3 or a new ticket. The app isn't online until CI3, so nobody can add it to a phone yet, and the manifest's start address depends on CI3's sub-path.
4. Should there be a fallback next to the SVG icon? Some older browsers (older Safari among them) can't show an SVG favicon, and some tools ask for `/favicon.ico` directly.
   Answer (agreed 2026-11-18): yes. Add `favicon.svg` and a `favicon.ico` (16px and 32px) at the site root. This covers older browsers and direct `/favicon.ico` requests, so nothing gets a 404.
5. Should this add the iPhone home-screen icon (`apple-touch-icon`, a 180px PNG)? It is only used when the app is added to an iPhone's home screen.
   Answer (agreed 2026-11-18): decided with question 3, so it is left for later too (CI3 or a new ticket).
6. Should the icon change with the colour mode (a different icon for Light and Dark)?
   Answer (agreed 2026-11-18): no, one fixed icon. Option B reads well on both light and dark tab bars.
7. What should the description say? It isn't shown in the app; it is the summary under the link in a search result or a shared link.
   Answer (agreed 2026-11-18): "Flash cards for Japanese words, with each kanji's readings colour-coded." (72 characters).
8. Should the icon also go beside the name in the header?
   Answer (agreed 2026-11-18): no, only in the browser tab. The header doesn't change.
9. Who changes the app's name in the README: this ticket, or CHORE5 (which rewrites the README)?
   Answer (agreed 2026-11-18): UI5 changes only the README's first heading line (`# Colour Coded Kanji Card App` → `# Kanji Reading Highlighter`). CHORE5 rewrites the rest.

Mockup:
Needed before work starts (standards 5.1): icon options at 16px, 32px and large, on light and dark tab bars, and the header with the chosen name at 320px.
Mockup: https://claude.ai/artifact/4MtRuC8RYFpzdqpLpumKbs (approved 2026-11-18).

Dependencies:
CHORE5 (README) should use the name agreed here, so do this first or agree the name before CHORE5 starts.

Branch name Examples:
fix/app-name-and-favicon
