// Divine-pronoun caps skip pronouns about people (Paul, Peter, "the man").
const { divineCapsText, divineCapsSpans, countDivineCaps } = require('./public/divineCaps');
let pass = 0, fail = 0;
const eq = (name, got, want) => { if (got === want) pass++; else { fail++; console.error('FAIL', name, '\n  got: ', got, '\n  want:', want); } };

eq('Paul stays lowercase', divineCapsText('Paul went to Athens, and he reasoned with them in his usual way.'),
  'Paul went to Athens, and he reasoned with them in his usual way.');
eq('God is capped', divineCapsText('For God so loved the world that he gave his one and only Son'),
  'For God so loved the world that He gave His one and only Son');
eq('switches back to divine', divineCapsText('Peter answered him. Then Jesus said that he must suffer.'),
  'Peter answered him. Then Jesus said that He must suffer.');
eq('the man → person', divineCapsText('A man with leprosy came to him and begged him on his knees'),
  'A man with leprosy came to him and begged him on his knees');
eq("possessive name", divineCapsText("Paul's letter, which he wrote"), "Paul's letter, which he wrote");
eq('nobody named → capped', divineCapsText('he is faithful'), 'He is faithful');
eq('lowercase lord is a person', divineCapsText('my lord the king, he said'), 'my lord the king, he said');
eq('this/history untouched', divineCapsText('this is history'), 'this is history');
eq('count', countDivineCaps('Jesus said he and his'), 2);
const sp = divineCapsSpans([{ text: 'Paul, ' }, { text: 'he', bold: true }, { text: ' and God, he' }]);
eq('spans read as one passage', sp.map(s => s.text).join('|'), 'Paul, |he| and God, He');
eq('span fields kept', sp[1].bold, true);
console.log(`divineCaps: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
