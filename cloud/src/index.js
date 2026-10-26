// DeckPro Cloud — account + sync backend (Cloudflare Worker + D1).
//
// The desktop app never talks to Google directly. Sign-in is a "device login":
//   1. app registers a random nonce        POST /auth/begin {nonce, device}
//      then opens                          GET /auth/start?nonce=…  in the browser
//   2. Google redirects back to            GET /auth/callback  → session parked under the nonce
//   3. app polls                           POST /auth/poll {nonce} → gets its token once
// Every other route takes  Authorization: Bearer <token>.
//
// Sync is per space (today: one personal space per user):
//   decks    — POST /decks/push, GET /decks/pull?since=<seq>. Each deck has a rev;
//              a push carries the rev it started from. A stale rev is a conflict:
//              the newer edit (by updatedAt) wins and the other version is kept
//              as a "(conflicted copy)" deck, so nothing is lost.
//   settings — GET/POST /settings. The same document the app's iCloud sync uses
//              (sections + palettes, each with its own updatedAt); the server
//              merges per section so two Macs pushing at once can't clobber.
//   main Mac — GET/POST /main. Optional. Each app sends a stable
//              X-DeckPro-Device id. While the main Mac is online (seen in the
//              last MAIN_ONLINE_MS) other Macs' pushes are held; while it's
//              offline they're accepted only with approved:true (the user said
//              so). In a deck conflict the main's version wins and the other is
//              discarded. With no main set, every Mac is equal (as before).

