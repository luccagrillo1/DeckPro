'use strict';
// End-to-end test: drives the real DeckPro UI in Electron's Chromium against a
// throwaway server, then decodes what Export wrote and checks it.
//
//   npm run e2e                 fresh data, builds a deck from scratch
//   npm run e2e -- --real-data  also runs against a copy of this Mac's DeckPro data
//   npm run e2e -- --keep       leave the temp folder for inspection
//   npm run e2e -- --show       show the window while it runs
//
// Safe by construction: its own data folder, a fake ProPresenter folder in
// /tmp, and DECKPRO_E2E=1 so the server never sees, quits or relaunches the
// real ProPresenter. A copy of the real Configuration/Props (if present) is
// used so prop patching is exercised against real data.

const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');

const ROOT = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);
const flag = f => args.includes(f);
const PORT = 3400 + Math.floor(Math.random() * 400);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deckpro-e2e-'));
const dataDir = path.join(tmp, 'data');
const pro7Root = path.join(tmp, 'ProPresenter');
const libDir = path.join(pro7Root, 'Libraries', 'DeckPro E2E');
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(libDir, { recursive: true });
fs.mkdirSync(path.join(pro7Root, 'Configuration'), { recursive: true });
const realWs = path.join(os.homedir(), 'Library/Application Support/RenewedVision/ProPresenter/UserWorkspaces/ProPresenter');
const realProps = path.join(realWs, 'Configuration', 'Props');
const haveProps = fs.existsSync(realProps);
if (haveProps) fs.copyFileSync(realProps, path.join(pro7Root, 'Configuration', 'Props'));

if (flag('--real-data')) {
  const real = path.join(os.homedir(), 'Library/Application Support/DeckPro');
  if (fs.existsSync(path.join(real, 'state.json'))) {
    const st = JSON.parse(fs.readFileSync(path.join(real, 'state.json'), 'utf8'));
    const s = st.state || st;
    Object.assign(s.config = s.config || {}, {
      autoManagePro7: false, icloudSync: false, pro7RootFolder: pro7Root, pro7LibraryFolder: libDir,
    });
    fs.writeFileSync(path.join(dataDir, 'state.json'), JSON.stringify(st));
    if (fs.existsSync(path.join(real, 'library'))) fs.cpSync(path.join(real, 'library'), path.join(dataDir, 'library'), { recursive: true });
  }
}

let server;
const log = (...a) => console.log(...a);
const wait = ms => new Promise(r => setTimeout(r, ms));

function startServer() {
  server = spawn('node', ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), DECKPRO_DATA_DIR: dataDir, PRO7_DIR: pro7Root, DECKPRO_E2E: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stderr.on('data', d => { const t = String(d).trim(); if (t) log('  [server]', t.slice(0, 300)); });
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 20000;
    const poll = () => http.get(`http://localhost:${PORT}/api/state`, r => { r.resume(); resolve(); })
      .on('error', () => Date.now() > deadline ? reject(new Error('server did not start')) : setTimeout(poll, 250));
    poll();
  });
}

async function checkExport(result) {
  const out = [];
  const ok = (name, pass, detail = '') => out.push({ name, ok: !!pass, detail });
  const { decodePresentationBuffer } = require(path.join(ROOT, 'encode.js'));
  const files = fs.readdirSync(libDir).filter(f => f.endsWith('.pro'));
  ok('export: presentation written to the library', files.length > 0, files.join(', '));
  if (result.expectSat) ok('export: paired QR export wrote the _SAT file too', files.some(f => /_SAT\.pro$/.test(f)), files.join(', '));
  if (!files.length) return out;
  const newest = files.filter(f => !/_SAT\.pro$/.test(f)).map(f => ({ f, t: fs.statSync(path.join(libDir, f)).mtimeMs })).sort((a, b) => b.t - a.t)[0].f;
  const pres = await decodePresentationBuffer(fs.readFileSync(path.join(libDir, newest)));
  const cues = pres.cues || [];
  // A cue's visible name is on its slide action (cue.name is usually empty).
  const labels = cues.map(c => [c.name, ...(c.actions || []).map(a => a.label?.text || a.name)].filter(Boolean).join(' / '));
  ok('export: has cues', cues.length >= (result.minCues || 1), `${cues.length} cues`);
  for (const want of result.expectLabels || []) {
    ok(`export: cue "${want}" present`, labels.some(l => l.includes(want)), labels.slice(0, 40).join(' | '));
  }
  // Every text element's RTF must decode, and the typed verse must be in there.
  const texts = [];
  for (const c of cues) for (const a of c.actions || []) {
    for (const el of a.slide?.presentation?.baseSlide?.elements || []) {
      const rtf = el.element?.text?.rtfData;
      if (rtf) texts.push(Buffer.from(rtf, typeof rtf === 'string' ? 'base64' : undefined).toString('latin1'));
    }
  }
  for (const want of result.expectText || []) {
    const plain = texts.join('\n').replace(/\\[a-z]+-?\d* ?/g, '').replace(/[{}]/g, '');
    ok(`export: text "${want.slice(0, 30)}" in a slide`, plain.includes(want), '');
  }
  if (haveProps) {
    const props = fs.readFileSync(path.join(pro7Root, 'Configuration', 'Props'));
    const orig = fs.readFileSync(realProps);
    ok('export: Configuration/Props was patched (copy)', !props.equals(orig), `${orig.length} → ${props.length} bytes`);
    for (const want of result.expectProps || []) ok(`export: prop "${want}" in Props`, props.includes(Buffer.from(want)), '');
    ok('export: real Configuration/Props untouched', fs.readFileSync(realProps).equals(orig), '');
  }
  return out;
}

