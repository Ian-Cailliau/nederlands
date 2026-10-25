# Source

- `app.html` – the whole app (single file, no framework). Content is inlined by `build.py` at `const CONTENT=/*CONTENT*/null;`, so open the built `index.html`, not this file.
- `build.py` – builds the GitHub Pages version into the repo root: `python3 src/build.py` (or `python3 src/build.py /some/out/dir`). Inlines `content/*.json`, adds the iPhone / PWA head, service worker, icons (from `icon.png`), gist sync and the feedback button. Needs Pillow.
- `check_content.py` – schema check of `content/` (fields, id patterns, duplicates, dates).
- `icon.svg` / `icon.png` – the app icon: “de” and “het” on ink blue.

## Inside app.html (top to bottom)
- **Grammar layer:** `nounOf`, `adjOf` (+e with the spelling rules: `eForm`, never -e: `neverE`, comparatives: `compOf`), `verbOf` (present tense, separable verbs, `IRR` and `irr` from content), `FORMS` (every form → word), `spellWhy` (long vowel written once, consonant doubling, s/z, f/v, ei/ij, au/ou), `nearest` (spelling suggestion).
- **Checker:** `checkSentence` reads one sentence (noun phrases, de/het, adjective -e, subject–verb agreement, verb in 2nd place, Er + verb number and staan / liggen / hangen, moet / mag + infinitive at the end, geen / niet, omdat / want, comparatives, capitals, full stop) and returns issues and tips; `checkText` checks a whole text against a drill (`SPEC`: sentence count, what is still missing via `NEED`, the e-mail frame via `letterParts`); `markSentence` shows the corrections in the sentence.
- **Terms:** every exercise is a term with a stable id: words (`h1-het-hemd`: Vertaling / Betekenis), *Dit kan ik!* sentences, `lw:` Lidwoord, `mv:` Meervoud, `aj:` Adjectief, `ez:` Er-zin, `rg:` Regels. `STAGES` and `ORDER` set the learning path (exam needs first, new content first in its stage).
- **Rounds and scoring** (as in the Polish app): levels 0–6 with gaps `GAP`, piles new / fix / review, a level drops only after 3 wrong written answers in a row, slips (hyphen, accent, hint) and multiple choice never lower a level, concept cards (`BLOCKS`) shown once.
- **Screens:** `home`, `ask` / `finish` (result sheet: closest correct answer with the missing part in green, You said, Why, Volgende, small actions), `sheet` (Spiekbriefje), `settingsView`, `examView` (pictures drawn from `exam.json`: `personSVG`, `roomSVG`, `signSVG`; a picture comes from a seed so it survives a reload; model answers `personModel`, `roomModel`).
- **Voice:** Web Speech, nl-BE preferred (iPhone “Ellen”), any nl voice otherwise.

## Tests (`tests/`)
`sh src/tests/run.sh` checks the content, builds into a temp folder, serves it and runs everything (`fast` skips the round play-through, `update` records new term ids first).
- `checker.js` – wrong exam sentences for every rule and the exact message each must get; right sentences that must get none; whole texts; every generated model answer is clean.
- `items.js` – every term in every way it is asked: its own answer is right, garbage is wrong, options contain the answer, nouns need their article, all words are in the decks, every mode is used.
- `rounds.js` – plays 14 rounds and checks the six round rules.
- `scoring.js` – slips and multiple choice never lower a level; 3 wrong in a row; the article counts.
- `terms.js` – term ids, learning order, prompts and accepted answers unchanged against `terms-fixture.json` (`update` adds new ids only, `write` re-records).
- `progress.js` – saved progress and an open round load unchanged.
- `feedback.js`, `feedback-round.js` – the feedback button against a fake GitHub API.

Progress: localStorage `nl-test12` (term id → state), open round `nl-test12-round`, exam drafts `nl-test12-ex`, sync `nl-gh-token` / `nl-gh-gist`.
