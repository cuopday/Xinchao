/* Offline validator: runs every model in models.json through buildGeometry
 * using a minimal DOM shim, reports failures & triangle counts.
 * Usage: node js/validate.js
 */
const fs = require('fs');
const path = require('path');

// ---- minimal browser shim so math3d.js can load in Node ----
global.window = global;
global.document = {
  createElement: () => ({
    width: 0, height: 0,
    getContext: () => null,
    style: {}, addEventListener() {}, appendChild() {},
    toDataURL: () => '',
  }),
};
global.navigator = { userAgent: 'node' };

// Load math3d.js and capture the API (it attaches to global.Math3DCatalog)
require(path.join(__dirname, 'math3d.js'));
const Cat = global.Math3DCatalog;

const models = JSON.parse(fs.readFileSync(path.join(__dirname, 'models.json'), 'utf8'));

let fail = 0, empty = 0, huge = 0, totalTris = 0;
const kindStats = {};
const badIds = [];

for (const m of models) {
  let g;
  try {
    g = Cat.buildGeometry(m);
  } catch (e) {
    fail++;
    badIds.push([m.id, 'THROW: ' + e.message]);
    continue;
  }
  const tris = g.tris.length, lines = g.rawLines.length, pts = (g.pts || []).length;
  if (!tris && !lines && !pts) { empty++; badIds.push([m.id, 'EMPTY geometry']); }
  if (tris > 60000) huge++;
  totalTris += tris;
  const ks = kindStats[m.kind] || (kindStats[m.kind] = { n: 0, minT: 1e9, maxT: 0 });
  ks.n++; ks.minT = Math.min(ks.minT, tris); ks.maxT = Math.max(ks.maxT, tris);
}

console.log('total models      :', models.length);
console.log('builder throws    :', fail);
console.log('empty geometries  :', empty);
console.log('huge (>60k tris)  :', huge);
console.log('avg triangles     :', Math.round(totalTris / models.length));
console.log('--- per kind ---');
for (const k of Object.keys(kindStats).sort()) {
  const s = kindStats[k];
  console.log(k.padEnd(14), 'n=' + String(s.n).padEnd(6), 'tris ' + s.minT + '..' + s.maxT);
}
if (badIds.length) {
  console.log('--- problems (first 30) ---');
  badIds.slice(0, 30).forEach(([id, msg]) => console.log(id, msg));
}
process.exit(fail || empty ? 1 : 0);
