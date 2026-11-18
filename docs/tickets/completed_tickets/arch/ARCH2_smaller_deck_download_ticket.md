Ticket Code:
ARCH2

Ticket Type:
Architecture

Feature Name: 
Download Less Before the First Card Shows

Origin:
Codebase and app retro (2026-11-16). On start, `apps/web/src/features/deck/hooks/use-deck.ts` downloads all of `apps/web/public/data/deck.json`, parses it, shuffles it and builds every deck (`buildLibrary`) before the first card shows. Measured on `main` (f68feaf):
- `deck.json` is **5.4 MB** (about **0.9 MB** gzipped), with **17,400 words**.
- Words per deck: N5 523, N4 515, N3 1,762, N2 1,299, N1 2,039, Common words 17,387. 11,262 words have no JLPT level.
- From opening the page to "Card 1 of 10" took about 2.8s on a 360x640 phone viewport against the local dev server (no network delay), and about 0.6s at desktop size once warm. On a real phone on mobile data it will be slower.
- The file is committed to git, so each rebuild adds another 5.4 MB to the repo's history.

The studied deck (e.g. N5) needs only a few hundred words. The other decks are only needed for Shuffle In Cards.

Description:
As a user, especially on a phone or slow connection, I would like my first card to show quickly, without waiting for the whole dictionary to download.

Requirements / Expected Behaviours:
- The first card shows after downloading only what the studied deck needs, or far less than today's 5.4 MB (target agreed in the questions).
- Shuffle In Cards, Multiple decks, the Shuffled-out list, Add Back, Back and the "New" badge all work as today. If a source deck isn't loaded yet when it's needed, it loads then, with a loading state, and errors are handled as in UI4.
- Everything already saved in browser storage (saved deck, shuffled-out and cleared lists, shuffle choice) still loads. Card ids don't change.
- `npm run data:build` (`scripts/build-deck.ts`) writes the new files, and `data/README.md` says what they are.
- The size and the time to the first card are measured before and after, in a Playwright run with a throttled "Fast 4G" network, and noted in the PR.

Possible Test Scenarios I would like to see:

When I open the app studying N5, only the N5 data (or the agreed smaller set) is downloaded before the first card shows (e2e, checking network requests)

When I shuffle in from a deck that isn't loaded yet, it loads and the new cards are shuffled in

When a source deck fails to load during Shuffle In Cards, I see an error and my deck doesn't change

When I reload with a deck saved before this change, my saved deck, shuffled-out list and shuffle choice are all kept

When I run `npm run data:build`, the new files are written and the scripts tests pass

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. Which approach?
   a. One file per deck (n5.json … n1.json, common.json), loaded as needed. Common words holds 17,387 words, nearly the whole dictionary, so studying or shuffling in from it would still be a big download.
   b. A smaller format for the same single file (short keys, the root meanings stored once per kanji instead of on every word). This needs a measurement first.
   c. Load the studied deck first and the rest in the background after the first card shows.
   d. A mix, e.g. b plus c.
2. What is the target size or time to the first card?
3. Should `deck.json` (and any new files) stay committed to git, or be built in CI and left out of the repo?
4. Should the Common words deck keep all 17,387 words, or be trimmed?

Measured before answering (2026-11-17, gzip level 9, `deck.json` on `main`):

| Data | Words | Raw | Gzipped |
|---|---|---|---|
| Today's whole `deck.json` | 17,400 | 5.45 MB | 901 KB |
| Same file, smaller format (option b) | 17,400 | 3.18 MB | 740 KB |
| N5 only | 523 | 0.15 MB | 27 KB |
| N4 only | 515 | 0.15 MB | 29 KB |
| N3 only | 1,762 | 0.51 MB | 93 KB |
| N2 only | 1,299 | 0.41 MB | 77 KB |
| N1 only | 2,039 | 0.63 MB | 114 KB |
| Common words | 17,387 | 5.44 MB | 900 KB |

11,250 common words have no JLPT level, and 12 words are in no deck.

Agreed answers (2026-11-17):
1. **Option d: split files plus background loading (a + c).**
   - The build writes one file per JLPT level and one file of the common words that have no JLPT level. No word is stored in two files. The Common words deck is built from the common words across all the files.
   - A small manifest (or the code) lists which decks exist, so the deck menu and the saved-deck check work before every file has loaded.
   - The first card waits only for the studied deck's files, plus the files of any deck named in the saved data (see answer 5). The other files then load in the background.
   - If Shuffle In Cards needs a file that hasn't loaded yet, it waits for it with a loading state (to be mocked up first, standards 5.1). If that file fails, the error is handled as the requirements say, and the deck doesn't change.
   - Option b (the smaller format) is not done: it saved only 18% gzipped.
