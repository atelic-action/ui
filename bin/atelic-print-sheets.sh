#!/usr/bin/env bash
# Print an artifact page to PDF with headless Chrome and report its sheet
# count. The writeup flows across as many letter pages as it needs, its
# collapsibles printed open, so its count is a record of the print and not a
# layout check. The monthly page is one sheet by construction, so pass 1 for
# it and the script fails when it prints as anything else.
#
# Usage: atelic-print-sheets <url | dist/client> <out.pdf> [expected sheets] [page] [port]
#   atelic-print-sheets dist/client public/writeup.pdf
#   atelic-print-sheets dist/client ../2026-10-01-report.pdf 1 /report
#   atelic-print-sheets https://summit.atelic.me/writeup ../2026-09-10-writeup.pdf
# A site offers the same as `bun run print <...>`. Both paths are read from
# the directory the command is run in, which is the site's root.
#
# A directory is served on a local port for the print (the page loads its
# fonts and images by absolute path) and the server is stopped after; the
# page is the path printed from it, /writeup unless named. A URL is printed
# as given. The writeup's PDF belongs in public/ as writeup.pdf beside the
# page (on a private artifact the wall holds it like the page, see
# ACCESS-GATE.md), and a dated copy goes in the client folder of the
# practice repo.
set -euo pipefail

TARGET=${1:?url or built directory required}
OUT=${2:?output pdf path required}
EXPECT=${3:-}
PAGE=${4:-/writeup}
PORT=${5:-8765}
CHROME=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
[[ -x "$CHROME" ]] || { echo "Chrome not found at $CHROME" >&2; exit 1; }
# Chromium refuses to start as root with its sandbox on, and a cloud run is root.
SANDBOX=()
[[ $(id -u) -eq 0 ]] && SANDBOX=(--no-sandbox)

URL="$TARGET"
if [[ -d "$TARGET" ]]; then
	PAGE="/${PAGE#/}"
	PAGE="${PAGE%/}"
	[[ -f "$TARGET$PAGE/index.html" ]] || { echo "no $PAGE/index.html in $TARGET (run bun build first)" >&2; exit 1; }
	if curl -s -o /dev/null "http://127.0.0.1:$PORT/"; then
		echo "port $PORT is already in use" >&2
		exit 1
	fi
	python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$TARGET" >/dev/null 2>&1 &
	SERVER=$!
	trap 'kill $SERVER 2>/dev/null || true' EXIT
	for _ in 1 2 3 4 5 6 7 8 9 10; do
		curl -s -o /dev/null "http://127.0.0.1:$PORT/" && break
		sleep 0.3
	done
	URL="http://127.0.0.1:$PORT$PAGE/"
fi

"$CHROME" --headless=new ${SANDBOX[@]+"${SANDBOX[@]}"} --disable-gpu --no-pdf-header-footer \
	--virtual-time-budget=8000 --print-to-pdf="$OUT" "$URL" 2>/dev/null
[[ -s "$OUT" ]] || { echo "Chrome wrote no PDF for $URL" >&2; exit 1; }

PAGES=$(python3 - "$OUT" <<'PY'
import re, sys
data = open(sys.argv[1], "rb").read()
m = re.findall(rb"/Type\s*/Pages\b[^>]*?/Count\s+(\d+)", data)
print(max(int(x) for x in m) if m else 0)
PY
)
echo "printed $OUT: $PAGES sheets, $(wc -c <"$OUT" | tr -d ' ') bytes"
if [[ -n "$EXPECT" && "$PAGES" != "$EXPECT" ]]; then
	echo "expected $EXPECT sheets; a sheet overflowed or one is missing" >&2
	exit 1
fi
