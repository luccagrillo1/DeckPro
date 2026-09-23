#!/bin/bash
# Publish the current version as a GitHub release.
# Usage: npm run release                       (public: prompts all users via self-updater)
#        bash scripts/release.sh --prerelease   (beta: not 'latest', no auto-prompt)
set -e
cd "$(dirname "$0")/.."

PRERELEASE_FLAG=""
for arg in "$@"; do
  if [ "$arg" = "--prerelease" ] || [ "$arg" = "--beta" ]; then PRERELEASE_FLAG="--prerelease"; fi
done

# Run release preflight (version sync, changelog, clean tree, artifacts)
node scripts/release-preflight.js || exit 1

VERSION=$(node -p "require('./package.json').version")
TAG="v$VERSION"

if gh release view "$TAG" > /dev/null 2>&1; then
  echo "Release $TAG already exists — bump the version first."
  exit 1
fi

# Release notes = this version's CHANGELOG entry from public/app.js
NOTES=$(node scripts/release-notes.js)

ASSETS=()
for f in "dist/DeckPro-$VERSION-arm64.dmg" "dist/DeckPro-$VERSION-x64.dmg" \
         "dist/DeckPro-$VERSION-arm64.zip" "dist/DeckPro-$VERSION-x64.zip"; do
  [ -f "$f" ] && ASSETS+=("$f")
done

if [ ${#ASSETS[@]} -eq 0 ]; then
  echo "No build artifacts found for $VERSION in dist/ — run npm run build first."
  exit 1
fi

gh release create "$TAG" "${ASSETS[@]}" --title "DeckPro $TAG" --notes "$NOTES" $PRERELEASE_FLAG
echo "Released $TAG with ${#ASSETS[@]} assets.${PRERELEASE_FLAG:+ (prerelease)}"