const LOGIN_TTL_MS = 15 * 60 * 1000;
const PULL_LIMIT = 50;
const MAX_ID = 100;
const MAIN_ONLINE_MS = 60 * 1000;
const MAIN_SEEN_EVERY_MS = 15 * 1000;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    try {
      const route = `${req.method} ${url.pathname}`;
      switch (route) {
        case 'GET /':              return text('DeckPro Cloud');
        case 'POST /auth/begin':   return authBegin(req, env);
        case 'GET /auth/start':    return authStart(url, env);
        case 'GET /auth/callback': return authCallback(url, env);
        case 'GET /auth/dev':      return authDev(url, env);
        case 'POST /auth/poll':    return authPoll(req, env);
      }
      const who = await authenticate(req, env);
      if (!who) return json({ ok: false, error: 'Signed out', signedOut: true }, 401);
      switch (route) {
        case 'GET /me':            return me(who, env);
        case 'POST /auth/signout': return signout(who, env);
        case 'GET /settings':      return getSettings(who, env);
        case 'POST /settings':     return pushSettings(req, who, env);
        case 'POST /decks/push':   return pushDecks(req, who, env);
        case 'GET /decks/pull':    return pullDecks(url, who, env);
        case 'GET /main':          return json({ ok: true, main: who.main });
        case 'POST /main':         return setMain(req, who, env);
        case 'POST /main/bye':     return mainBye(who, env);
      }
      return json({ ok: false, error: 'Not found' }, 404);
    } catch (err) {
      return json({ ok: false, error: err.message || String(err) }, 500);
    }
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
function text(body, status = 200) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain' } });
}
function page(title, message, status = 200) {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>body{font:15px/1.5 -apple-system,BlinkMacSystemFont,sans-serif;background:#17191e;color:#e6e9f0;display:grid;place-items:center;min-height:100vh;margin:0}
main{max-width:420px;padding:32px;text-align:center}h1{font-size:20px;margin:0 0 8px}p{color:#8a93a6;margin:0}</style>
<main><h1>${esc(title)}</h1><p>${esc(message)}</p></main>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
const nowIso = () => new Date().toISOString();

function randomToken() {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function sha256(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2, '0')).join('');
}
const validNonce = n => typeof n === 'string' && /^[A-Za-z0-9_-]{32,128}$/.test(n);
const validId = id => typeof id === 'string' && id.length > 0 && id.length <= MAX_ID;

async function readJson(req) {
  try { return await req.json(); } catch { return null; }
}

// ─── Auth ───────────────────────────────────────────────────────────────────

function redirectUri(env, url) {
  return env.PUBLIC_URL ? `${env.PUBLIC_URL}/auth/callback` : `${url.origin}/auth/callback`;
}

// Registered by the app before it opens the browser, so polling can tell
// "not finished yet" apart from "expired" no matter how slowly the page loads.
async function authBegin(req, env) {
  const body = await readJson(req);
  if (!validNonce(body?.nonce)) return json({ ok: false, error: 'Bad nonce' }, 400);
  await env.DB.prepare('INSERT OR REPLACE INTO logins (nonce, device_name, created_at) VALUES (?, ?, ?)')
    .bind(body.nonce, String(body.device || '').slice(0, 80), nowIso()).run();
  return json({ ok: true });
}

async function authStart(url, env) {
  const nonce = url.searchParams.get('nonce');
  if (!validNonce(nonce) || !(await loadLogin(env, nonce))) return page('Sign-in link expired', 'Start signing in again from DeckPro.', 400);
  if (!env.GOOGLE_CLIENT_ID) return page('Google sign-in isn’t set up yet', 'The DeckPro Cloud server is missing its Google client ID.', 503);
  const g = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  g.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  g.searchParams.set('redirect_uri', redirectUri(env, url));
  g.searchParams.set('response_type', 'code');
  g.searchParams.set('scope', 'openid email profile');
  g.searchParams.set('state', nonce);
  g.searchParams.set('prompt', 'select_account');
  return Response.redirect(g.toString(), 302);
}

async function loadLogin(env, nonce) {
  const row = await env.DB.prepare('SELECT * FROM logins WHERE nonce = ?').bind(nonce).first();
  if (!row) return null;
  if (Date.now() - Date.parse(row.created_at) > LOGIN_TTL_MS) {
    await env.DB.prepare('DELETE FROM logins WHERE nonce = ?').bind(nonce).run();
    return null;
  }
  return row;
}

async function authCallback(url, env) {
  const nonce = url.searchParams.get('state');
  if (!validNonce(nonce)) return page('Sign-in failed', 'Start signing in again from DeckPro.', 400);
  const login = await loadLogin(env, nonce);
  if (!login) return page('Sign-in expired', 'Start signing in again from DeckPro.', 400);
  if (url.searchParams.get('error')) {
    await env.DB.prepare('UPDATE logins SET error = ? WHERE nonce = ?').bind('Sign-in was cancelled', nonce).run();
    return page('Sign-in cancelled', 'You can close this tab and try again from DeckPro.');
  }
  const code = url.searchParams.get('code');
  const tokRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri(env, url), grant_type: 'authorization_code',
    }),
  });
  const tok = await tokRes.json().catch(() => ({}));
  if (!tokRes.ok || !tok.id_token) {
    await env.DB.prepare('UPDATE logins SET error = ? WHERE nonce = ?').bind('Google sign-in failed', nonce).run();
    return page('Sign-in failed', 'Google didn’t accept the sign-in. Try again from DeckPro.', 400);
  }
  // The id_token came straight from Google's token endpoint over TLS in exchange
  // for our client secret, so its claims can be trusted without re-verifying the
  // signature (OpenID Connect Core §3.1.3.7). Still check who it was issued for.
  const claims = JSON.parse(atob(tok.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  const issOk = claims.iss === 'https://accounts.google.com' || claims.iss === 'accounts.google.com';
  if (!issOk || claims.aud !== env.GOOGLE_CLIENT_ID || !claims.sub || !claims.email || claims.email_verified === false) {
    await env.DB.prepare('UPDATE logins SET error = ? WHERE nonce = ?').bind('Google sign-in failed', nonce).run();
    return page('Sign-in failed', 'That Google account couldn’t be verified.', 400);
  }
  const res = await finishLogin(env, login, { sub: claims.sub, email: claims.email, name: claims.name || '', picture: claims.picture || '' });
  if (res.error) return page('Can’t sign in', res.error, 403);
  return page('You’re signed in', `DeckPro is now signed in as ${claims.email}. You can close this tab.`);
}

// Local testing only: `wrangler dev` reads DEV_AUTH=1 from .dev.vars, which is
// never deployed. Completes a pending login as any email without Google.
async function authDev(url, env) {
  if (env.DEV_AUTH !== '1') return json({ ok: false, error: 'Not found' }, 404);
  const nonce = url.searchParams.get('nonce');
  const email = url.searchParams.get('email') || 'dev@example.com';
  if (!validNonce(nonce)) return json({ ok: false, error: 'Bad nonce' }, 400);
  let login = await loadLogin(env, nonce);
  if (!login) {
    await env.DB.prepare('INSERT INTO logins (nonce, device_name, created_at) VALUES (?, ?, ?)')
      .bind(nonce, url.searchParams.get('device') || 'dev', nowIso()).run();
    login = await loadLogin(env, nonce);
  }
  const res = await finishLogin(env, login, { sub: 'dev-' + email, email, name: email.split('@')[0], picture: '' });
  return json(res.error ? { ok: false, error: res.error } : { ok: true });
}

async function finishLogin(env, login, g) {
  const allow = (env.ALLOWED_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (allow.length && !allow.includes(g.email.toLowerCase())) {
    await env.DB.prepare('UPDATE logins SET error = ? WHERE nonce = ?').bind('This account isn’t allowed on this DeckPro server', login.nonce).run();
    return { error: `${g.email} isn’t allowed to use this DeckPro server.` };
  }
  let user = await env.DB.prepare('SELECT * FROM users WHERE google_sub = ?').bind(g.sub).first();
  if (!user) {
    const id = crypto.randomUUID(), spaceId = crypto.randomUUID(), ts = nowIso();
    await env.DB.batch([
      env.DB.prepare('INSERT INTO spaces (id, name, seq, created_at) VALUES (?, ?, 0, ?)').bind(spaceId, g.name || g.email, ts),
      env.DB.prepare('INSERT INTO users (id, google_sub, email, name, picture, space_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(id, g.sub, g.email, g.name, g.picture, spaceId, ts),
    ]);
    user = { id, email: g.email, name: g.name, picture: g.picture, space_id: spaceId };
  } else {
    await env.DB.prepare('UPDATE users SET email = ?, name = ?, picture = ? WHERE id = ?').bind(g.email, g.name, g.picture, user.id).run();
  }
  const token = randomToken(), ts = nowIso();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO sessions (token_hash, user_id, device_name, created_at, last_seen) VALUES (?, ?, ?, ?, ?)')
      .bind(await sha256(token), user.id, login.device_name || '', ts, ts),
    env.DB.prepare('UPDATE logins SET token = ? WHERE nonce = ?').bind(token, login.nonce),
  ]);
  return { ok: true };
}

async function authPoll(req, env) {
  const body = await readJson(req);
  const nonce = body?.nonce;
  if (!validNonce(nonce)) return json({ ok: false, error: 'Bad nonce' }, 400);
  const login = await loadLogin(env, nonce);
  if (!login) return json({ ok: false, expired: true, error: 'Sign-in expired' });
  if (login.error) {
    await env.DB.prepare('DELETE FROM logins WHERE nonce = ?').bind(nonce).run();
    return json({ ok: false, error: login.error });
  }
  if (!login.token) return json({ ok: true, pending: true });
  await env.DB.prepare('DELETE FROM logins WHERE nonce = ?').bind(nonce).run();
  const who = await sessionFor(env, login.token);
  return json({ ok: true, token: login.token, user: publicUser(who.user) });
}

async function sessionFor(env, token) {
  const hash = await sha256(token);
  const row = await env.DB.prepare(`
    SELECT s.token_hash, s.last_seen, s.device_name, u.id, u.email, u.name, u.picture, u.space_id
    FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`).bind(hash).first();
  if (!row) return null;
  return { hash, lastSeen: row.last_seen, device: row.device_name,
           user: { id: row.id, email: row.email, name: row.name, picture: row.picture, space_id: row.space_id } };
}

async function authenticate(req, env) {
  const m = (req.headers.get('Authorization') || '').match(/^Bearer (.+)$/);
  if (!m) return null;
  const who = await sessionFor(env, m[1]);
  if (!who) return null;
  if (Date.now() - Date.parse(who.lastSeen) > 5 * 60 * 1000) {
    await env.DB.prepare('UPDATE sessions SET last_seen = ? WHERE token_hash = ?').bind(nowIso(), who.hash).run();
  }
  const dev = req.headers.get('X-DeckPro-Device') || '';
  who.deviceId = validId(dev) ? dev : '';
  await loadMain(env, who);
  return who;
}

// ─── Main Mac ───────────────────────────────────────────────────────────────

// who.main = { set, name, online, isMe } and who.role = 'main' | 'follower' | 'equal'.
// Every request from the main Mac doubles as its heartbeat.
async function loadMain(env, who) {
  const sp = await env.DB.prepare('SELECT main_device_id, main_device_name, main_seen_at FROM spaces WHERE id = ?')
    .bind(who.user.space_id).first();
  const id = sp?.main_device_id || '';
  const isMe = !!id && id === who.deviceId;
  let seen = sp?.main_seen_at ? Date.parse(sp.main_seen_at) : 0;
  if (isMe && Date.now() - seen > MAIN_SEEN_EVERY_MS) {
    seen = Date.now();
    await env.DB.prepare('UPDATE spaces SET main_seen_at = ? WHERE id = ?').bind(new Date(seen).toISOString(), who.user.space_id).run();
  }
  who.main = { set: !!id, name: sp?.main_device_name || '', online: !!id && Date.now() - seen < MAIN_ONLINE_MS, isMe };
  who.role = !id ? 'equal' : isMe ? 'main' : 'follower';
}

// Make this Mac the main ({ main: true }) or clear the main ({ main: false }).
async function setMain(req, who, env) {
  const body = await readJson(req);
  if (body?.main) {
    if (!who.deviceId) return json({ ok: false, error: 'This version of DeckPro can’t be the main Mac — update it first.' }, 400);
    await env.DB.prepare('UPDATE spaces SET main_device_id = ?, main_device_name = ?, main_seen_at = ? WHERE id = ?')
      .bind(who.deviceId, who.device || 'Main Mac', nowIso(), who.user.space_id).run();
  } else {
    await env.DB.prepare('UPDATE spaces SET main_device_id = NULL, main_device_name = \'\', main_seen_at = NULL WHERE id = ?')
      .bind(who.user.space_id).run();
  }
  await loadMain(env, who);
  return json({ ok: true, main: who.main });
}

// The main Mac is quitting: count it offline right away instead of in a minute.
async function mainBye(who, env) {
  if (who.role === 'main') {
    await env.DB.prepare('UPDATE spaces SET main_seen_at = NULL WHERE id = ?').bind(who.user.space_id).run();
  }
  return json({ ok: true });
}

// A follower's push goes through only while the main is offline and the user approved it.
function heldPush(who, body) {
  if (who.role !== 'follower') return null;
  if (who.main.online) return json({ ok: false, held: true, main: who.main, error: `${who.main.name || 'Your main Mac'} is open — this Mac only receives changes.` }, 409);
  if (!body?.approved) return json({ ok: false, held: true, main: who.main, error: 'Waiting for you to push this Mac’s changes.' }, 409);
  return null;
}

const publicUser = u => ({ id: u.id, email: u.email, name: u.name, picture: u.picture });

async function me(who, env) {
  const { results } = await env.DB.prepare('SELECT token_hash, device_name, last_seen, created_at FROM sessions WHERE user_id = ? ORDER BY last_seen DESC')
    .bind(who.user.id).all();
  return json({ ok: true, user: publicUser(who.user),
    devices: results.map(r => ({ name: r.device_name, lastSeen: r.last_seen, signedInAt: r.created_at, current: r.token_hash === who.hash })) });
}

async function signout(who, env) {
  await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(who.hash).run();
  return json({ ok: true });
}

// ─── Settings ───────────────────────────────────────────────────────────────

async function getSettings(who, env) {
  const row = await env.DB.prepare('SELECT doc FROM settings WHERE space_id = ?').bind(who.user.space_id).first();
  return json({ ok: true, doc: row ? JSON.parse(row.doc) : null });
}

// Same rules as the app's mergeSyncDoc: per section, the higher updatedAt wins
// (a tie goes to the incoming copy); palettes merge item by item, where a
// deletion counts at its deletedAt.
function mergeSettings(stored, incoming) {
  if (!stored) return incoming;
  const out = { ...stored, ...incoming, sections: { ...(stored.sections || {}) } };
  const inSecs = incoming.sections || {};
  for (const [name, sec] of Object.entries(inSecs)) {
    if (name === 'palettes') continue;
    const cur = out.sections[name];
    if (!cur || (sec?.updatedAt || 0) >= (cur.updatedAt || 0)) out.sections[name] = sec;
  }
  const items = { ...(stored.sections?.palettes?.items || {}) };
  const itemTs = it => Math.max(it?.updatedAt || 0, it?.deletedAt || 0);
  for (const [id, it] of Object.entries(inSecs.palettes?.items || {})) {
    if (!items[id] || itemTs(it) >= itemTs(items[id])) items[id] = it;
  }
  out.sections.palettes = { items };
  let top = 0;
  for (const [name, sec] of Object.entries(out.sections)) {
    if (name === 'palettes') { for (const it of Object.values(items)) top = Math.max(top, itemTs(it)); }
    else top = Math.max(top, sec?.updatedAt || 0);
  }
  out.updatedAt = top;
  return out;
}

async function pushSettings(req, who, env) {
  const body = await readJson(req);
  if (!body?.doc || typeof body.doc !== 'object') return json({ ok: false, error: 'Missing doc' }, 400);
  const held = heldPush(who, body);
  if (held) return held;
  const row = await env.DB.prepare('SELECT doc FROM settings WHERE space_id = ?').bind(who.user.space_id).first();
  const merged = mergeSettings(row ? JSON.parse(row.doc) : null, body.doc);
  await env.DB.prepare('INSERT INTO settings (space_id, doc, updated_at) VALUES (?, ?, ?) ON CONFLICT(space_id) DO UPDATE SET doc = excluded.doc, updated_at = excluded.updated_at')
    .bind(who.user.space_id, JSON.stringify(merged), nowIso()).run();
  return json({ ok: true, doc: merged });
}

// ─── Decks ──────────────────────────────────────────────────────────────────

async function nextSeq(env, spaceId) {
  const r = await env.DB.prepare('UPDATE spaces SET seq = seq + 1 WHERE id = ? RETURNING seq').bind(spaceId).first();
  return r.seq;
}

function conflictedCopy(deck, newId) {
  const meta = { ...(deck.meta || {}) };
  meta.title = `${meta.title || 'Untitled'} (conflicted copy)`;
  let state = deck.state;
  if (state && typeof state === 'object') {
    state = { ...state, currentDeckId: newId, config: { ...(state.config || {}) } };
    state.config.messageTitle = meta.title;
  }
  return { meta, state };
}

async function writeDeck(env, spaceId, id, { rev, updatedAt, deleted, meta, state, savedBy }, expectRev) {
  const seq = await nextSeq(env, spaceId);
  const args = [rev, seq, updatedAt, deleted ? 1 : 0, JSON.stringify(meta || {}), state == null ? null : JSON.stringify(state), savedBy || ''];
  if (expectRev == null) {
    const r = await env.DB.prepare(`INSERT INTO decks (rev, seq, updated_at, deleted, meta, state, saved_by, space_id, id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(space_id, id) DO NOTHING`).bind(...args, spaceId, id).run();
    return r.meta.changes > 0;
  }
  const r = await env.DB.prepare(`UPDATE decks SET rev = ?, seq = ?, updated_at = ?, deleted = ?, meta = ?, state = ?, saved_by = ?
    WHERE space_id = ? AND id = ? AND rev = ?`).bind(...args, spaceId, id, expectRev).run();
  return r.meta.changes > 0;
}

// JSON with sorted keys, so equal content compares equal regardless of key order.
function canonical(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v ?? null);
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  return `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;
}

const rowToDeck = r => ({
  id: r.id, rev: r.rev, seq: r.seq, updatedAt: r.updated_at, deleted: !!r.deleted,
  meta: JSON.parse(r.meta || '{}'), state: r.state ? JSON.parse(r.state) : null, savedBy: r.saved_by,
});

async function pushOne(env, who, d) {
  const spaceId = who.user.space_id;
  const savedBy = who.device || '';
  const incoming = { updatedAt: String(d.updatedAt || nowIso()), deleted: !!d.deleted, meta: d.meta || {}, state: d.deleted ? null : d.state, savedBy };
  for (let attempt = 0; attempt < 3; attempt++) {
    const cur = await env.DB.prepare('SELECT * FROM decks WHERE space_id = ? AND id = ?').bind(spaceId, d.id).first();
    if (!cur) {
      if (await writeDeck(env, spaceId, d.id, { ...incoming, rev: 1 }, null)) return { id: d.id, rev: 1, winner: 'client' };
      continue;
    }
    const base = Number(d.baseRev || 0);
    if (cur.rev === base) {
      if (await writeDeck(env, spaceId, d.id, { ...incoming, rev: cur.rev + 1 }, cur.rev)) return { id: d.id, rev: cur.rev + 1, winner: 'client' };
      continue;
    }
    // Someone else wrote since this client last synced.
    const server = rowToDeck(cur);
    // Main Mac priority: the main's version wins outright (edits and deletes)
    // and the other version is discarded — no conflicted copy.
    if (who.role === 'main') {
      if (await writeDeck(env, spaceId, d.id, { ...incoming, rev: cur.rev + 1 }, cur.rev)) return { id: d.id, rev: cur.rev + 1, winner: 'client' };
      continue;
    }
    if (who.role === 'follower' && server.savedBy && server.savedBy === who.main.name) {
      return { id: d.id, rev: cur.rev, winner: 'server', server };
    }
    if (incoming.deleted) {
      // A delete never wipes out edits it didn't see; the edited deck survives.
      return { id: d.id, rev: cur.rev, winner: 'server', server };
    }
    if (server.deleted) {
      // Deleted elsewhere but edited here: the edit brings it back.
      if (await writeDeck(env, spaceId, d.id, { ...incoming, rev: cur.rev + 1 }, cur.rev)) return { id: d.id, rev: cur.rev + 1, winner: 'client' };
      continue;
    }
    // Same content both ways (e.g. two Macs made the same change): no copy needed.
    if (canonical(incoming.state) === canonical(server.state) && canonical(incoming.meta) === canonical(server.meta)) {
      const newer = incoming.updatedAt > server.updatedAt ? incoming.updatedAt : server.updatedAt;
      if (await writeDeck(env, spaceId, d.id, { ...incoming, updatedAt: newer, rev: cur.rev + 1 }, cur.rev)) return { id: d.id, rev: cur.rev + 1, winner: 'client' };
      continue;
    }
    const clientNewer = incoming.updatedAt > server.updatedAt;
    const loser = clientNewer ? { meta: server.meta, state: server.state, updatedAt: server.updatedAt }
                              : { meta: incoming.meta, state: incoming.state, updatedAt: incoming.updatedAt };
    const copyId = crypto.randomUUID();
    const copy = conflictedCopy(loser, copyId);
    if (clientNewer) {
      if (!(await writeDeck(env, spaceId, d.id, { ...incoming, rev: cur.rev + 1 }, cur.rev))) continue;
      await writeDeck(env, spaceId, copyId, { rev: 1, updatedAt: loser.updatedAt, deleted: false, ...copy, savedBy: server.savedBy }, null);
      return { id: d.id, rev: cur.rev + 1, winner: 'client', conflictCopyId: copyId };
    }
    await writeDeck(env, spaceId, copyId, { rev: 1, updatedAt: loser.updatedAt, deleted: false, ...copy, savedBy }, null);
    return { id: d.id, rev: cur.rev, winner: 'server', server, conflictCopyId: copyId };
  }
  return { id: d.id, error: 'Busy — try again' };
}

async function pushDecks(req, who, env) {
  const body = await readJson(req);
  const decks = Array.isArray(body?.decks) ? body.decks : null;
  if (!decks) return json({ ok: false, error: 'Missing decks' }, 400);
  const held = heldPush(who, body);
  if (held) return held;
  const results = [];
  for (const d of decks.slice(0, 25)) {
    if (!validId(d?.id)) { results.push({ id: d?.id, error: 'Bad id' }); continue; }
    results.push(await pushOne(env, who, d));
  }
  return json({ ok: true, results });
}

async function pullDecks(url, who, env) {
  const since = Math.max(0, parseInt(url.searchParams.get('since') || '0', 10) || 0);
  const { results } = await env.DB.prepare('SELECT * FROM decks WHERE space_id = ? AND seq > ? ORDER BY seq LIMIT ?')
    .bind(who.user.space_id, since, PULL_LIMIT + 1).all();
  const more = results.length > PULL_LIMIT;
  const rows = results.slice(0, PULL_LIMIT).map(rowToDeck);
  return json({ ok: true, decks: rows, cursor: rows.length ? rows[rows.length - 1].seq : since, more, main: who.main });
}
