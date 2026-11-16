Ticket Code:
FEAT7

Feature Name: 
Hide the Answers Until I Reveal Them

Origin:
Codebase and app retro (2026-11-16). Every card always shows the reading 【…】, the Reading Breakdown and the meaning next to the word (`apps/web/src/features/deck/components/word-card.tsx`). So the app only lets me read cards. It can't test whether I remember a reading.

Feature Description:
As a user I would like to hide the reading and meaning on my cards and reveal them when I'm ready, so I can test myself on each kanji before I see the answer.

Feature Requirements / Expected Behaviours:
- A "Hide answers" on/off control (placement agreed in the mockup). It is off by default, so the app works as today until it's turned on.
- While it is on, the card on screen shows its header (JLPT level) and the word only. The reading, the ★ Common Word badge, the Reading Breakdown and the meaning are hidden.
- A "Reveal" button on the card shows everything. A keyboard key reveals it too (agreed in the questions). Revealing doesn't move to another card.
- Each card starts hidden again: after Next, Back, Deck Shuffle, Shuffle In Cards and Add Back.
- The choice is saved, so it is still on after a reload.
- Screen readers don't hear the hidden answers until they are revealed, and hear when they are.
- The "New" ribbon, card count, Back/Next/Deck Shuffle, Shuffle In Cards, the card limit and the Shuffled-out panel all work as today.
- Works in Light, Dark and High contrast, from 320px up, and with the slim card under the Shuffled-out pop-up (ADJ2_5).

Possible Test Scenarios I would like to see:

When I turn Hide answers on, the card on screen shows only its header and word, and the reading, breakdown and meaning are hidden

When I press Reveal, the reading, breakdown and meaning show, and the card count doesn't change

When I reveal a card and press Next (or Back, Deck Shuffle), the next card starts hidden

When I reload with Hide answers on, it is still on

When Hide answers is off, cards show everything, as today

When Hide answers is on, a screen reader doesn't hear the meaning until I press Reveal

When I press the reveal key while typing in a field, nothing is revealed

Questions / Clarifications:
(Before starting, read the ticket against docs/standards/standards.md. Write each conflict or unclear point here as a question, then write the agreed answer and its date under it. Write "None" if there are no questions.)
1. The word's own colours show which parts are onyomi, kunyomi and okurigana. While hidden, should the word be plain (no colours), or keep its colours?
2. Where does the Hide answers control go: the header, next to the card limit, or on the card?
3. Which key reveals the card: Space, Enter, ↓ or R? (Check it against UI3's shortcut rules.)
4. Can I hide the answer again on the same card after revealing it?
5. Should the small cards in the Shuffled-out panel hide their meanings too, or always show them?
6. Is the reading 【…】 hidden too, or only the meaning and breakdown (e.g. a "meaning only" level)?

Mockup:
Needed before work starts (standards 5.1): the card hidden and revealed, the control's placement options side by side, at 360px and 1024px, in Light, Dark and High contrast, and the slim card under the pop-up.

Dependencies:
FEAT9 (Test mode) may reuse the hidden card from this ticket. Agree the order between them.

Branch name Examples:
feature/hide-answers-mode
