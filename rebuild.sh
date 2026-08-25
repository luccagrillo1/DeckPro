#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

LOG="/tmp/deckpro-rebuild.log"
echo "=== DeckPro Rebuild $(date) ===" > "$LOG"

# ── 1. Clear dist/ so electron-builder does a completely fresh pack ───────────
echo "STEP:1:Clearing build cache"
rm -rf dist/ >> "$LOG" 2>&1

# ── 2. Build — capture all output to log ──────────────────────────────────────
echo "STEP:2:Building app"
/usr/local/bin/npm run build >> "$LOG" 2>&1
BUILD_EXIT=$?

if [ $BUILD_EXIT -ne 0 ]; then
  echo "FAIL:Build failed — check /tmp/deckpro-rebuild.log"
  exit 1
fi

# ── 3. Replace the app bundle ─────────────────────────────────────────────────
echo "STEP:3:Installing to Applications"
rm -rf /Applications/DeckPro.app >> "$LOG" 2>&1
cp -R dist/mac-arm64/DeckPro.app /Applications/ >> "$LOG" 2>&1

# ── 4. Flush macOS Launch Services cache ──────────────────────────────────────
echo "STEP:4:Refreshing system cache"
LSREG="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"
"$LSREG" -f /Applications/DeckPro.app >> "$LOG" 2>&1

# ── 4b. Stop any legacy standalone dev server on 3000 ─────────────────────────
# Newer app builds use their own private port, but an old server can still be
# left behind from the double-click launcher and confuse manual browser tests.
if lsof -ti tcp:3000 >> "$LOG" 2>&1; then
  lsof -ti tcp:3000 | xargs kill -9 >> "$LOG" 2>&1 || true
fi

# ── 5. Launch new instance ────────────────────────────────────────────────────
echo "STEP:5:Relaunching"
open -n /Applications/DeckPro.app --args --rebuilt >> "$LOG" 2>&1

echo "DONE"
