const { rtfBody, rtfTitle, rtfLive, rtfStartEnd, rtfPointList, rtfPointBody, rtfEmpty } = require('./rtf.js');

let pass = 0, fail = 0;

function test(name, got, expected) {
  const gotDecoded = Buffer.from(got, 'base64').toString('utf8');
  if (gotDecoded === expected) {
    console.log('✅', name);
    pass++;
  } else {
    console.log('❌', name);
    const gotLines = gotDecoded.split('\n');
    const expLines = expected.split('\n');
    const maxLen = Math.max(gotLines.length, expLines.length);
    for (let i = 0; i < maxLen; i++) {
      if (gotLines[i] !== expLines[i]) {
        console.log(`  Line ${i+1}:`);
        console.log(`    GOT: ${JSON.stringify(gotLines[i])}`);
        console.log(`    EXP: ${JSON.stringify(expLines[i])}`);
      }
    }
    fail++;
  }
}

test('START banner', rtfStartEnd('START'),
`{\\rtf1\\ansi\\ansicpg1252\\cocoartf2865
\\cocoatextscaling0\\cocoaplatform0{\\fonttbl\\f0\\fnil\\fcharset0 Montserrat-ExtraBold;}
{\\colortbl;\\red255\\green255\\blue255;\\red255\\green255\\blue255;\\red0\\green0\\blue0;}
{\\*\\expandedcolortbl;;\\cssrgb\\c100000\\c100000\\c100000;\\cssrgb\\c0\\c0\\c0;}
\\deftab1680
\\pard\\pardeftab1680\\pardirnatural\\partightenfactor0

\\f0\\fs90 \\cf2 \\CocoaLigature0 \\outl0\\strokewidth-20 \\strokec3 START}`);

test('END banner', rtfStartEnd('End of Notes'),
`{\\rtf1\\ansi\\ansicpg1252\\cocoartf2865
\\cocoatextscaling0\\cocoaplatform0{\\fonttbl\\f0\\fnil\\fcharset0 Montserrat-ExtraBold;}
{\\colortbl;\\red255\\green255\\blue255;\\red255\\green255\\blue255;\\red0\\green0\\blue0;}
{\\*\\expandedcolortbl;;\\cssrgb\\c100000\\c100000\\c100000;\\cssrgb\\c0\\c0\\c0;}
\\deftab1680
\\pard\\pardeftab1680\\pardirnatural\\partightenfactor0

\\f0\\fs90 \\cf2 \\CocoaLigature0 \\outl0\\strokewidth-20 \\strokec3 End of Notes}`);

test('live element', rtfLive(),
`{\\rtf1\\ansi\\ansicpg1252\\cocoartf2865
\\cocoatextscaling0\\cocoaplatform0{\\fonttbl\\f0\\fnil\\fcharset0 HelveticaNeue;}
{\\colortbl;\\red255\\green255\\blue255;\\red255\\green255\\blue255;}
{\\*\\expandedcolortbl;;\\csgray\\c100000;}
\\deftab1680
\\pard\\pardeftab1680\\pardirnatural\\qc\\partightenfactor0

\\f0\\fs84 \\cf2 \\CocoaLigature0 live}`);

test('title: John 13:35', rtfTitle('John 13:35'),
`{\\rtf1\\ansi\\ansicpg1252\\cocoartf2865
\\cocoatextscaling0\\cocoaplatform0{\\fonttbl\\f0\\fswiss\\fcharset0 Arial;}
{\\colortbl;\\red255\\green255\\blue255;\\red255\\green255\\blue255;\\red0\\green0\\blue0;}
{\\*\\expandedcolortbl;;\\cssrgb\\c100000\\c100000\\c100000;\\cssrgb\\c0\\c0\\c0;}
\\deftab1680
\\pard\\pardeftab1680\\sa400\\pardirnatural\\qc\\partightenfactor0

\\f0\\fs80 \\cf2 \\CocoaLigature0 \\outl0\\strokewidth-20 \\strokec3 John 13:35}`);

test('title: 2 Corinthians 3:18', rtfTitle('2 Corinthians 3:18'),
`{\\rtf1\\ansi\\ansicpg1252\\cocoartf2865
\\cocoatextscaling0\\cocoaplatform0{\\fonttbl\\f0\\fswiss\\fcharset0 Arial;}
{\\colortbl;\\red255\\green255\\blue255;\\red255\\green255\\blue255;\\red0\\green0\\blue0;}
{\\*\\expandedcolortbl;;\\cssrgb\\c100000\\c100000\\c100000;\\cssrgb\\c0\\c0\\c0;}
\\deftab1680
\\pard\\pardeftab1680\\sa400\\pardirnatural\\qc\\partightenfactor0

\\f0\\fs80 \\cf2 \\CocoaLigature0 \\outl0\\strokewidth-20 \\strokec3 2 Corinthians 3:18}`);

test('point body: Apply the Message', rtfPointBody('Apply the Message'),
`{\\rtf1\\ansi\\ansicpg1252\\cocoartf2865
\\cocoatextscaling0\\cocoaplatform0{\\fonttbl\\f0\\fnil\\fcharset0 Montserrat-Medium;}
{\\colortbl;\\red255\\green255\\blue255;\\red255\\green255\\blue255;\\red0\\green0\\blue0;}
{\\*\\expandedcolortbl;;\\cssrgb\\c100000\\c100000\\c100000;\\cssrgb\\c0\\c0\\c0;}
\\deftab1680
\\pard\\pardeftab1680\\pardirnatural\\qc\\partightenfactor0

\\f0\\fs88 \\cf2 \\CocoaLigature0 \\outl0\\strokewidth-20 \\strokec3 Apply the Message}`);

