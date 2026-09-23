// End-to-end: spec → encode() → collectPropSpecs → buildProp. The prop-cue
// unit tests call buildProp directly with hand-built specs, so they can't see
// fields that encode.js drops or renames on the way — which is exactly how
// real exports lost Display 2's Fit Width data (a throwing LED-wall title
// estimate for every scripture with propAutoTitleY on, and an ignored
// LED-wall box) while every unit test passed.

const path = require('path');
const protobuf = require('protobufjs');
const { encode } = require('./encode.js');

let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { console.log('✅', name); pass++; } else { console.log('❌', name, extra || ''); fail++; } }

// Real-looking Display 2 Fit Width results, as buildSpec() in public/app.js emits them.
const D2 = { propBodyX: 411.5, propBodyW: 2377 };
const D2_METRICS = { propBodyLines: 2, propAscent: 74, propDescent: 19, propCapAscent: 56, propTitleAscent: 49, propTitleDescent: 13 };

const spec = {
  name: 'PipelineTest',
  downloadMode: true,
  style: { propAutoTitleY: true, autoTitleY: false },
  slides: [
    { type: 'scripture', label: 'John 3:16', reference: 'John 3:16', propName: 'John 3:16',
      bodies: [[{ text: 'For God so loved the world' }]], ...D2, ...D2_METRICS },
    { type: 'point', mode: 'single', label: 'Go', bodyText: 'Go First', propName: 'Go First', ...D2 },
    { type: 'point', mode: 'split', label: 'Split', bodyText: 'Main words', propBodyText: 'LED_WALL_ONLY_TEXT', propName: 'Split' },
    { type: 'point', mode: 'revealing', label: 'Rev', title: 'T', bullets: [[{ text: 'a' }], [{ text: 'b' }]], propBaseName: 'Rev', ...D2 },
  ],
};

function findElements(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (node.element?.bounds && node.element?.name) out.push(node.element);
  for (const v of Object.values(node)) findElements(v, out);
  return out;
}

(async () => {
  let result;
  try {
    result = await encode(spec);
    ok('export with propAutoTitleY on and a scripture slide does not throw', true);
  } catch (e) {
    ok('export with propAutoTitleY on and a scripture slide does not throw', false, e.message);
  }
  if (result) {
    const root = await protobuf.load(path.join(__dirname, 'ProPresenter7-Proto/proto/propDocument.proto'));
    const PropDocument = root.lookupType('rv.data.PropDocument');
    const doc = PropDocument.toObject(PropDocument.decode(Buffer.from(result.props[0].data, 'base64')), { defaults: true });
    const cue = name => (doc.cues || []).find(c => c.name === name);
    const bodyOf = name => findElements(cue(name)).find(e => e.name === 'body');
    const near = (a, b) => Math.abs((a || 0) - b) < 0.01;

    for (const name of ['John 3:16', 'Go First', 'Rev_1', 'Rev_2']) {
      const b = bodyOf(name)?.bounds;
      ok(`"${name}" LED-wall box uses Display 2's Fit Width x/width`,
        b && near(b.origin?.x, D2.propBodyX) && near(b.size?.width, D2.propBodyW), JSON.stringify(b));
    }

    const title = findElements(cue('John 3:16')).find(e => e.name === 'reference');
    ok('scripture LED-wall title is positioned from its real line count (a number, not the static fallback)',
      title && Number.isFinite(title.bounds?.origin?.y), JSON.stringify(title?.bounds));

    const splitRtf = Buffer.from(findElements(cue('Split')).find(e => e.name === 'body')?.text?.rtfData || '', 'base64').toString();
    ok('Split point sends its own LED-wall text to the prop, not the main-screen text',
      splitRtf.includes('LED_WALL_ONLY_TEXT') && !splitRtf.includes('Main words'));
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
