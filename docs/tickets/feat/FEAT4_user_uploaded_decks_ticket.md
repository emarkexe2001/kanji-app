Ticket Code:
FEAT4

Feature Name:
User Uploaded Decks

Origin:
Clarifying FEAT1 (2026-10-20). FEAT1 adds the built-in JLPT N5-N1 and Common words decks. Later I would like to bring my own decks too.

Feature Description:
As a user I would like to upload my own deck of words, so I can study the vocabulary I care about and shuffle it in alongside the built-in decks.

Feature Requirements / Expected Behaviours:
- An "Upload deck" button lets the user pick a file (format to be agreed, e.g. CSV with word, reading, meaning, or JSON in the same shape as the built-in decks)
- The user gives the deck a name. The name can't be empty or the same as another deck's.
- An uploaded deck appears everywhere the built-in decks do: it can be studied, and cards can be shuffled in from it (FEAT1, FEAT3)
- Uploaded decks are still there after a reload. Browser storage is only used through the src/lib/storage.ts helper, and the app still works (without remembering) if storage is blocked.
- The user can delete an uploaded deck. This is a dangerous action, so it uses a red button and asks for confirmation. Built-in decks can't be deleted.
- Follows the UI standards: validation messages inline with role="alert"

Possible Test Scenarios I would like to see:

When I upload a valid deck file and name it, the deck appears in the deck list and I can study it

When I upload a deck, I can shuffle cards in from it into another deck

When I reload the app, my uploaded deck is still there

When I delete an uploaded deck and confirm, it is gone from the deck list

Failure paths (see docs/testing.md - each one needs a UI test, and each test must be checked to fail when the code it covers is broken):

When I upload a file that isn't a valid deck, a message explains what is wrong and no deck is added

When I upload a deck with no words in it, a message is shown and no deck is added

When I give the deck an empty name or a name that is already used, a validation message is shown

When I delete a deck and then cancel the confirmation, nothing is deleted

When browser storage is blocked, an uploaded deck still works for the current session

Open Questions (to confirm before starting, per PROC3):
- Which file formats are accepted (CSV, JSON, both, an Anki export)?
- Is there a maximum deck size or file size? localStorage only holds about 5 MB, so large decks may need IndexedDB.
- Uploaded words won't have the reading breakdown (segments) the built-in cards have. Should the card hide that section, or should the app try to build it from the kanji data?
- What happens to cards from a deleted deck that are in the current deck or the shuffled-out list?

Dependencies:
FEAT1 (decks and Shuffle In Cards).

Branch name Examples:
feature/user-uploaded-decks
