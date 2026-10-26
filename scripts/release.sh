#!/bin/bash
# Publish the current version as a GitHub release.
# Usage: npm run release        (stable: every user is offered it)
#        npm run release:beta   (pre-release: only users on the Beta channel see it;
#                                version must look like 4.41.0-beta.1)
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

# A version like 4.41.0-beta.1 must go out as a pre-release (Beta channel
# only), and a plain version must not — otherwise a beta would reach every
# Stable user, or a stable release would hide from them.
if [[ "$VERSION" == *-* && -z "$PRERELEASE_FLAG" ]]; then
  echo "v$VERSION is a beta version — publish it with: npm run release:beta"; exit 1
fi
if [[ "$VERSION" != *-* && -n "$PRERELEASE_FLAG" ]]; then
  echo "v$VERSION has no -beta suffix — bump to e.g. $VERSION-beta.1 for a beta, or use: npm run release"; exit 1
fi

if gh release view "$TAG" > /dev/null 2>&1; then
  echo "Release $TAG already exists — bump the version first."
  exit 1
fi

# Release notes = this version's CHANGELOG entry from public/app.js
NOTES=$(node scripts/release-notes.js)

# Upload under names that say which Mac each file is for. The .zip files are
# what DeckPro's built-in updater downloads: it picks the one whose name has
# "-arm64" / "-x64" and ends in .zip (see assetOf in server.js), so those
# markers must stay in the zip names or installed copies stop finding updates.
STAGE="dist/release-$VERSION"
rm -rf "$STAGE" && mkdir -p "$STAGE"
ASSETS=()
stage() { [ -f "$1" ] && cp "$1" "$STAGE/$2" && ASSETS+=("$STAGE/$2"); return 0; }
stage "dist/DeckPro-$VERSION-arm64.dmg" "DeckPro-$VERSION-Apple-Silicon.dmg"
stage "dist/DeckPro-$VERSION-x64.dmg"   "DeckPro-$VERSION-Intel.dmg"
stage "dist/DeckPro-$VERSION-arm64.zip" "DeckPro-$VERSION-auto-update-arm64.zip"
stage "dist/DeckPro-$VERSION-x64.zip"   "DeckPro-$VERSION-auto-update-x64.zip"

if [ ${#ASSETS[@]} -eq 0 ]; then
  echo "No build artifacts found for $VERSION in dist/ — run npm run build first."
  exit 1
fi

gh release create "$TAG" "${ASSETS[@]}" --title "DeckPro $TAG" --notes "$NOTES" $PRERELEASE_FLAG
echo "Released $TAG with ${#ASSETS[@]} assets.${PRERELEASE_FLAG:+ (prerelease)}"
