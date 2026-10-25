#!/bin/sh
# Check the content, build into a temporary folder, serve it, run every test.
# Usage: sh src/tests/run.sh          all tests (the 14-round play-through takes a few minutes)
#        sh src/tests/run.sh fast     skip the round play-through
#        sh src/tests/run.sh update   after adding content: record the NEW term ids in terms-fixture.json
#                                     (refused if an existing term changed), then run the fast tests
# Needs Python 3 with Pillow, Node and playwright-core (CHROME=path/to/chromium if Playwright cannot find one).
set -u
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=$(mktemp -d)
PORT=${PORT:-8765}
export NODE_PATH="${NODE_PATH:+$NODE_PATH:}/opt/npm-tools/node_modules"
python3 "$HERE/../check_content.py" || exit 1
python3 "$HERE/../build.py" "$OUT" || exit 1
python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$OUT" >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null; rm -rf "$OUT"' EXIT
sleep 1
FAIL=0
if [ "${1:-}" = "update" ]; then echo "== terms update"; node "$HERE/terms.js" "$PORT" update || exit 1; fi
for t in checker items scoring terms progress; do
  echo "== $t"; OUTP=$(node "$HERE/$t.js" "$PORT" 2>&1); ST=$?
  echo "$OUTP" | grep -v '^✓ .* → '; [ $ST = 0 ] || FAIL=1
done
for t in feedback feedback-round; do echo "== $t"; PORT=$PORT node "$HERE/$t.js" || FAIL=1; done
if [ "${1:-}" = "" ]; then echo "== rounds"; OUTP=$(node "$HERE/rounds.js" "$PORT" 2>&1); ST=$?; echo "$OUTP" | tail -8; [ $ST = 0 ] || FAIL=1; fi
[ $FAIL = 0 ] && echo "ALL TESTS PASS" || { echo "SOME TESTS FAIL"; exit 1; }
