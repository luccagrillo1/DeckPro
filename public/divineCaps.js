// Divine-pronoun caps (He/Him/His/Himself) with a "who was named last" check.
//
// Capitalizing every he/him/his also capped pronouns about Paul, Peter, the
// man with leprosy, etc. Now each lowercase pronoun looks back at the most
// recent person named before it: a divine name (God, Jesus, Lord, Father...)
// caps it, a person (Paul, Peter, Moses... or "the man", "a woman") leaves it
// alone. Nobody named yet → capped, as before. It's still a guess — "Jesus
// said to him" points at the man — so the result stays visible and editable.
//
// Better: when the slide has a reference, the server fetches the same verses
// in NKJV (which capitalizes for God) and each pronoun copies the NKJV one it
// lines up with. The name check only covers what that can't settle.
//
// Shared by the app (loaded as a plain script) and divineCaps.test.js.
(function (root) {
  const DIVINE = new Set(['god', 'jesus', 'christ', 'lord', 'father', 'spirit', 'son', 'messiah', 'savior', 'saviour',
    'almighty', 'immanuel', 'emmanuel', 'yahweh', 'jehovah', 'lamb', 'rabbi', 'teacher', 'master', 'creator', 'redeemer']);
  const HUMAN = new Set(['paul', 'saul', 'peter', 'simon', 'cephas', 'john', 'james', 'andrew', 'philip', 'thomas',
    'matthew', 'levi', 'judas', 'jude', 'mark', 'luke', 'barnabas', 'silas', 'timothy', 'titus', 'stephen', 'apollos',
    'philemon', 'onesimus', 'cornelius', 'ananias', 'agrippa', 'festus', 'felix', 'herod', 'pilate', 'caiaphas',
    'barabbas', 'nicodemus', 'lazarus', 'zacchaeus', 'bartimaeus', 'nathanael', 'zechariah', 'joseph', 'moses',
    'aaron', 'abraham', 'abram', 'isaac', 'jacob', 'esau', 'noah', 'adam', 'cain', 'abel', 'lot', 'enoch',
    'david', 'solomon', 'jonathan', 'absalom', 'samuel', 'eli', 'elijah', 'elisha', 'isaiah', 'jeremiah',
    'ezekiel', 'daniel', 'jonah', 'job', 'joshua', 'caleb', 'gideon', 'samson', 'boaz', 'nathan', 'hezekiah', 'josiah',
    'nehemiah', 'ezra', 'mordecai', 'pharaoh', 'nebuchadnezzar', 'goliath', 'jesse', 'balaam', 'laban', 'naaman']);
  const PERSON_NOUNS = new Set(['man', 'woman', 'boy', 'girl', 'child', 'servant', 'king', 'prophet', 'apostle',
    'disciple', 'leper', 'ruler', 'centurion', 'official', 'priest', 'brother', 'father', 'son', 'master', 'husband',
    'fool', 'person', 'one', 'someone', 'anyone', 'everyone', 'whoever']);
  const ARTICLES = new Set(['the', 'a', 'an', 'this', 'that', 'his', 'her', 'their', 'your', 'my', 'any', 'each', 'every']);
  const PRONOUN = /^(he|him|his|himself)$/;

  const WORD = /[A-Za-z]+(?:['’][A-Za-z]+)?/g;

  // Name check: walk the words in order; for every lowercase pronoun, cap it
  // unless the last person named before it was human. Before anyone's named
  // it caps (capUnknown) — except when a reference was there and still
  // couldn't place it, where lowercase is the safer guess. → [{ at, word, cap }]
  function namePlan(text, capUnknown = true) {
    const out = [];
    let who = null; // 'divine' | 'human' | null
    let prev = '';
    let m;
    WORD.lastIndex = 0;
    while ((m = WORD.exec(text))) {
      if (text[m.index - 1] === '-' || text[m.index + m[0].length] === '-') continue; // "God-fearing" names nobody
      const word = m[0].replace(/['’]s$/i, '');
      const low = word.toLowerCase();
      const capd = word[0] !== word[0].toLowerCase();
      if (PRONOUN.test(low)) { if (!capd) out.push({ at: m.index, word: low, cap: who ? who === 'divine' : capUnknown }); }
      else if (capd && DIVINE.has(low)) who = 'divine'; // lowercase lord/god/father is a person or an idol
      else if (capd && HUMAN.has(low)) who = 'human';
      else if (!capd && PERSON_NOUNS.has(low) && ARTICLES.has(prev)) who = 'human';
      prev = low;
    }
    return out;
  }

  // Every he/him/his/himself with where it sits in the passage (0–1). A capital
  // only means God when the word doesn't start a sentence, line or quote — the
  // crowd's "He seems to be…" about Paul is capped just for starting a quote.
  function pronouns(text) {
    const out = [];
    const len = Math.max(1, text.length);
    let m;
    WORD.lastIndex = 0;
    while ((m = WORD.exec(text))) {
      const low = m[0].replace(/['’]s$/i, '').toLowerCase(); // "he's" too, like namePlan
      if (!PRONOUN.test(low)) continue;
      const before = text.slice(0, m.index).replace(/[\s\d]+$/, '');
      const starts = !before || /[.!?;:\n“"‘'(\[]$/.test(before) || /[.!?]["”’']$/.test(before);
      out.push({ at: m.index, word: low, rel: m.index / len, capd: m[0][0] !== low[0], starts });
    }
    return out;
  }

  // Pair the user's pronouns with the reference's, in order. The same count
  // lines up one to one; otherwise each pairs with the nearest one by position
  // (best-scoring in-order alignment), and pairs too far apart don't count.
  function alignPronouns(mine, ref) {
    const MAX = 0.2;
    const score = (a, b) => {
      const d = Math.abs(a.rel - b.rel);
      return d > MAX ? -Infinity : 1 + (a.word === b.word ? 1 : 0) - d * 5;
    };
    const n = mine.length, k = ref.length;
    const best = Array.from({ length: n + 1 }, () => new Array(k + 1).fill(0));
    for (let i = 1; i <= n; i++) for (let j = 1; j <= k; j++) {
      best[i][j] = Math.max(best[i - 1][j], best[i][j - 1], best[i - 1][j - 1] + Math.max(0, score(mine[i - 1], ref[j - 1])));
    }
    const pairs = new Map();
    for (let i = n, j = k; i > 0 && j > 0;) {
      const sc = score(mine[i - 1], ref[j - 1]);
      if (sc > 0 && best[i][j] === best[i - 1][j - 1] + sc) { pairs.set(i - 1, ref[j - 1]); i--; j--; }
      else if (best[i][j] === best[i - 1][j]) i--;
      else j--;
    }
    return pairs;
  }

  // Which lowercase pronouns to cap. With refText (the same passage in a
  // translation that capitalizes for God — NKJV) a paired pronoun copies the
  // reference; anything unpaired, or paired with a sentence-start capital,
  // falls back to the name check.
  function divineCapsPlan(text, refText) {
    const names = namePlan(text, !refText);
    if (!refText || !names.length) return names.filter(p => p.cap).map(p => p.at);
    const all = pronouns(text);
    const ref = pronouns(String(refText));
    const pairs = alignPronouns(all, ref);
    const byAt = new Map(all.map((p, i) => [p.at, [p, pairs.get(i)]]));
    // Left over (the reference words it differently): copy the closest
    // reference pronoun that isn't a sentence-start capital, if one's near.
    const nearest = p => {
      let best = null;
      for (const r of ref) if (!r.starts && Math.abs(r.rel - p.rel) <= 0.15 && (!best || Math.abs(r.rel - p.rel) < Math.abs(best.rel - p.rel))) best = r;
      return best;
    };
    return names.filter(n => {
      const [p, r] = byAt.get(n.at) || [];
      if (!p) return n.cap;
      if (r && !r.starts) return r.capd;
      const near = nearest(p);
      return near ? near.capd : n.cap;
    }).map(n => n.at);
  }

  function divineCapsText(text, refText) {
    if (!text) return text;
    const s = String(text);
    const at = divineCapsPlan(s, refText);
    if (!at.length) return s;
    const chars = s.split('');
    at.forEach(i => { chars[i] = chars[i].toUpperCase(); });
    return chars.join('');
  }

  // How many words a divineCapsText() pass would change.
  function countDivineCaps(text, refText) { return divineCapsPlan(String(text || ''), refText).length; }

  // Spans are read as one passage (so "Paul ... he" across a bold span still
  // counts), then split back into their own spans with every other field kept.
  function divineCapsSpans(spans, refText) {
    return divineCapsBodies([spans || []], refText)[0];
  }

  // A scripture slide's bodies are one passage split across slides.
  function divineCapsBodies(bodies, refText) {
    const lists = (bodies || []).map(b => b || []);
    const capped = divineCapsText(lists.map(l => l.map(s => s.text || '').join('')).join('\n'), refText);
    let pos = 0;
    return lists.map(l => {
      const out = l.map(s => {
        const len = (s.text || '').length;
        const text = capped.slice(pos, pos + len);
        pos += len;
        return { ...s, text };
      });
      pos += 1; // the '\n' between bodies
      return out;
    });
  }

  const api = { divineCapsText, divineCapsSpans, divineCapsBodies, countDivineCaps };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(this);
