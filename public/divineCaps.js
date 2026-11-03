// Divine-pronoun caps (He/Him/His/Himself) with a "who was named last" check.
//
// Capitalizing every he/him/his also capped pronouns about Paul, Peter, the
// man with leprosy, etc. Now each lowercase pronoun looks back at the most
// recent person named before it: a divine name (God, Jesus, Lord, Father...)
// caps it, a person (Paul, Peter, Moses... or "the man", "a woman") leaves it
// alone. Nobody named yet → capped, as before. It's still a guess — "Jesus
// said to him" points at the man — so the result stays visible and editable.
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

  // Walk the words in order; returns the start offsets of the pronouns to cap.
  function divineCapsPlan(text) {
    const out = [];
    let who = null; // 'divine' | 'human' | null
    let prev = '';
    const re = /[A-Za-z]+(?:['’][A-Za-z]+)?/g;
    let m;
    while ((m = re.exec(text))) {
      const word = m[0].replace(/['’]s$/i, '');
      const low = word.toLowerCase();
      const capd = word[0] !== word[0].toLowerCase();
      if (PRONOUN.test(word)) { if (who !== 'human') out.push(m.index); }
      else if (capd && DIVINE.has(low)) who = 'divine'; // lowercase lord/god/father is a person or an idol
      else if (capd && HUMAN.has(low)) who = 'human';
      else if (!capd && PERSON_NOUNS.has(low) && ARTICLES.has(prev)) who = 'human';
      prev = low;
    }
    return out;
  }

  function divineCapsText(text) {
    if (!text) return text;
    const s = String(text);
    const at = divineCapsPlan(s);
    if (!at.length) return s;
    const chars = s.split('');
    at.forEach(i => { chars[i] = chars[i].toUpperCase(); });
    return chars.join('');
  }

  // How many words a divineCapsText() pass would change.
  function countDivineCaps(text) { return divineCapsPlan(String(text || '')).length; }

  // Spans are read as one passage (so "Paul ... he" across a bold span still
  // counts), then split back into their own spans with every other field kept.
  function divineCapsSpans(spans) {
    const list = spans || [];
    const capped = divineCapsText(list.map(s => s.text || '').join(''));
    let pos = 0;
    return list.map(s => {
      const len = (s.text || '').length;
      const text = capped.slice(pos, pos + len);
      pos += len;
      return { ...s, text };
    });
  }

  const api = { divineCapsText, divineCapsSpans, countDivineCaps };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(this);
