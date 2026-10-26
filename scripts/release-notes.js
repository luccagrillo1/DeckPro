// Prints GitHub release notes for the current version: its CHANGELOG entry
// from public/app.js as markdown bullets. Evaluates the real array literal so
// quotes/apostrophes come out unescaped (a regex over the source leaked \" and \').
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
const start = src.indexOf('[', src.indexOf('const CHANGELOG = ['));
let depth = 0, i = start, quote = null;
for (; i < src.length; i++) {
  const c = src[i];
  if (quote) {
    if (c === '\\') { i++; continue; }
    if (c === quote) quote = null;
    continue;
  }
  if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
  if (c === '[') depth++;
  else if (c === ']' && --depth === 0) break;
}
const changelog = Function(`return ${src.slice(start, i + 1)}`)();

const version = require('../package.json').version;
const entry = changelog.find(e => e.version === version);
const changes = entry ? entry.changes.map(c => `- ${c}`).join('\n') : 'See in-app changelog.';
// File names match what scripts/release.sh uploads. A table, not bullets:
// the in-app update banner shows the first few bullet lines of these notes
// (formatUpdateNotes), and those should be the changes, not the download guide.
const downloads = [
  '### Which file do I download?',
  '| Your Mac | Download |',
  '|---|---|',
  `| **Apple Silicon** (M1, M2, M3, M4…) | **DeckPro-${version}-Apple-Silicon.dmg** |`,
  `| **Intel** | **DeckPro-${version}-Intel.dmg** |`,
  '',
  'Not sure? Apple menu → About This Mac: "Chip: Apple M…" means Apple Silicon, "Processor: … Intel" means Intel. The **auto-update .zip** files are for DeckPro\'s built-in updater — you don\'t need them.',
].join('\n');
console.log(`${downloads}\n\n### What's new\n${changes}`);
