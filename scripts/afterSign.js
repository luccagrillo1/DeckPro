// electron-builder afterSign hook. electron-builder's own ad-hoc-signature
// fallback only fires for arm64/universal builds (app-builder-lib hardcodes
// `fallBackToAdhoc = arch === Arch.arm64 || arch === Arch.universal`) — an x64
// build with no real Developer ID cert comes out of packaging completely
// unsigned. The auto-updater's codesign --verify gate then rejects it on
// every user's machine, with no error until someone actually tries to update.
// Ad-hoc-sign unconditionally here; re-signing the already-ad-hoc-signed
// arm64 build is a harmless no-op.
const { execFileSync } = require('child_process');
const path = require('path');

module.exports = async function afterSign(context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${appName}.app`);
  // mac.icon is the Icon Composer DeckPro.icon (Assets.car, used on macOS 26+).
  // The icon.icns electron-builder derives from it for older macOS stops at
  // 256px, so swap in the full 16–1024px set before signing.
  const fs = require('fs');
  const fullIcns = path.join(context.packager.projectDir, 'public', 'assets', 'DeckPro.icns');
  const bundled = path.join(appPath, 'Contents', 'Resources', 'icon.icns');
  if (fs.existsSync(fullIcns) && fs.existsSync(bundled)) fs.copyFileSync(fullIcns, bundled);
  console.log(`[afterSign] ad-hoc signing ${appPath}`);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' });
};