2. **Target:** with a JLPT deck studied and nothing from other decks saved, the first card waits for at most **150 KB gzipped** of deck data (N1, the biggest, is 114 KB). The Common words deck is exempt. Time to the first card on throttled Fast 4G is measured before and after and reported in the PR, with no fixed time to hit.
3. **The built files stay committed to git**, as `deck.json` is today. The app works straight after cloning, and CI3 can publish the files as they are. `deck.json` is replaced by the new files rather than kept alongside them.
4. **Common words keeps all 17,387 words.** Trimming it would change what is studied, so it would need its own ticket.
5. **Added while checking the code (2026-11-17): saved cards from other decks.** The saved deck stores each card as `{ id, deck }`, and `toDeckCard` in `saved-deck.ts` drops any card whose id isn't in `library.byId`. With split files, a card shuffled in from another deck would be dropped on reload if its deck's file hadn't loaded yet. So, before the saved deck, the removed list and the cleared list are restored, the app loads the files of every deck named in them. The test "reload with a deck saved before this change" must include cards shuffled in from another deck, including Common words.

Mockup:
No change on screen unless a loading state for Shuffle In Cards is added. If it is, mock that state up first (standards 5.1).

Mockup approved 2026-11-17: https://claude.ai/artifact/86vMoX8sgHGtDhkpY3sB2U (Design canvas: today vs after, Light, Dark and High contrast, 360x640 and 1024x768).

Agreed mockup answers (2026-11-17):
6. **Shuffle In loading state:**
   - The Shuffle In Cards button keeps its colour and shows a 16px spinner with "Loading cards…". A second press does nothing.
   - Screen readers hear "Loading cards…". With reduced motion turned on, the spinner stands still.
   - The box doesn't change size.
   - The count and ticked-deck checks run before any wait.
7. **Shuffle In error:** "Couldn't load the cards to shuffle in. Check your connection and press Shuffle In Cards to try again."
   - It's shown right-aligned in the count message's place and read out to screen readers.
   - Pressing Shuffle In Cards again retries. Any change clears it. The deck doesn't change.
8. **Picking a deck to study before its file has loaded (part of ARCH2):**
   - The current deck stays on screen and usable, with "Loading <deck>…" under the Deck row.
   - If the file fails, the dropdown goes back to the old deck and shows "Couldn't load <deck>. Pick it again to retry." (shortened by answer 15).
9. **While Shuffle In waits:** Next, Back, Deck Shuffle, the keys, Add Back and the Shuffled-out panel stay usable. The cards go in when the file arrives, using the deck as it is then, and the replaced card goes to Shuffled out.
10. **Cancelling and timing:**
    - There's no Cancel button. Changing anything in the Shuffle In box, switching decks or changing the card limit cancels the wait.
    - The loading state shows straight away.
    - There's no automatic retry for now; ARCH2 follows UI4's answer once it has one.
    - A file that fails in the background stays silent and is downloaded again when it's needed.
11. **Common words cards in saved data:** accepted for now. If the saved data holds a Common words card, every file loads before the first card (about 900 KB gzipped, the same as today). The PR notes this as a known gap.

Agreed while writing the UI handover (2026-11-17):
12. **Picking another deck cancels a Shuffle In wait** as soon as it's picked, even while that deck is still loading. Cards meant for the old deck never land in the new one.
13. **Changing the card limit doesn't cancel a pending deck pick.** The new deck opens with the new limit once its file arrives.
14. **The Deck row's loading and error line has reserved space:** a fixed slot under the Deck row, there at all times, so nothing on the page moves when the line appears or clears. This is drawn on the mockup under "Decisions added after approval".
15. **The slot is one line, and the Deck error text is shorter (2026-11-17).** The slot is 22px (a 6px gap and a 16px line) and is always there, so the card sits 22px lower than today. At 360x640, Back/Next move from y 640 to y 662, which is accepted. The answer 8 error text didn't fit one line at 360px (372px for JLPT N1 and 415px for Common words, in a 328px slot), so it is now "Couldn't load <deck>. Pick it again to retry." (299px at most). The slot doesn't wrap, and its height is tested.

Branch name Examples:
feature/smaller-deck-download

Completed On:
2026-11-18 (PR #113)
