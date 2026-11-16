Ticket Code:
FEAT10

Feature Name: 
Example Sentence and Explanation for Each Card

Origin:
Asked for by the user during the refactor retro (2026-11-16): "an example sentence and explanation for the word for each card that can be viewed with a press of a button".

What the data has today (checked 2026-11-16):
- The JMdict file the deck is built from (`data/raw/jmdict-eng-common-*.json.zip`) has **no example sentences**. Not one of its senses has an `examples` field.
- It does have, for each sense, the part of speech (e.g. "Godan verb, transitive"), usage notes (`misc`, e.g. "usually written using kana alone"), extra info (`info`) and related words. `scripts/build-deck.ts` keeps none of these today; each card only has its meaning.
- jmdict-simplified (the project our JMdict files come from) also publishes a version with example sentences taken from the Tatoeba project, linked to word senses. Tatoeba's sentences are under CC BY 2.0 FR, so they would need their own credit in the footer.

Feature Description:
As a user I would like to see an example sentence using the word, with an explanation of the word, when I press a button on a card, so I can see how the word is really used and understand it better.

Feature Requirements / Expected Behaviours:
- A button on the card on screen (e.g. "Example") shows the example sentence and explanation. Pressing it again (or a close button) hides them. Opening them doesn't move to another card.
- The example shows:
  - the Japanese sentence, with the card's word picked out in it (e.g. bold or its reading colours);
  - the sentence's reading, if agreed (questions);
  - its English translation.
- The explanation shows the word's part of speech and usage notes in plain words (e.g. "Verb (godan, transitive). Usually written in kana."), and any other agreed detail.
- A card with no example sentence says so (e.g. "No example sentence for this word yet."), and still shows the explanation. The button never leads to an empty box.
- Each card starts with them hidden: after Next, Back, Deck Shuffle, Shuffle In Cards and Add Back.
- The data comes from `npm run data:build`, so it works offline like the rest of the deck. New sources and their licences are listed in `data/README.md` and credited in the footer.
- Screen readers hear the button's state (expanded or not, `aria-expanded`) and the sentence and translation when they open.
- Works in Light, Dark and High contrast, from 320px up. Nothing is cut off on the slim card under the Shuffled-out pop-up (agree whether the button shows there).
- If FEAT7 (Hide answers) is on, the example stays hidden until the answer is revealed, so it doesn't give the answer away.

Possible Test Scenarios I would like to see:

When I press Example on a card, I see an example sentence with the word picked out, its English translation and the explanation

When I press Example again (or close it), they are hidden

When I open the example and press Next, the next card starts with the example hidden

When a card has no example sentence, pressing Example says there isn't one yet and still shows the explanation

When I press Example, a screen reader hears that it expanded, then the sentence and translation

When Hide answers (FEAT7) is on, the Example button doesn't show the example until the answer is revealed

When I run `npm run data:build`, cards get their example sentences and explanations, and the scripts tests pass (unit test on the build step that matches sentences to words)

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. Where do the example sentences come from?
   a. jmdict-simplified's version with Tatoeba examples (real sentences, CC BY 2.0 FR, not every word has one).
   b. Tatoeba's own sentence files, matched to words by the build script.
   c. Written with an AI model during the data build (one for every word, but each needs checking for mistakes, and the source would need saying in the app).
   d. A mix: real sentences where there is one, and nothing (or c) for the rest.
2. What should "explanation" mean: the part of speech and usage notes from JMdict, a short note in plain English on how the word is used, or both?
3. One example per word, or several (e.g. Next example)?
4. Should the sentence show its reading (furigana over the kanji, or the whole sentence in hiragana underneath)?
5. Where does the button go, and does the example open inside the card (making it taller) or in a pop-up over it?
6. Should the button show on the slim card while the Shuffled-out pop-up is open?
7. Should the example cards be cut down to fit ARCH2 (smaller download)? Example sentences for 17,400 words would make `deck.json` much bigger, so it may need loading only when the button is pressed.
8. Should this be split into a data ticket (the build script and sources) and a UI ticket (the button and panel), standards 5.1?

Mockup:
Needed before work starts (standards 5.1): a card with the example closed and open, a card with no example, at 360px and 1024px, in Light, Dark and High contrast, with the button placement options side by side.

Dependencies:
ARCH2 (smaller deck download) affects how the new data is loaded. FEAT7 (Hide answers) affects when the example can show. Agree the order between them.

Branch name Examples:
feature/example-sentence
