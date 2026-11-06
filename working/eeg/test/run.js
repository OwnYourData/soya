// Lokale Prüfung der EEG_-Strukturen vor dem Veröffentlichen.
// Ablauf je Fall wie `soya acquire <Name> | soya validate <Name>`, nur dass
// die Struktur aus der lokalen YAML-Quelle erzeugt wird statt aus dem Repo.
// Aufruf: node test/run.js [cases.json]   (soya-js und handlebars über NODE_PATH)
const fs = require('fs');
const path = require('path');
const { Soya, RepoService, Overlays } = require('soya-js');
const Handlebars = require('handlebars');

const root = path.resolve(__dirname, '..');
const casesFile = path.resolve(process.argv[2] || path.join(root, 'examples', 'cases.json'));
const exampleDir = path.dirname(casesFile);
const cases = JSON.parse(fs.readFileSync(casesFile, 'utf8'));

const docs = {};
const service = {
  repo: RepoService.getInstance().repo,
  pull: async (name) => {
    if (!docs[name]) throw new Error(`unknown structure ${name}`);
    return docs[name];
  },
};
const noop = () => {};
const quiet = { error: console.error, warn: noop, info: noop, debug: noop, log: noop };
quiet.child = () => quiet;
const soya = new Soya({ service, logger: quiet });

// wie dc-pod SoyaHelper#fetch_soya_rendering_label: erstes OverlayDataBudRendering im @graph
const renderingLabel = (doc) => {
  const overlay = doc['@graph'].find((x) => {
    const t = x['@type'];
    return t === 'OverlayDataBudRendering' || (Array.isArray(t) && t.includes('OverlayDataBudRendering'));
  });
  return overlay && overlay.renderingLabel;
};

(async () => {
  let failed = 0;
  const load = async (name) => {
    if (!docs[name]) docs[name] = await soya.init(fs.readFileSync(path.join(root, `${name}.yml`), 'utf8'));
    return docs[name];
  };
  const validator = new Overlays.SoyaValidate();

  for (const [name, file, expected] of cases.validate || []) {
    const doc = await load(name);
    const flat = JSON.parse(fs.readFileSync(path.join(exampleDir, file), 'utf8'));
    const instance = await soya.acquire(name, flat);
    const res = await validator.run(doc, instance);
    const ok = res.data.isValid === expected;
    if (!ok) failed++;
    const reasons = res.data.isValid ? '' : ' | ' + res.data.results
      .map((r) => `${String(r.value || r.name).split('/').pop()}: ${(r.message || []).map((m) => m.value || m).join('; ')}`)
      .join(' | ');
    console.log(`${ok ? 'PASS' : 'FAIL'} validate ${name} ${file} isValid=${res.data.isValid} (erwartet ${expected})${reasons}`);
  }

  for (const [name, file, expected] of cases.render || []) {
    const doc = await load(name);
    const label = renderingLabel(doc);
    const data = JSON.parse(fs.readFileSync(path.join(exampleDir, file), 'utf8'));
    const out = Handlebars.compile(label)(data);
    const ok = out === expected;
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'} render ${name} ${file} -> "${out}"${ok ? '' : ` (erwartet "${expected}")`}`);
  }

  console.log(failed === 0 ? 'Alle Fälle bestanden.' : `${failed} Fall/Fälle fehlgeschlagen.`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
