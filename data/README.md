# Dictionary data

`raw/` holds the source dictionaries used to build the study deck. The `.zip` files are
the originals; the `.json` files inside are unzipped copies (regenerate them by unzipping).

| File | Source |
|---|---|
| `jmdict-eng-common-3.6.2+20260914172325.json.zip` | https://github.com/scriptin/jmdict-simplified/releases/tag/3.6.2%2B20260914172325 |
| `kanjidic2-en-3.6.2+20260914172325.json.zip` | same release |
| `jlpt/n5.csv` … `jlpt/n1.csv` | https://github.com/jamsinclair/open-anki-jlpt-decks/tree/1ad66734417aca9dbcca6b2d5ee440cb13ab3ba0/src (downloaded 2026-10-20, unchanged) |
| `jlpt/LICENSE` | the MIT licence of open-anki-jlpt-decks, from the same commit |

The first two are JSON conversions (by scriptin/jmdict-simplified) of the
[EDRDG](https://www.edrdg.org/) JMdict and KANJIDIC2 files.

The JLPT lists are the vocabulary notes of
[open-anki-jlpt-decks](https://github.com/jamsinclair/open-anki-jlpt-decks) by Jamie Sinclair.
They are based on [chyyran/jlpt-anki-decks](https://github.com/chyyran/jlpt-anki-decks), which
came from the JLPT vocabulary lists by Jonathan Waller at [tanos.co.uk](http://www.tanos.co.uk/jlpt/).
They are only read as data by `scripts/jlpt-list.ts`; nothing in them is run.

## License

JMdict and KANJIDIC2 are © the Electronic Dictionary Research and Development Group and are
distributed under [CC BY-SA 4.0](https://www.edrdg.org/edrdg/licence.html). Any app or data file
derived from them must keep this attribution (the web app shows it in its footer) and share
derived dictionary data under the same license.

The JLPT lists are © 2020 Jamie Sinclair under the MIT License (`raw/jlpt/LICENSE`, which must
stay with the files). Jonathan Waller's original JLPT lists are shared under
[CC BY](http://www.tanos.co.uk/jlpt/), so the web app credits tanos.co.uk in its footer too.

## Rebuilding the deck

```bash
npm run data:build
```

Reads `raw/*.json` and `raw/jlpt/*.csv` and writes `apps/web/public/data/deck.json`.

Each word gets the JLPT level of the list it is on (`jlpt`). A list entry is matched to a JMdict
word when one of the word's writings and readings is the same as the entry's (notes such as
"(かん)" and "～" are dropped first). A word on more than one list gets the easiest level, so the
JLPT decks never overlap. List entries written only in kana are skipped, because the deck only
has words with kanji. The build prints how many entries of each level were matched.

The app builds its decks from `deck.json`: JLPT N5–N1 from the `jlpt` field, and Common words
from every word with `common: true`.

Matched in the 2026-10-20 build:

| Level | List entries | Kana only (skipped) | Matched | Unmatched | Words tagged |
|---|---|---|---|---|---|
| N5 | 718 | 155 | 531 | 32 | 523 |
| N4 | 668 | 126 | 522 | 20 | 515 |
| N3 | 2140 | 242 | 1829 | 69 | 1762 |
| N2 | 1906 | 298 | 1445 | 163 | 1299 |
| N1 | 2699 | 380 | 2063 | 256 | 2039 |

Unmatched entries are mostly words that aren't in the JMdict common-words file, words whose
reading can't be split across their kanji (e.g. 美味しい), and single-kanji suffixes such as ～日.
"Words tagged" can be lower than "Matched" because several list entries can match the same word,
and a word already in an easier level isn't counted again.
