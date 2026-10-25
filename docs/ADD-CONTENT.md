# Adding content from photos

The learner sends photos of *Zo gezegd 1.2* pages (green *Ondersteunende kennis* pages, word lists, *Dit kan ik!* checklists, reading texts, the teacher's exam sheets), maybe with a line like "add these". Do the whole thing yourself, then reply with a short report. No questions unless something is unreadable or needs code.

## 1. Read every photo
- Identify the chapter (the coloured tab / page header: *1 Wie is wie?*, *3 Wat moet ik doen?*, *4 Hoe ziet het appartement eruit?*, *5 Mijn favoriete kamer* …) and what kind of page it is.
- Skip what is already in `content/`: match on the **Dutch** word or sentence (`grep -i '"nl": "de zetel"' content/*.json`), never on the English.
- Keep a list of anything you cannot read with certainty; it goes in the report, not in the content.
- Never commit the photos (the repo is public).

## 2. Put it in the right file

| On the page | Goes to | Shape |
| --- | --- | --- |
| words (word lists, pictures with labels) | `content/ch<N>.json` → `words` | see below |
| *Dit kan ik!* sentences, useful sentences | `content/ch<N>.json` → `sentences` | `{"id": "h5-s-er-staat-een-zetel", "nl": "Er staat een zetel in de woonkamer.", "en": "There is a sofa in the living room.", "alt": ["…other accepted wording…"], "new": "<date>"}` |
| reading texts and their questions | `content/ch<N>.json` → `reading` | `{"id": "h4-r-yumi", "nl": "De e-mail van Yumi", "en": "…", "text": "…full text…", "questions": [{"q": "Hoeveel slaapkamers …?", "a": "Twee.", "en": "…"}], "new": "<date>"}` (shown in Spiekbriefje → Leesteksten) |
| grammar (green *Ondersteunende kennis*) | `content/rules.json` → `rules` | `{"id": "short-slug", "ch": N, "t": "Dutch title", "en": "English title", "x": "the rule in plain English, with examples", "ex": ["short", "examples"]}` (Spiekbriefje → Grammatica) |
| words the checker should know but that are not for learning | `content/rules.json` → `lexicon` | nouns `{"nl": "de tas", "en": "bag", "pl": "tassen"}`, adjectives `{"nl": "lief", "en": "sweet", "eForm": "lieve"}`, verbs `{"inf": "uitzetten", "en": "to switch off", "sep": "zet … uit"}` |
| exam sheet: date, chapters, tasks | `content/exam.json` | `date`, `scope`, `noPerfectum`, `product`, `drills` (keep the drill ids sd1, sd3, sd4, sd5) |
| new signs / rules for SD3 | `content/exam.json` → `places[].rules` | `{"id": "klas-6", "kind": "moet|mag|geen|niet", "nl": "Je moet …", "en": "You have to …", "icon": "📵"}` |
| new furniture for SD5 pictures | `content/exam.json` → `rooms[].items` | copy an existing item; `draw` must be one of the drawn types already used there |

A new chapter (e.g. chapter 2) is a new file `content/ch2.json`: `{"ch": 2, "title": "…", "en": "…", "words": [], "sentences": [], "reading": []}`. It appears in the app as its own topic automatically.

### Word fields
`id, ch, nl, en, pos` always. `pos` is `noun | verb | adj | adv | prep | other`.
- **noun:** `"art": "de"|"het"`, `"word"` (without article), `"nl"` = article + word, `"pl"` (plural without de; leave out if there is none). Add `"er": ["liggen"]` (or `staan`, `hangen`) for things in a room (a rug lies, a painting hangs, a cupboard stands).
- **verb:** `"nl"` = the infinitive. Separable: `"sep": "steek … over"`. Irregular present: `"irr": ["ga", "gaat", "gaat", "gaan", "ga"]` (ik, jij, hij, wij, jij after the verb). Regular verbs need nothing: the app makes ik / jij / hij / wij itself.
- **adj:** `"cat": "colour|pattern|size|material|shape"` when it is one of those; `"noE": true` if it never takes -e (houten, glazen, plastic, effen, oranje …; -en adjectives are detected anyway); `"eForm"` only if the -e form is irregular; `"comp"` only for an irregular comparative; `"attr": false` if it is never used before a noun (verboden, inbegrepen).
- **Flemish first:** when the book gives two words, or when in doubt, use the Flemish one as `nl` (de gsm, de zetel, het toestel) and add the other as a second word only if the book teaches it.
- English: short, the most common meaning first, alternatives after a comma (`"en": "sofa, couch"`).
- If the word is already in `content/rules.json` → `lexicon` (words the checker knew but you didn't study yet), remove it there; `check_content.py` flags this.
- A new **colour** or **material** adjective: also add its colour to `content/exam.json` → `colours` (or `materials`) as a hex value, so the drawn pictures can use it.

### Ids (progress keys: never change, reuse or delete one)
- nouns `h<N>-<art>-<word>` (`h5-de-zetel`, `h1-het-t-shirt`), other words `h<N>-<word>` (`h3-oversteken`), lowercase, spaces → `-`, keep accents out (`e` for `é`).
- sentences `h<N>-s-<3-5 word slug>`, reading texts `h<N>-r-<slug>`, SD3 rules `<place>-<next number>`.
- If an id is already taken by a different word, add `-2`.

### Mark what is new
Give every added word, sentence and reading text `"new": "<today, YYYY-MM-DD>"`. For two weeks the app shows it with a **nieuw** tag and puts it first in its stage of the learning order.

## 3. Check, build, test
```
python3 src/check_content.py      # fix everything it lists
sh src/tests/run.sh update        # records the new ids in the terms fixture, then runs the fast tests
python3 src/build.py              # rebuild the live files in the repo root
```
- `run.sh update` refuses if an existing term's prompt or accepted answers changed: that means an edit to existing content changed what is asked. Undo it unless the learner asked for it (then `node src/tests/terms.js PORT write` re-records, and say so in the report).
- If `checker.js` or `items.js` fails on a new word, the word is probably missing a field (`pl`, `art`, `sep`, `irr`, `noE`). Fix the content, not the tests.
- If the page needs something the app cannot show (a new kind of exercise), add the content that fits, leave the rest, and ask before writing code.

## 4. Commit and push
```
git add -A
git commit -m "Add H5 p. 82: 6 words, 3 Dit kan ik! sentences" -m "<list per chapter>"
git push origin main
```
Pages redeploys in about a minute; the phone gets it on the next start (the app is network-first). Progress is untouched because ids did not change.

## 5. Reply
A short list, no more:
- what was added per chapter (counts + a few examples),
- anything unreadable or uncertain to check (with the photo name),
- anything skipped and why,
- the live link: https://ian-cailliau.github.io/nederlands/
