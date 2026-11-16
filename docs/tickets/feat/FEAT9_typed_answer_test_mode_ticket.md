Ticket Code:
FEAT9

Feature Name: 
Test Mode: Type the Reading

Origin:
Codebase and app retro (2026-11-16), from the user: "Test Mode would also be nice where you have a set of cards that get revealed to the user with no answer and they have to type out what the kanji is either in romaji or hiragana". FEAT7 (Hide answers) lets me check myself in my head. This mode makes me type the answer and checks it for me.

Feature Description:
As a user I would like a test mode that shows me a set of cards with no answers, and has me type each word's reading in hiragana or romaji, so I can find out which readings I really know.

Feature Requirements / Expected Behaviours:
- A "Test mode" button starts a test on a set of cards (which set is agreed in the questions).
- Each test card shows the word only, with no reading, breakdown or meaning.
- I type the reading in a field, in hiragana (e.g. たべる) or romaji (e.g. taberu), and press Check or Enter.
- Romaji is turned into hiragana before checking, including long vowels, small っ (e.g. "kitte" → きって), ん ("n" and "nn") and small ゃゅょ (e.g. "kyou" → きょう).
- Spaces at the start and end are ignored. Katakana typed for a hiragana reading counts as right.
- After Check, it says right or wrong, and shows the right reading, the Reading Breakdown and the meaning. Then Next goes on to the next test card.
- An empty answer shows an inline message next to the field ("Type the reading to check it."), announced to screen readers (`role="alert"`, standards §1).
- At the end, a summary shows how many I got right out of how many, and lists the ones I got wrong with their readings.
- I can leave the test at any time and go back to my deck as it was. The test doesn't change my deck, the Shuffled-out list or the "New" badges.
- The app's shortcuts (← → S) stay off while typing in the answer field.
- Works with the phone's Japanese keyboard (IME): pressing Enter to confirm a kana conversion doesn't submit the answer.
- Works in Light, Dark and High contrast, from 320px up.

Possible Test Scenarios I would like to see:

When I start a test, each card shows only the word, with no reading or meaning

When I type the right reading in hiragana and press Check, it says I'm right and shows the meaning

When I type the right reading in romaji (e.g. "taberu" for 食べる), it says I'm right

When I type romaji with small っ, long vowels or ん (e.g. "kitte", "kyou", "kanji", "konnichiha"), it is turned into the right hiragana

When I type the wrong reading, it says I'm wrong and shows the right reading

When I press Check with an empty answer, I see "Type the reading to check it." next to the field

When I finish the test, the summary shows my score and the cards I got wrong

When I leave the test part way, my deck, card on screen and Shuffled-out list are as they were

When I press Enter to confirm a kana conversion in the IME, the answer isn't checked yet

When I type S or arrow keys in the answer field, the deck doesn't shuffle or move

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. Which cards are in a test: the cards in my deck now (my card limit), a number I choose, or random cards from a deck I pick?
2. Romaji to hiragana: use a small, well-known library (e.g. wanakana) or write our own conversion table? A library is a new dependency.
3. Each word has one reading in `deck.json`. Should other correct readings (e.g. other readings in JMdict) count as right? That would need the data build to keep them.
4. Should "ou" and "oo" both count for おう, and "ha" for は in "konnichiha" vs "konnichiwa"? How strict should it be?
5. Should wrong cards be asked again at the end of the test (until all are right), or only listed?
6. Should scores be saved (e.g. a history of tests), or only shown at the end?
7. The app has one screen today. Does the test replace the deck on the same screen (like the start page), or open as its own page? (ARCH1's Next.js note says to rethink the stack if the app gains several pages.)
8. This ticket has several separate pieces (the test flow, romaji input, the summary). Should it be split before starting (standards 5.1)?

Mockup:
Needed before work starts (standards 5.1): starting a test, a test card before and after Check (right and wrong), the empty-answer message and the summary, at 360px and 1024px, in Light, Dark and High contrast.

Dependencies:
FEAT7 (Hide answers) may give the hidden card this mode reuses. UI3 should be done first, so the shortcut rules are settled.

Branch name Examples:
feature/typed-answer-test-mode
