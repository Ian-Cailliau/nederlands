# Nederlands · Test 1.2

A Dutch (Flemish, NT2 level A2) study app for one learner, built for her written exam with the book *Zo gezegd 1.2*.
Live at **https://ian-cailliau.github.io/nederlands/** (GitHub Pages from `main`, folder `/`). It is the sibling of the Polish app (`Ian-Cailliau/Polish`): same layout, rounds, levels, scoring, result sheet, cheat sheet, sync and feedback button.

- **Exam:** schriftelijk examen 1.2 on **Thursday 29 October 2026**, chapters **1, 3, 4, 5**, no perfectum. Tasks SD1 (describe 2 people), SD3 (5 rules with moet / mag / geen / niet), SD4 (e-mail about your home with Er-sentences and comparatives), SD5 (describe a room in exactly 6 sentences). The date and scope live in `content/exam.json`.
- **When in doubt, Flemish over Netherlands Dutch** (de gsm, de zetel, het toestel, Proficiat, Allez). Screens use Dutch labels; explanations are in English.

## When photos of book pages arrive
Follow **`docs/ADD-CONTENT.md`** step by step. Content is plain JSON in `content/`; adding words, sentences, rules, reading texts or exam changes never needs code. If something would need code (a new kind of exercise), say so and ask before building it.

## Layout
- `content/ch1.json … ch5.json` – words (and *Dit kan ik!* sentences, reading texts) per chapter · `content/rules.json` – grammar rules + extra lexicon the checker knows · `content/exam.json` – exam date, scope, drills, model texts, people / rooms / places the drills draw.
- `src/app.html` – the whole app (vanilla JS, one file). Content is inlined at build time (`const CONTENT=/*CONTENT*/null;`).
- `src/build.py` – builds the Pages version into the repo root (`index.html`, `manifest.webmanifest`, `sw.js`, icons) and adds gist sync + the feedback button. `src/icon.svg` / `src/icon.png` – the app icon (de / het).
- `src/check_content.py` – schema check of `content/`.
- `src/tests/` – Playwright tests; `sh src/tests/run.sh` runs them all (`fast` skips the slow round play-through).

## Rules that must never break
- **Ids are progress keys.** Never change, reuse or delete an existing `id` (words, sentences, rule ids in `exam.json` places). New ids follow the patterns in `docs/ADD-CONTENT.md`. `src/tests/terms.js` guards this.
- Progress lives in localStorage `nl-test12`, the open round in `nl-test12-round`, sync token / gist in `nl-gh-token` / `nl-gh-gist` (private gist "nederlands-test-1.2 progress", file `nederlands-progress.json`). Never mix with the Polish keys (`pl-…`).
- Do not commit photos of the book or personal details (the repo is public). Put only extracted words and short example sentences in `content/`.
- Look: the "Tegels" palette (ink blue `#233A5E`, ochre `#D9A441`, terracotta pen `#B0502D`, cream paper `#F4EFE5`), Bricolage Grotesque / Source Sans 3 / Caveat. No lions, no black-and-yellow.

## Build, test, deploy
```
python3 src/check_content.py           # content schema
sh src/tests/run.sh                    # build into a temp folder, serve, run all tests
python3 src/build.py                   # build into the repo root
git add -A && git commit && git push   # Pages redeploys from main in about a minute
```
Tests need Node + `playwright-core` (here: `/opt/npm-tools/node_modules`, added to `NODE_PATH` by `run.sh`) and Python with Pillow. After adding content: `sh src/tests/run.sh update` records the new ids in the terms fixture (it refuses if an existing term changed) and runs the fast tests.

Commit messages list what changed; push to `main`. If a push is refused, stop and say so.
