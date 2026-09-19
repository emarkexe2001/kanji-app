# Dictionary data

`raw/` holds the source dictionaries used to build the study deck. The `.zip` files are
the originals; the `.json` files inside are unzipped copies (regenerate them by unzipping).

| File | Source |
|---|---|
| `jmdict-eng-common-3.6.2+20260914172325.json.zip` | https://github.com/scriptin/jmdict-simplified/releases/tag/3.6.2%2B20260914172325 |
| `kanjidic2-en-3.6.2+20260914172325.json.zip` | same release |

Both are JSON conversions (by scriptin/jmdict-simplified) of the
[EDRDG](https://www.edrdg.org/) JMdict and KANJIDIC2 files.

## License

JMdict and KANJIDIC2 are © the Electronic Dictionary Research and Development Group and are
distributed under [CC BY-SA 4.0](https://www.edrdg.org/edrdg/licence.html). Any app or data file
derived from them must keep this attribution (the web app shows it in its footer) and share
derived dictionary data under the same license.

## Rebuilding the deck

```bash
npm run data:build
```

Reads `raw/*.json` and writes `apps/web/public/data/deck.json`.
