'use strict';

const express      = require('express');
const fs           = require('fs');
const path         = require('path');
const os           = require('os');
const http         = require('http');
const https        = require('https');
const { execSync } = require('child_process');
const { encode, encodeDeliverPair, listPropsBackups, restorePropsBackup } = require('./encode');
const { extractScheme, listPresentations } = require('./extractScheme');
const library              = require('./library');

const app  = express();
const PORT = process.env.PORT || 3000;

const DEFAULT_DIR = process.env.PRO7_DIR || path.join(os.homedir(), 'Documents', 'ProPresenter');
const DATA_DIR = process.env.DECKPRO_DATA_DIR ||
  path.join(os.homedir(), 'Library', 'Application Support', 'DeckPro');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

library.open();

app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readStateFile() {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && parsed.state ? parsed.state : parsed;
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

function writeStateFile(state) {
  ensureDataDir();
  const tmp = STATE_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify({
    savedAt: new Date().toISOString(),
    state,
  }, null, 2));
  fs.renameSync(tmp, STATE_FILE);
}

function activeLibraryPath(librariesDir, libraryOptions) {
  try {
    const libDataPath = path.join(librariesDir, 'LibraryData');
    if (fs.existsSync(libDataPath)) {
      const str = fs.readFileSync(libDataPath).toString('latin1');
      const match = str.match(/file:\/\/\/([^\x00-\x1f\x7f]+?Libraries\/[^\x00-\x1f\x7f]+?)\//);
      if (match) {
        const decoded = decodeURIComponent('/' + match[1]);
        if (fs.existsSync(decoded)) return decoded;
      }
    }
  } catch (_) {}

  try {
    const sorted = [...libraryOptions].sort((a, b) => {
      const ast = fs.statSync(a.path);
      const bst = fs.statSync(b.path);
      return bst.mtimeMs - ast.mtimeMs;
    });
    return sorted[0]?.path || '';
  } catch (_) {
    return libraryOptions[0]?.path || '';
  }
}

function pro7WorkspaceCandidates() {
  const base = path.join(os.homedir(), 'Library/Application Support/RenewedVision/ProPresenter');
  const out = [];
  const addCandidate = (root, dir) => {
    const librariesDir = path.join(dir, 'Libraries');
    const libraryOptions = fs.existsSync(librariesDir)
      ? fs.readdirSync(librariesDir, { withFileTypes: true })
          .filter(d => d.isDirectory())
          .map(d => ({ name: d.name, path: path.join(librariesDir, d.name), active: false }))
      : [];
    const active = activeLibraryPath(librariesDir, libraryOptions);
    for (const opt of libraryOptions) opt.active = opt.path === active;
    out.push({
      root,
      path: dir,
      exists: fs.existsSync(dir),
      propsConfigExists: fs.existsSync(path.join(dir, 'Configuration/Props')),
      librariesDir,
      libraries: libraryOptions.map(lib => lib.name),
      libraryOptions,
      activeLibrary: active,
    });
  };

  const documentsRoot = path.join(os.homedir(), 'Documents', 'ProPresenter');
  if (fs.existsSync(documentsRoot)) addCandidate('Documents', documentsRoot);

  for (const root of ['UserWorkspaces', 'Workspaces']) {
    const rootDir = path.join(base, root);
    if (!fs.existsSync(rootDir)) {
      out.push({ root, path: rootDir, exists: false, libraries: [] });
      continue;
    }
    const dirs = fs.readdirSync(rootDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name.startsWith('ProPresenter'))
      .map(d => path.join(rootDir, d.name));
    for (const dir of dirs.length ? dirs : [path.join(rootDir, 'ProPresenter')]) {
      addCandidate(root, dir);
    }
  }
  return out;
}

// ── Durable app state ─────────────────────────────────────────────────────

app.get('/api/state', (req, res) => {
  try { res.json({ ok: true, state: readStateFile(), path: STATE_FILE }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post('/api/state', (req, res) => {
  try {
    writeStateFile((req.body || {}).state || {});
    res.json({ ok: true, path: STATE_FILE });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.get('/api/setup/doctor', (req, res) => {
  try {
    ensureDataDir();
    const libStatus = library.getStatus();

    // Validate the saved pro7RootFolder from state (if any)
    let savedFolderStatus = null;
    try {
      const state = readStateFile();
      const savedRoot = state?.config?.pro7RootFolder || '';
      if (savedRoot) {
        const folderExists    = fs.existsSync(savedRoot);
        const propsConfigPath = path.join(savedRoot, 'Configuration/Props');
        const propsExists     = folderExists && fs.existsSync(propsConfigPath);
        savedFolderStatus = {
          path:        savedRoot,
          exists:      folderExists,
          propsExists,
          ready:       folderExists && propsExists,
          reason:      !folderExists ? 'Folder not found' :
                       !propsExists ? 'Missing Configuration/Props' : null,
        };
      }
    } catch (_) {}

    res.json({
      ok: true,
      deckpro: {
        dataDir: DATA_DIR,
        stateFile: STATE_FILE,
        stateFileExists: fs.existsSync(STATE_FILE),
        libraryDir: libStatus.libraryDir,
      },
      pro7: {
        candidates: pro7WorkspaceCandidates(),
        savedFolderStatus,
      },
    });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ── Deck Library ──────────────────────────────────────────────────────────

app.get('/api/library/status', (req, res) => {
  try { res.json(library.getStatus()); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post('/api/library/migrate', (req, res) => {
  try { res.json(library.importLegacy(req.body || {})); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post('/api/library/location', (req, res) => {
  try {
    const { folder, reset } = req.body || {};
    if (reset) return res.json(library.resetLocation());
    if (!folder) return res.status(400).json({ ok: false, error: 'Missing folder' });
    res.json(library.setLocation(folder));
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.get('/api/decks', (req, res) => {
  try { res.json({ ok: true, decks: library.listDecks() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.get('/api/decks/:id', (req, res) => {
  try {
    const deck = library.getDeck(req.params.id);
    if (!deck) return res.status(404).json({ ok: false, error: 'Deck not found' });
    res.json({ ok: true, deck });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.put('/api/decks/:id', (req, res) => {
  try {
    const result = library.saveDeck({ id: req.params.id, ...(req.body || {}) });
    if (result.conflict) return res.status(409).json({ ok: false, ...result });
    res.json(result);
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post('/api/decks/:id/info', (req, res) => {
  try { res.json(library.updateDeckInfo(req.params.id, req.body || {})); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post('/api/decks/:id/opened', (req, res) => {
  try { library.touchOpened(req.params.id); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post('/api/decks/:id/status', (req, res) => {
  try { res.json(library.setStatus(req.params.id, (req.body || {}).status)); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post('/api/decks/:id/template', (req, res) => {
  try { res.json(library.setTemplate(req.params.id, (req.body || {}).isTemplate)); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post('/api/decks/:id/duplicate', (req, res) => {
  try { res.json(library.duplicateDeck(req.params.id, (req.body || {}).newId)); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.delete('/api/decks/:id', (req, res) => {
  try {
    if (req.query.hard === '1') return res.json(library.hardDelete(req.params.id));
    res.json(library.setStatus(req.params.id, 'deleted'));
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.get('/api/history', (req, res) => {
  try {
    res.json({ ok: true, history: library.listGenerations({
      deckId: req.query.deckId || undefined,
      limit:  parseInt(req.query.limit) || 30,
    }) });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post('/api/history', (req, res) => {
  try { res.json(library.recordGeneration(req.body || {})); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ── Browse folder (macOS only) ────────────────────────────────────────────

app.get('/api/browse-folder', (req, res) => {
  try {
    const chosen = execSync(
      `osascript -e 'POSIX path of (choose folder with prompt "Select output folder")'`
    ).toString().trim();
    res.json({ ok: true, folder: chosen });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// ── Auto-scheme: derive a style scheme from a Pro7 presentation ─────────────
// Workflow: DeckPro exports a presentation, the user restyles it in Pro7, then
// imports it here so the edits become a scheme. See extractScheme.js.

app.get('/api/scheme/presentations', async (req, res) => {
  try {
    res.json({ ok: true, presentations: await listPresentations() });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

app.get('/api/scheme/browse', (req, res) => {
  try {
    const chosen = execSync(
      `osascript -e 'POSIX path of (choose file with prompt "Select a ProPresenter (.pro) presentation" of type {"pro"})'`,
      { timeout: 120000 }
    ).toString().trim();
    res.json({ ok: true, path: chosen });
  } catch (err) {
    // osascript exits non-zero when the user cancels — report cleanly
    res.json({ ok: false, error: 'cancelled' });
  }
});

app.post('/api/scheme/extract', async (req, res) => {
  try {
    const { path: filePath } = req.body;
    if (!filePath) return res.status(400).json({ ok: false, error: 'Missing path' });
    res.json(await extractScheme(filePath));
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

app.post('/api/reveal', (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ ok: false, error: 'Missing filePath' });
    execSync(`open -R "${filePath.replace(/"/g, '\\"')}"`, { timeout: 5000 });
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

function pro7IsRunning() {
  try {
    return execSync('pgrep -x ProPresenter', { timeout: 2000 }).toString().trim().length > 0;
  } catch (_) {
    return false; // pgrep exits 1 when no match
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Gracefully quit Pro7 and wait until the process is fully gone (so it flushes its config). */
async function quitPro7AndWait(timeoutMs = 20000) {
  if (!pro7IsRunning()) return true;
  try { execSync(`osascript -e 'tell application "ProPresenter" to quit'`, { timeout: 5000 }); }
  catch (_) { /* may already be quitting */ }
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(400);
    if (!pro7IsRunning()) return true;
  }
  return !pro7IsRunning();
}

/** Relaunch Pro7 (fire and forget). */
function launchPro7() {
  try { execSync(`open -a ProPresenter`, { timeout: 5000 }); return true; }
  catch (_) { return false; }
}

app.get('/api/pro7/process', (req, res) => {
  res.json({ running: pro7IsRunning() });
});

// ── Pro7 config backups (safety net for the Props patch) ──────────────────
app.get('/api/pro7/backups', (req, res) => {
  try { res.json({ ok: true, backups: listPropsBackups() }); }
  catch (err) { res.json({ ok: false, error: err.message }); }
});

app.post('/api/pro7/restore', async (req, res) => {
  try {
    const { file, autoManage } = req.body || {};
    if (!file) return res.status(400).json({ ok: false, error: 'Missing backup file' });
    const wasRunning = pro7IsRunning();
    let relaunched = false;
    if (wasRunning) {
      if (!autoManage) return res.json({ ok: false, pro7Running: true });
      const quit = await quitPro7AndWait();
      if (!quit) return res.json({ ok: false, error: 'Could not close ProPresenter — close it manually and retry.' });
    }
    restorePropsBackup(file);
    if (wasRunning && autoManage) relaunched = launchPro7();
    res.json({ ok: true, relaunched });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Pro7 Network API proxy ────────────────────────────────────────────────

function pro7Fetch(pro7Port, password, urlPath) {
  return new Promise((resolve, reject) => {
    const auth = password ? Buffer.from(`:${password}`).toString('base64') : null;
    const options = {
      hostname: '127.0.0.1',
      port: pro7Port,
      path: urlPath,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DeckPro/2.0',
        'Connection': 'close',
        ...(auth ? { 'Authorization': `Basic ${auth}` } : {}),
      },
      timeout: 3000,
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
    req.end();
  });
}

app.get('/api/pro7/status', async (req, res) => {
  const port     = parseInt(req.query.port) || 1025;
  const password = req.query.password || '';
  try {
    const r = await pro7Fetch(port, password, '/version');
    res.json({ ok: true, connected: r.status === 200, data: r.body });
  } catch (err) {
    res.json({ ok: false, connected: false, error: err.message });
  }
});

app.get('/api/pro7/macros', async (req, res) => {
  const port     = parseInt(req.query.port) || 1025;
  const password = req.query.password || '';
  try {
    const r = await pro7Fetch(port, password, '/v1/macros');
    if (r.status !== 200) return res.json({ ok: false, error: `Pro7 returned ${r.status}` });
    res.json({ ok: true, macros: r.body });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

app.get('/api/pro7/stage-layouts', async (req, res) => {
  const port     = parseInt(req.query.port) || 1025;
  const password = req.query.password || '';
  try {
    const r = await pro7Fetch(port, password, '/v1/stage/layouts');
    if (r.status !== 200) return res.json({ ok: false, error: `Pro7 returned ${r.status}` });
    res.json({ ok: true, layouts: r.body });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

app.get('/api/pro7/props', async (req, res) => {
  const port     = parseInt(req.query.port) || 1025;
  const password = req.query.password || '';
  try {
    const r = await pro7Fetch(port, password, '/v1/props');
    if (r.status !== 200) return res.json({ ok: false, error: `Pro7 returned ${r.status}` });
    res.json({ ok: true, props: r.body });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// ── System font scanner ───────────────────────────────────────────────────

let _fontCache    = null;
let _fontMapCache = null;

app.get('/api/fonts', (req, res) => {
  if (_fontCache && !req.query.refresh) return res.json({ ok: true, fonts: _fontCache, fontMap: _fontMapCache, cached: true });
  try {
    const raw  = execSync('system_profiler SPFontsDataType -json', { timeout: 20000, maxBuffer: 20 * 1024 * 1024 }).toString();
    const data = JSON.parse(raw);
    const fontMap = {};  // family → [{ style, postscript }]
    const fontSet = new Set();
    for (const entry of (data?.SPFontsDataType || [])) {
      for (const tf of (entry.typefaces || [])) {
        const ps     = tf._name;          // PostScript name
        const family = tf.family || ps;
        const style  = tf.style  || 'Regular';
        if (!ps) continue;
        fontSet.add(ps);
        if (!fontMap[family]) fontMap[family] = [];
        fontMap[family].push({ style, postscript: ps });
      }
    }
    // Deduplicate and sort styles within each family
    for (const fam of Object.keys(fontMap)) {
      const seen = new Set();
      fontMap[fam] = fontMap[fam]
        .filter(({ postscript }) => seen.has(postscript) ? false : seen.add(postscript))
        .sort((a, b) => a.style.localeCompare(b.style));
    }
    _fontCache    = [...fontSet].sort((a, b) => a.localeCompare(b));
    _fontMapCache = fontMap;
    res.json({ ok: true, fonts: _fontCache, fontMap: _fontMapCache });
  } catch (err) {
    res.json({ ok: false, error: err.message, fonts: [], fontMap: {} });
  }
});

// ── API.Bible proxy ───────────────────────────────────────────────────────

function bibleFetch(apiKey, urlPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'rest.api.bible',
      port: 443,
      path: urlPath,
      method: 'GET',
      headers: { 'api-key': apiKey, 'Accept': 'application/json' },
      timeout: 8000,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
    req.end();
  });
}

app.get('/api/bible/bibles', async (req, res) => {
  const apiKey = req.query.apiKey || '';
  if (!apiKey) return res.json({ ok: false, error: 'No API key' });
  try {
    const r = await bibleFetch(apiKey, '/v1/bibles?language=eng&include-full-details=false');
    if (r.status !== 200) return res.json({ ok: false, error: `API.Bible returned ${r.status}` });
    const bibles = (r.body.data || []).map(b => ({
      id:                b.id,
      name:              b.name,
      nameLocal:         b.nameLocal,
      abbreviation:      b.abbreviation,
      abbreviationLocal: b.abbreviationLocal,
    }));
    res.json({ ok: true, bibles });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Map common book names → OSIS IDs
const BOOK_MAP = {
  'genesis':'GEN','exodus':'EXO','leviticus':'LEV','numbers':'NUM','deuteronomy':'DEU',
  'joshua':'JOS','judges':'JDG','ruth':'RUT','1 samuel':'1SA','2 samuel':'2SA',
  '1 kings':'1KI','2 kings':'2KI','1 chronicles':'1CH','2 chronicles':'2CH',
  'ezra':'EZR','nehemiah':'NEH','esther':'EST','job':'JOB','psalms':'PSA','psalm':'PSA',
  'proverbs':'PRO','ecclesiastes':'ECC','song of solomon':'SNG','song of songs':'SNG',
  'isaiah':'ISA','jeremiah':'JER','lamentations':'LAM','ezekiel':'EZK','daniel':'DAN',
  'hosea':'HOS','joel':'JOL','amos':'AMO','obadiah':'OBA','jonah':'JON','micah':'MIC',
  'nahum':'NAM','habakkuk':'HAB','zephaniah':'ZEP','haggai':'HAG','zechariah':'ZEC',
  'malachi':'MAL','matthew':'MAT','mark':'MRK','luke':'LUK','john':'JHN','acts':'ACT',
  'romans':'ROM','1 corinthians':'1CO','2 corinthians':'2CO','galatians':'GAL',
  'ephesians':'EPH','philippians':'PHP','colossians':'COL','1 thessalonians':'1TH',
  '2 thessalonians':'2TH','1 timothy':'1TI','2 timothy':'2TI','titus':'TIT',
  'philemon':'PHM','hebrews':'HEB','james':'JAS','1 peter':'1PE','2 peter':'2PE',
  '1 john':'1JN','2 john':'2JN','3 john':'3JN','jude':'JUD','revelation':'REV',
};

function refToOsis(ref) {
  // e.g. "John 3:16", "1 Corinthians 13:4-7", "Psalm 23"
  const m = ref.trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i);
  if (!m) return null;
  const [, book, chap, startV, endV] = m;
  const osis = BOOK_MAP[book.toLowerCase().trim()];
  if (!osis) return null;
  if (!startV) return `${osis}.${chap}`;
  const start = `${osis}.${chap}.${startV}`;
  const end   = endV ? `${osis}.${chap}.${endV}` : start;
  return start === end ? start : `${start}-${end}`;
}

app.get('/api/bible/search', async (req, res) => {
  const { apiKey, bibleId, ref } = req.query;
  const verseNumbers = req.query.verseNumbers === '1' || req.query.verseNumbers === 'true';
  if (!apiKey || !bibleId || !ref) return res.json({ ok: false, error: 'Missing params' });

  const passageId = refToOsis(ref);
  if (!passageId) return res.json({ ok: false, error: `Couldn't parse reference: "${ref}". Try "John 3:16" format.` });

  try {
    // Request HTML, not text — HTML carries poetry structure (<p class="q1">/<p class="q2"> per line),
    // which lets us preserve hard line breaks. Plain-text mode flattens poetry into one paragraph.
    // When verse numbers are wanted, ask the API to include them so we can mark verse boundaries.
    const vn = verseNumbers ? 'true' : 'false';
    const qs = `content-type=html&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=${vn}&include-verse-spans=false`;
    const urlPath = `/v1/bibles/${encodeURIComponent(bibleId)}/passages/${encodeURIComponent(passageId)}?${qs}`;
    const r = await bibleFetch(apiKey, urlPath);
    if (r.status !== 200) return res.json({ ok: false, error: `API.Bible returned ${r.status}: ${JSON.stringify(r.body).slice(0, 300)}` });

    const raw  = r.body.data?.content || '';
    const text = htmlPassageToText(raw, verseNumbers);
    const reference = r.body.data?.reference || ref;

    if (!text) return res.json({ ok: false, error: 'No text returned for that passage' });
    res.json({ ok: true, text, reference });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

/**
 * Convert an API.Bible passage HTML fragment to plain text, preserving hard line
 * breaks. Each block (<p>, including poetry lines <p class="q1/q2">) and each <br>
 * becomes a newline; runs of horizontal whitespace collapse but newlines are kept.
 */
function htmlPassageToText(html, markVerses = false) {
  let s = String(html || '');
  if (markVerses) {
    // API.Bible wraps verse numbers in <span ... class="v">N</span>. Convert each
    // to a sentinel N so the client can split text into verse-number spans.
    s = s.replace(/<span[^>]*class="[^"]*\bv\b[^"]*"[^>]*>\s*([\d–-]+)\s*<\/span>/gi,
      (_, num) => `${num}`);
  }
  return s
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '\n')  // block ends → newline
    .replace(/<br\s*\/?>/gi, '\n')                          // explicit breaks → newline
    .replace(/<[^>]+>/g, '')                                // strip remaining tags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/[ \t\f\v]+/g, ' ')      // collapse horizontal whitespace only
    .replace(/ *\n */g, '\n')          // trim spaces around newlines
    .replace(/\n{3,}/g, '\n\n')        // cap consecutive blank lines
    .trim();
}

// ── Google Drive PDF proxy ────────────────────────────────────────────────

function parseGdriveId(url) {
  // Google Docs: /document/d/{ID}/
  let m = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return { id: m[1], type: 'doc' };
  // Drive file: /file/d/{ID}/ or /d/{ID}/
  m = url.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]+)/);
  if (m) return { id: m[1], type: 'file' };
  // open?id= or export?id=
  m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return { id: m[1], type: 'file' };
  return null;
}

function resolveRedirect(currentUrl, location) {
  try { return new URL(location, currentUrl).toString(); }
  catch (_) { return location; }
}

function isHttpsUrl(url) {
  try { return new URL(url).protocol === 'https:'; }
  catch (_) { return false; }
}

function googleHtmlExportError(html, finalUrl = '') {
  const sample = String(html || '').slice(0, 200000);
  const lower = sample.toLowerCase();
  if (/accounts\.google\.com|servicelogin/i.test(finalUrl) || /<title>\s*sign in/i.test(sample)) {
    return 'Google is asking DeckPro to sign in. Share the doc as "Anyone with the link can view", then try again.';
  }
  if (lower.includes('you need access') || lower.includes('request access') ||
      lower.includes('access denied') || lower.includes('not authorized') ||
      lower.includes('permission denied')) {
    return 'Google did not allow DeckPro to export that doc. Share it as "Anyone with the link can view", then try again.';
  }
  return null;
}

app.get('/api/gdrive-pdf', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ ok: false, error: 'Missing url' });

  const parsed = parseGdriveId(url);
  if (!parsed) return res.status(400).json({ ok: false, error: 'Could not parse a Google Drive file ID from that URL' });

  const fetchUrl = parsed.type === 'doc'
    ? `https://docs.google.com/document/d/${parsed.id}/export?format=pdf`
    : `https://drive.google.com/uc?export=download&id=${parsed.id}`;

  try {
    await new Promise((resolve, reject) => {
      let settled = false;
      const fail = (err) => {
        if (settled) return;
        settled = true;
        reject(err instanceof Error ? err : new Error(String(err)));
      };
      const done = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      const doRequest = (targetUrl, redirectCount = 0) => {
        try {
          if (redirectCount > 5) return fail(new Error('Too many redirects'));
          const absoluteUrl = new URL(targetUrl).toString();
          const mod = isHttpsUrl(absoluteUrl) ? https : http;
          const req2 = mod.get(absoluteUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 15000,
          }, (r) => {
            try {
              if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
                r.resume();
                doRequest(resolveRedirect(absoluteUrl, r.headers.location), redirectCount + 1);
                return;
              }
              if (r.statusCode !== 200) {
                r.resume();
                return fail(new Error(`Google returned ${r.statusCode} — make sure the file is shared "Anyone with the link"`));
              }
              const ct = r.headers['content-type'] || '';
              if (!ct.includes('pdf')) {
                r.resume();
                return fail(new Error('The link did not return a PDF. Make sure the file is shared "Anyone with the link" and is a Google Doc or PDF.'));
              }
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', 'inline; filename="notes.pdf"');
              r.pipe(res);
              r.on('end', done);
              r.on('error', fail);
            } catch (err) {
              r.resume();
              fail(err);
            }
          });
          req2.on('timeout', () => { req2.destroy(); fail(new Error('Request timed out')); });
          req2.on('error', fail);
        } catch (err) {
          fail(err);
        }
      };
      doRequest(fetchUrl);
    });
  } catch (err) {
    if (!res.headersSent) res.status(502).json({ ok: false, error: err.message });
  }
});

// ── Google Doc → HTML intake (rich Smart Notes) ───────────────────────────
// Returns the doc as structured HTML so the client can render it in DeckPro's
// own DOM and scan/suggest/drag/link. PDFs stay on the iframe viewer.
app.get('/api/gdrive-html', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ ok: false, error: 'Missing url' });

  const parsed = parseGdriveId(url);
  if (!parsed) return res.status(400).json({ ok: false, error: 'Could not parse a Google Drive file ID from that URL' });
  if (parsed.type !== 'doc') {
    return res.json({ ok: false, error: 'Rich notes need a Google Doc (a /document/d/… link). Other files still load as a PDF.' });
  }

  const fetchUrl = `https://docs.google.com/document/d/${parsed.id}/export?format=html`;
  try {
    const html = await new Promise((resolve, reject) => {
      let settled = false;
      const fail = (err) => {
        if (settled) return;
        settled = true;
        reject(err instanceof Error ? err : new Error(String(err)));
      };
      const done = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const doRequest = (targetUrl, redirectCount = 0) => {
        try {
          if (redirectCount > 5) return fail(new Error('Too many redirects'));
          const absoluteUrl = new URL(targetUrl).toString();
          const mod = isHttpsUrl(absoluteUrl) ? https : http;
          const r2 = mod.get(absoluteUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }, (r) => {
            try {
              if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
                r.resume();
                doRequest(resolveRedirect(absoluteUrl, r.headers.location), redirectCount + 1);
                return;
              }
              if (r.statusCode !== 200) {
                r.resume();
                return fail(new Error(`Google returned ${r.statusCode} — make sure the doc is shared "Anyone with the link"`));
              }
              const ct = r.headers['content-type'] || '';
              if (!ct.includes('html')) {
                r.resume();
                return fail(new Error('That link did not return a Google Doc. Share it "Anyone with the link" and use the /document/d/… URL.'));
              }
              let buf = '';
              r.setEncoding('utf8');
              r.on('data', d => {
                buf += d;
                if (buf.length > 8 * 1024 * 1024) {
                  fail(new Error('Doc too large (over 8 MB)'));
                  r.destroy();
                }
              });
              r.on('end', () => {
                try {
                  const exportError = googleHtmlExportError(buf, absoluteUrl);
                  if (exportError) return fail(new Error(exportError));
                  done(buf);
                } catch (err) {
                  fail(err);
                }
              });
              r.on('error', fail);
            } catch (err) {
              r.resume();
              fail(err);
            }
          });
          r2.on('timeout', () => { r2.destroy(); fail(new Error('Request timed out')); });
          r2.on('error', fail);
        } catch (err) {
          fail(err);
        }
      };
      doRequest(fetchUrl);
    });
    res.json({ ok: true, html, id: parsed.id });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

// ── Self-update via GitHub Releases ───────────────────────────────────────

const pkg = require('./package.json');
const fsu = require('fs');

function repoSlug() {
  const r = pkg.repository || '';
  const m = String(r.url || r).match(/github(?:\.com)?[:/]+([^/]+\/[^/.]+)/);
  return m ? m[1] : null;
}

function cmpVer(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
}

function httpsGetJson(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Too many redirects'));
    const req = https.get(url, {
      headers: { 'User-Agent': 'DeckPro', 'Accept': 'application/vnd.github+json' },
      timeout: 10000,
    }, (r) => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        r.resume();
        return resolve(httpsGetJson(r.headers.location, redirects + 1));
      }
      let data = '';
      r.on('data', c => data += c);
      r.on('end', () => {
        if (r.statusCode !== 200) return reject(new Error(`GitHub returned ${r.statusCode}`));
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
  });
}

function downloadFile(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Too many redirects'));
    const req = https.get(url, { headers: { 'User-Agent': 'DeckPro' }, timeout: 120000 }, (r) => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        r.resume();
        return resolve(downloadFile(r.headers.location, dest, redirects + 1));
      }
      if (r.statusCode !== 200) { r.resume(); return reject(new Error(`Download failed: ${r.statusCode}`)); }
      const out = fsu.createWriteStream(dest);
      r.pipe(out);
      out.on('finish', () => out.close(resolve));
      out.on('error', reject);
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Download timed out')); });
    req.on('error', reject);
  });
}

async function fetchLatestRelease() {
  const slug = repoSlug();
  if (!slug) throw new Error('No repository configured');
  const rel    = await httpsGetJson(`https://api.github.com/repos/${slug}/releases/latest`);
  const latest = (rel.tag_name || '').replace(/^v/, '');
  const arch   = process.arch === 'arm64' ? 'arm64' : 'x64';
  const asset  = (rel.assets || []).find(a => a.name.includes(`-${arch}`) && a.name.endsWith('.zip'));
  return { rel, latest, asset };
}

app.get('/api/update/check', async (req, res) => {
  try {
    const { rel, latest, asset } = await fetchLatestRelease();
    res.json({
      ok: true,
      current: pkg.version,
      latest,
      updateAvailable: cmpVer(latest, pkg.version) > 0 && !!asset,
      notes: rel.body || '',
      assetBytes: asset?.size || 0,
    });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

app.post('/api/update/install', async (req, res) => {
  try {
    const { latest, asset } = await fetchLatestRelease();
    if (cmpVer(latest, pkg.version) <= 0 || !asset) {
      return res.json({ ok: false, error: 'Already up to date' });
    }

    const zipPath   = `/tmp/deckpro-update-${latest}.zip`;
    const unzipDir  = `/tmp/deckpro-update-${latest}`;
    await downloadFile(asset.browser_download_url, zipPath);

    execSync(`rm -rf "${unzipDir}" && mkdir -p "${unzipDir}" && ditto -xk "${zipPath}" "${unzipDir}"`, { timeout: 60000 });
    if (!fsu.existsSync(`${unzipDir}/DeckPro.app`)) {
      throw new Error('Update package did not contain DeckPro.app');
    }

    // Save current version so rollback can report it
    fsu.writeFileSync('/tmp/deckpro-prev-version', pkg.version, 'utf8');

    // Swap the app bundle after this process exits, then relaunch
    const swapScript = `/tmp/deckpro-update-swap.sh`;
    fsu.writeFileSync(swapScript, `#!/bin/bash
sleep 1.5
cp -R /Applications/DeckPro.app /Applications/DeckPro_prev.app
rm -rf /Applications/DeckPro.app
cp -R "${unzipDir}/DeckPro.app" /Applications/
"/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister" -f /Applications/DeckPro.app
rm -rf "${unzipDir}" "${zipPath}"
open -n /Applications/DeckPro.app --args --updated
`, { mode: 0o755 });

    const { spawn } = require('child_process');
    spawn('/bin/bash', [swapScript], { detached: true, stdio: 'ignore' }).unref();

    res.json({ ok: true, installing: latest });

    // Quit so the swap can proceed (only when running inside Electron)
    setTimeout(() => {
      try { require('electron').app.quit(); } catch (_) { /* standalone server — user restarts manually */ }
    }, 800);
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

app.get('/api/update/rollback-info', (req, res) => {
  const hasPrev = fsu.existsSync('/Applications/DeckPro_prev.app');
  const prevVersion = hasPrev && fsu.existsSync('/tmp/deckpro-prev-version')
    ? fsu.readFileSync('/tmp/deckpro-prev-version', 'utf8').trim()
    : null;
  res.json({ ok: true, available: hasPrev, prevVersion });
});

app.post('/api/update/rollback', (req, res) => {
  try {
    if (!fsu.existsSync('/Applications/DeckPro_prev.app')) {
      return res.json({ ok: false, error: 'No backup to roll back to' });
    }
    const prevVersion = fsu.existsSync('/tmp/deckpro-prev-version')
      ? fsu.readFileSync('/tmp/deckpro-prev-version', 'utf8').trim()
      : 'previous version';

    const rollbackScript = `/tmp/deckpro-rollback.sh`;
    fsu.writeFileSync(rollbackScript, `#!/bin/bash
sleep 1.5
rm -rf /Applications/DeckPro.app
cp -R /Applications/DeckPro_prev.app /Applications/DeckPro.app
rm -rf /Applications/DeckPro_prev.app
rm -f /tmp/deckpro-prev-version
"/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister" -f /Applications/DeckPro.app
open -n /Applications/DeckPro.app
`, { mode: 0o755 });

    const { spawn } = require('child_process');
    spawn('/bin/bash', [rollbackScript], { detached: true, stdio: 'ignore' }).unref();

    res.json({ ok: true, rollingBackTo: prevVersion });

    setTimeout(() => {
      try { require('electron').app.quit(); } catch (_) {}
    }, 800);
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// ── iCloud portable-settings sync ─────────────────────────────────────────
const ICLOUD_ROOT = path.join(os.homedir(), 'Library', 'Mobile Documents', 'com~apple~CloudDocs');
const SYNC_DIR    = path.join(ICLOUD_ROOT, 'DeckPro');
const SYNC_FILE   = path.join(SYNC_DIR, 'sync.json');
const SYNC_BAK    = path.join(SYNC_DIR, 'sync.backup.json');

app.get('/api/sync/status', (req, res) => {
  res.json({
    ok: true,
    available: fsu.existsSync(ICLOUD_ROOT),
    fileExists: fsu.existsSync(SYNC_FILE),
    path: SYNC_FILE,
    hostname: os.hostname().replace(/\.local$/, ''),
  });
});

app.get('/api/sync/pull', (req, res) => {
  if (!fsu.existsSync(ICLOUD_ROOT)) return res.json({ ok: true, available: false, doc: null });
  if (!fsu.existsSync(SYNC_FILE))   return res.json({ ok: true, available: true, doc: null });
  try {
    const raw = fsu.readFileSync(SYNC_FILE, 'utf8');
    const doc = JSON.parse(raw);
    res.json({ ok: true, available: true, doc });
  } catch (err) {
    // Corrupt / half-written — set it aside and report empty so the app can recover
    try {
      const corrupt = path.join(SYNC_DIR, `sync.corrupt-${Date.now()}.json`);
      fsu.copyFileSync(SYNC_FILE, corrupt);
    } catch (_) {}
    res.json({ ok: true, available: true, doc: null, warning: 'sync.json was corrupt and has been set aside' });
  }
});

app.post('/api/sync/push', (req, res) => {
  const { doc } = req.body || {};
  if (!doc || typeof doc !== 'object') return res.status(400).json({ ok: false, error: 'Missing doc' });
  if (!fsu.existsSync(ICLOUD_ROOT))    return res.json({ ok: false, available: false, error: 'iCloud Drive not available' });
  try {
    fsu.mkdirSync(SYNC_DIR, { recursive: true });
    // Back up the existing good copy before overwriting
    if (fsu.existsSync(SYNC_FILE)) {
      try { fsu.copyFileSync(SYNC_FILE, SYNC_BAK); } catch (_) {}
    }
    // Atomic write: temp file then rename
    const tmp = path.join(SYNC_DIR, `.sync-${process.pid}-${Date.now()}.tmp`);
    fsu.writeFileSync(tmp, JSON.stringify(doc, null, 2), 'utf8');
    fsu.renameSync(tmp, SYNC_FILE);
    res.json({ ok: true, available: true });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// ── Generate presentation ─────────────────────────────────────────────────

app.post('/api/generate', async (req, res) => {
  try {
    const { spec, fileName, pairSpec, pairFileName } = req.body;
    if (!spec || !fileName) return res.status(400).json({ ok: false, error: 'Missing spec or fileName' });

    const safe = fileName.replace(/[^a-zA-Z0-9_\-. ]/g, '_');
    spec.name  = safe;

    if (spec.downloadMode) {
      const result = await encode(spec);
      return res.json({ ok: true, ...result });
    }

    // Paired delivery — two presentations (e.g. no-QR/QR) sharing one prop
    // collection. Only supported alongside deliverMode (the live-library path);
    // auto-manage Pro7 quits/relaunches once, wrapping both writes.
    if (pairSpec && pairFileName) {
      if (!spec.deliverMode) return res.status(400).json({ ok: false, error: 'Paired export requires deliverMode' });
      const safePair = pairFileName.replace(/[^a-zA-Z0-9_\-. ]/g, '_');
      pairSpec.name = safePair;

      let pro7WasRunning = false;
      let pro7Relaunched = false;
      if (spec.autoManagePro7 === true && pro7IsRunning()) {
        pro7WasRunning = true;
        const quit = await quitPro7AndWait();
        if (!quit) {
          return res.status(409).json({ ok: false, error: 'Could not close ProPresenter — close it manually and retry.' });
        }
      }

      const result = await encodeDeliverPair(spec, pairSpec);
      if (pro7WasRunning) pro7Relaunched = launchPro7();

      return res.json({
        ok: true,
        delivered: !!result.delivered,
        presentations: result.presentations,
        propsBackup: result.propsBackup || null,
        propsInstalled: result.propsInstalled !== false,
        propsError: result.propsError || null,
        pro7Relaunched,
      });
    }

    // Auto-manage ProPresenter: if it's running and the deck patches the live
    // Props config, quit it (so it flushes), patch, then relaunch.
    const patchesConfig = !!spec.deliverMode;
    let pro7WasRunning = false;
    let pro7Relaunched = false;
    if (patchesConfig && spec.autoManagePro7 === true && pro7IsRunning()) {
      pro7WasRunning = true;
      const quit = await quitPro7AndWait();
      if (!quit) {
        return res.status(409).json({ ok: false, error: 'Could not close ProPresenter — close it manually and retry.' });
      }
    }

    const outputFolder = spec.outputFolder || DEFAULT_DIR;
    const outputPath   = path.join(outputFolder, `${safe}.pro`);
    const result       = await encode(spec, outputPath);

    if (pro7WasRunning) pro7Relaunched = launchPro7();

    res.json({
      ok: true,
      delivered: !!result.delivered,
      presentationPath: result.presentationPath || outputPath,
      presentationBytes: result.presentationBytes,
      props: result.props,
      propsBackup: result.propsBackup || null,
      propsInstalled: result.propsInstalled !== false,
      propsError: result.propsError || null,
      pro7Relaunched,
    });
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use('/api', (err, req, res, next) => {
  console.error('API error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({
    ok: false,
    error: err?.message || 'DeckPro hit an internal error while handling that request.',
  });
});

app.use('/api', (req, res) => {
  res.status(404).json({
    ok: false,
    error: `DeckPro's local server does not recognize ${req.originalUrl}. Use File > Redeploy once, then try again.`,
  });
});

// When run directly (node server.js), start listening immediately.
// When required by Electron's main.js, the caller handles listen.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DeckPro → http://localhost:${PORT}`);
    console.log(`Default output dir: ${DEFAULT_DIR}`);
  });
} else {
  // Expose pure helpers for tests without changing the app export shape.
  app.htmlPassageToText = htmlPassageToText;
  module.exports = app;
}