async function main() {
  await startServer();
  const win = new BrowserWindow({
    show: flag('--show'), width: 1600, height: 1000,
    webPreferences: { backgroundThrottling: false },
  });
  const pageErrors = [];
  win.webContents.on('console-message', (...a) => {
    const e = a[0] && typeof a[0] === 'object' && 'message' in a[0] ? a[0] : { level: a[1], message: a[2] };
    const lvl = e.level;
    if ((lvl === 3 || lvl === 'error') && !/ERR_CONNECTION_REFUSED|favicon|Failed to load resource/.test(e.message)) pageErrors.push(e.message);
  });
  await win.loadURL(`http://localhost:${PORT}/`);
  await wait(1500);

  const suite = fs.readFileSync(path.join(__dirname, 'suite.js'), 'utf8');
  // Bible lookup uses this Mac's saved api.bible key, if there is one.
  let bibleKey = null, bibleId = null;
  try {
    const real = JSON.parse(fs.readFileSync(path.join(os.homedir(), 'Library/Application Support/DeckPro/state.json'), 'utf8'));
    const cfg = (real.state || real).config || {};
    bibleKey = cfg.bibleApiKey || null; bibleId = cfg.bibleId || null;
  } catch (_) {}
  const opts = { pro7Root, libDir, realData: flag('--real-data'), bibleKey, bibleId };
  let results = [];
  let exportExpect = null;
  try {
    const r = await win.webContents.executeJavaScript(`(${suite})(${JSON.stringify(opts)})`);
    results = r.results;
    exportExpect = r.exportExpect;
  } catch (e) {
    results.push({ name: 'suite crashed', ok: false, detail: String(e.message || e) });
  }
  if (exportExpect) results.push(...await checkExport(exportExpect));

  // Persistence: reload the page and make sure the deck came back from the server.
  if (exportExpect?.slideCount) {
    await win.loadURL(`http://localhost:${PORT}/`);
    await wait(1500);
    const n = await win.webContents.executeJavaScript('state.slides.length');
    results.push({ name: 'persistence: deck survives a reload', ok: n === exportExpect.slideCount, detail: `${n} vs ${exportExpect.slideCount}` });
  }
  results.push({ name: 'no console errors', ok: pageErrors.length === 0, detail: pageErrors.slice(0, 5).join(' || ') });

  const failed = results.filter(r => !r.ok);
  log('');
  for (const r of results) log(`${r.ok ? '  ✓' : '  ✗'} ${r.name}${r.detail && !r.ok ? `  — ${r.detail}` : ''}`);
  log(`\n${results.length - failed.length}/${results.length} passed${flag('--keep') ? `  (temp: ${tmp})` : ''}`);
  return failed.length ? 1 : 0;
}

app.whenReady().then(async () => {
  let code = 1;
  try { code = await main(); } catch (e) { console.error('E2E harness error:', e); }
  try { server?.kill(); } catch (_) {}
  if (!flag('--keep')) fs.rmSync(tmp, { recursive: true, force: true });
  app.exit(code);
});
app.on('window-all-closed', () => {});
