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

Mockup:
No change on screen unless a loading state for Shuffle In Cards is added. If it is, mock that state up first (standards 5.1).

Branch name Examples:
feature/smaller-deck-download
