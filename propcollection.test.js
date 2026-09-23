// Two independent prop collections ("DeckPro Slot 1" / "DeckPro Slot 2"): two decks on
// different collections must both stay delivered and intact in ProPresenter's
// Configuration/Props — exporting one never overwrites the other's props.
// Runs the real deliver-mode path against a throwaway temp Pro7 workspace.

const fs = require('fs');
const os = require('os');
const path = require('path');
const protobuf = require('protobufjs');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deckpro-propcoll-'));
// Props-config backups prune to the newest 10 — never let a test push real ones out.
process.env.DECKPRO_DATA_DIR = path.join(tmp, 'data');

const { encode } = require('./encode.js');

let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { console.log('✅', name); pass++; } else { console.log('❌', name, extra || ''); fail++; } }

const libDir = path.join(tmp, 'Libraries', 'Default');
const confPath = path.join(tmp, 'Configuration', 'Props');

function deck(name, sentinel, propCollection) {
  return {
    name, deliverMode: true, propCollection,
    pro7RootFolder: tmp, pro7LibraryFolder: libDir,
    slides: [{ type: 'point', mode: 'single', label: sentinel, bodyText: sentinel, propName: sentinel }],
  };
}

(async () => {
  try {
    const propRoot = await protobuf.load(path.join(__dirname, 'ProPresenter7-Proto/proto/propDocument.proto'));
    const presRoot = await protobuf.load(path.join(__dirname, 'ProPresenter7-Proto/proto/propresenter.proto'));
    const PropDocument = propRoot.lookupType('rv.data.PropDocument');
    const Presentation = presRoot.lookupType('rv.data.Presentation');

    fs.mkdirSync(path.dirname(confPath), { recursive: true });
    // Seed with a foreign user collection that must survive untouched, plus a
    // collection under the OLD name "DeckPro" (with a non-fixed UUID, like one a
    // user created by hand) that must be renamed in place, not duplicated.
    fs.writeFileSync(confPath, PropDocument.encode(PropDocument.fromObject({
      cues: [], propCollections: [
        { uuid: { string: 'AAAAAAAA-0000-0000-0000-000000000009' }, name: 'My Own Props', items: [] },
        { uuid: { string: 'AAAAAAAA-0000-0000-0000-000000000001' }, name: 'DeckPro', items: [] },
      ],
    })).finish());

    const readConf = () => PropDocument.toObject(PropDocument.decode(fs.readFileSync(confPath)), { defaults: true });
    const cueText = (conf, uuidSet) => (conf.cues || [])
      .filter(c => uuidSet.has(c.uuid?.string))
      .map(c => JSON.stringify(c)).join('');
    const collection = (conf, name) => (conf.propCollections || []).find(c => c.name === name);
    const memberSet = coll => new Set((coll?.items || []).map(i => i.propCueUuid?.string));

    const rEvent = await encode(deck('Event', 'EVENT_SENTINEL', 1));
    const rGathering = await encode(deck('Gathering', 'GATHERING_SENTINEL', 2));
    ok('both exports report props installed', rEvent.propsInstalled && rGathering.propsInstalled, JSON.stringify([rEvent.propsError, rGathering.propsError]));
    ok('each export reports which collection it wrote to',
      rEvent.propCollectionName === 'DeckPro Slot 1' && rGathering.propCollectionName === 'DeckPro Slot 2',
      JSON.stringify([rEvent.propCollectionName, rGathering.propCollectionName]));

    let conf = readConf();
    const c1 = collection(conf, 'DeckPro Slot 1'), c2 = collection(conf, 'DeckPro Slot 2');
    ok('both "DeckPro Slot 1" and "DeckPro Slot 2" collections exist', !!c1 && !!c2);
    ok('each collection holds all 50 of its own slots', memberSet(c1).size === 50 && memberSet(c2).size === 50,
      `${memberSet(c1).size} / ${memberSet(c2).size}`);
    ok('the two collections share no prop UUIDs', [...memberSet(c1)].every(u => !memberSet(c2).has(u)));
    ok('both collections have Single Prop Mode on', !!c1?.singlePropEnabled && !!c2?.singlePropEnabled);
    ok('foreign user collection survives', !!collection(conf, 'My Own Props'));
    ok('old "DeckPro" collection was renamed in place, not left behind',
      !collection(conf, 'DeckPro') && c1?.uuid?.string === 'AAAAAAAA-0000-0000-0000-000000000001',
      JSON.stringify((conf.propCollections || []).map(c => [c.name, c.uuid?.string])));

    const b1 = memberSet(c1), b2 = memberSet(c2);
    ok('Event deck\'s prop lives in "DeckPro Slot 1"', cueText(conf, b1).includes('EVENT_SENTINEL'));
    ok('Gathering deck\'s prop lives in "DeckPro Slot 2"', cueText(conf, b2).includes('GATHERING_SENTINEL'));
    ok('exporting Gathering did NOT overwrite Event\'s prop', !cueText(conf, b1).includes('GATHERING_SENTINEL'));

    // Each presentation's PROP action must point at its own collection's slots.
    const propUuidsIn = file => {
      const pres = Presentation.toObject(Presentation.decode(fs.readFileSync(file)), { defaults: true });
      return (pres.cues || []).flatMap(c => c.actions || [])
        .map(a => a.prop?.identification?.parameterUuid?.string).filter(Boolean);
    };
    const evUuids = propUuidsIn(rEvent.presentationPath), gaUuids = propUuidsIn(rGathering.presentationPath);
    ok('Event presentation triggers "DeckPro Slot 1" slots', evUuids.length > 0 && evUuids.every(u => b1.has(u)), evUuids.join(','));
    ok('Gathering presentation triggers "DeckPro Slot 2" slots', gaUuids.length > 0 && gaUuids.every(u => b2.has(u)), gaUuids.join(','));

    // Re-exporting Event (edited) must leave Gathering's collection alone.
    await encode(deck('Event', 'EVENT_EDITED', 1));
    conf = readConf();
    ok('re-exported Event updates "DeckPro Slot 1"', cueText(conf, b1).includes('EVENT_EDITED'));
    ok('re-exporting Event leaves "DeckPro Slot 2" intact', cueText(conf, b2).includes('GATHERING_SENTINEL'));
    ok('still exactly one of each collection after re-export',
      conf.propCollections.filter(c => c.name === 'DeckPro Slot 1').length === 1 &&
      conf.propCollections.filter(c => c.name === 'DeckPro Slot 2').length === 1);

    // Omitted propCollection (every deck saved before this feature) = collection 1.
    const rLegacy = await encode({ ...deck('Legacy', 'LEGACY_SENTINEL'), propCollection: undefined });
    ok('a deck with no propCollection set defaults to "DeckPro Slot 1"', rLegacy.propCollectionName === 'DeckPro Slot 1');
  } catch (e) {
    ok('prop collection tests ran without throwing', false, e.stack);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
