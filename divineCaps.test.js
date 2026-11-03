// Divine-pronoun caps skip pronouns about people (Paul, Peter, "the man").
const { divineCapsText, divineCapsSpans, divineCapsBodies, countDivineCaps } = require('./public/divineCaps');
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
// With an NKJV reference (texts are ESV/NLT vs NKJV, the real pairs).
const nkjvMark = 'Now a leper came to Him, imploring Him, kneeling down to Him and saying to Him, “If You are willing, You can make me clean.”\nThen Jesus, moved with compassion, stretched out His hand and touched him, and said to him, “I am willing; be cleansed.”';
eq('ref: leper text', divineCapsText('And a leper came to him, imploring him, and kneeling said to him, “If you will, you can make me clean.”\nMoved with pity, he stretched out his hand and touched him and said to him, “I will; be clean.”', nkjvMark),
  'And a leper came to Him, imploring Him, and kneeling said to Him, “If you will, you can make me clean.”\nMoved with pity, He stretched out His hand and touched him and said to him, “I will; be clean.”');
const nkjvActs = 'Now while Paul was waiting for them at Athens, his spirit was provoked within him when he saw that the city was given over to idols.\nTherefore he reasoned in the synagogue with the Jews.\nAnd some said, “What does this babbler want to say?” Others said, “He seems to be a proclaimer of foreign gods,” because he preached to them Jesus and the resurrection.';
eq('ref: quote-start He is not God', divineCapsText('He also had a debate with some philosophers. When he told them about Jesus and his resurrection, they said, “What’s this babbler trying to say with these strange ideas he’s picked up?”', nkjvActs).includes('When he told'), true);
eq('ref: hyphen word names nobody', divineCapsText('While Paul waited, he went to the God-fearing Gentiles, and he spoke daily.'), 'While Paul waited, he went to the God-fearing Gentiles, and he spoke daily.');
eq('ref: prodigal stays lower', divineCapsText('So he returned home to his father. And while he was still a long way off, his father saw him coming.',
  'And he arose and came to his father. But when he was still a great way off, his father saw him and had compassion.'),
  'So he returned home to his father. And while he was still a long way off, his father saw him coming.');
eq('ref: nobody named + ref says lower', divineCapsText('The next day he saw Jesus coming toward him.', 'The next day John saw Jesus coming toward him.'), 'The next day he saw Jesus coming toward him.');
const bod = divineCapsBodies([[{ text: 'For God so loved the world that he gave' }], [{ text: 'his only Son' }]], 'For God so loved the world that He gave His only begotten Son');
eq('bodies split back', bod.map(b => b[0].text).join('|'), 'For God so loved the world that He gave|His only Son');

console.log(`divineCaps: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