test('point list (3 items)', rtfPointList(['Create Opportunities', 'Serve One and Attend One', 'Apply the Message']),
`{\\rtf1\\ansi\\ansicpg1252\\cocoartf2865
\\cocoatextscaling0\\cocoaplatform0{\\fonttbl\\f0\\fnil\\fcharset0 Montserrat-Medium;}
{\\colortbl;\\red255\\green255\\blue255;\\red255\\green255\\blue255;\\red0\\green0\\blue0;}
{\\*\\expandedcolortbl;;\\cssrgb\\c100000\\c100000\\c100000;\\cssrgb\\c0\\c0\\c0;}
\\deftab1680
\\pard\\pardeftab1680\\pardirnatural\\partightenfactor0

\\f0\\fs80 \\cf2 \\CocoaLigature0 \\outl0\\strokewidth-20 \\strokec3 1 \\'97 Create Opportunities\\
2 \\'97 Serve One and Attend One\\
3 \\'97 Apply the Message}`);

test('blank all-bold: Show Jesus to the world.', rtfBody([{text: 'Show Jesus to the world.', alt: true}]),
`{\\rtf1\\ansi\\ansicpg1252\\cocoartf2865
\\cocoatextscaling0\\cocoaplatform0{\\fonttbl\\f0\\fnil\\fcharset0 Montserrat-Medium;}
{\\colortbl;\\red255\\green255\\blue255;\\red255\\green255\\blue255;\\red0\\green0\\blue0;}
{\\*\\expandedcolortbl;;\\cssrgb\\c100000\\c100000\\c100000;\\cssrgb\\c0\\c0\\c0;}
\\deftab1680
\\pard\\pardeftab1680\\pardirnatural\\qc\\partightenfactor0

\\f0\\b\\fs88 \\cf2 \\CocoaLigature0 \\outl0\\strokewidth-20 \\strokec3 Show Jesus to the world.}`);

// cue 2 — John 13:35 body: mixed bold
const johnSpans = [
  { text: '\u201cYour ', alt: false },
  { text: 'love for one another', alt: true },
  { text: ' will prove to the world that you are my disciples.\u201d', alt: false },
];
test('mixed bold: John 13:35 body', rtfBody(johnSpans),
`{\\rtf1\\ansi\\ansicpg1252\\cocoartf2865
\\cocoatextscaling0\\cocoaplatform0{\\fonttbl\\f0\\fnil\\fcharset0 Montserrat-Medium;\\f1\\fnil\\fcharset0 Montserrat-Medium;}
{\\colortbl;\\red255\\green255\\blue255;\\red255\\green255\\blue255;\\red0\\green0\\blue0;}
{\\*\\expandedcolortbl;;\\cssrgb\\c100000\\c100000\\c100000;\\cssrgb\\c0\\c0\\c0;}
\\deftab1680
\\pard\\pardeftab1680\\pardirnatural\\partightenfactor0

\\f0\\fs88 \\cf2 \\CocoaLigature0 \\outl0\\strokewidth-20 \\strokec3 \\'93Your 
\\f1 love for one another
\\f0  will prove to the world that you are my disciples.\\'94}`);

// cue 5 — Acts 2:46 body: multiple bold spans
const acts246Spans = [
  { text: 'They worshiped ', alt: false },
  { text: 'together at the Temple', alt: true },
  { text: ' each day, met in homes for the Lord\u2019s Supper, and shared their meals with great ', alt: false },
  { text: 'joy', alt: true },
  { text: ' and ', alt: false },
  { text: 'generosity', alt: true },
  { text: '.', alt: false },
];
test('mixed bold: Acts 2:46 body', rtfBody(acts246Spans),
`{\\rtf1\\ansi\\ansicpg1252\\cocoartf2865
\\cocoatextscaling0\\cocoaplatform0{\\fonttbl\\f0\\fnil\\fcharset0 Montserrat-Medium;\\f1\\fnil\\fcharset0 Montserrat-Medium;}
{\\colortbl;\\red255\\green255\\blue255;\\red255\\green255\\blue255;\\red0\\green0\\blue0;}
{\\*\\expandedcolortbl;;\\cssrgb\\c100000\\c100000\\c100000;\\cssrgb\\c0\\c0\\c0;}
\\deftab1680
\\pard\\pardeftab1680\\pardirnatural\\partightenfactor0

\\f0\\fs88 \\cf2 \\CocoaLigature0 \\outl0\\strokewidth-20 \\strokec3 They worshiped 
\\f1 together at the Temple
\\f0  each day, met in homes for the Lord\\'92s Supper, and shared their meals with great 
\\f1 joy
\\f0  and 
\\f1 generosity
\\f0 .}`);

test('empty rtf', rtfEmpty(),
`{\\rtf1\\ansi\\ansicpg1252\\cocoartf2865
\\cocoatextscaling0\\cocoaplatform0{\\fonttbl}
{\\colortbl;\\red255\\green255\\blue255;}
{\\*\\expandedcolortbl;;}
}`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
