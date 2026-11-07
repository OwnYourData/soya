// DRI einer Struktur aus ihrer YAML-Quelle, so wie das Repository sie beim Push vergibt
// (Hash über das JSON-LD ohne @base, also unabhängig vom Namen).
// Aufruf: NODE_PATH=../../cli2/node_modules node test/dri.js EEG_TimeSeries.yml [...]
const fs = require('fs');
const { Soya } = require('soya-js');

const noop = () => {};
const quiet = { error: console.error, warn: noop, info: noop, debug: noop, log: noop };
quiet.child = () => quiet;

(async () => {
  const soya = new Soya({ logger: quiet });
  for (const file of process.argv.slice(2)) {
    const doc = await soya.init(fs.readFileSync(file, 'utf8'));
    console.log(`${file} ${await soya.structureDri(doc)}`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
