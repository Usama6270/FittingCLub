const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '..', 'assets', 'js', 'products-data.js');
const text = fs.readFileSync(file, 'utf8');
const match = text.match(/window\.productsData\s*=\s*(\[.*\]);?\s*$/s);
if (!match) { console.error('NO MATCH'); process.exit(1); }

const data = JSON.parse(match[1]);

const countMap = {};
const subgroupMap = {};
const groupMap = {};
let prevOk = { basketball: 0, football: 0, karate: 0, duffel: 0, tracksuits: 0 };

for (const p of data) {
  const it = p.item;
  countMap[it] = (countMap[it] || 0) + 1;
  if (p.group) groupMap[it] = p.group;
  if (p.subgroup) subgroupMap[it] = p.subgroup;

  if (it === 'basketball-uniforms') prevOk.basketball++;
  else if (it === 'football-soccer-kits') prevOk.football++;
  else if (it === 'karate-uniform') prevOk.karate++;
  else if (it === 'duffel-bags') prevOk.duffel++;
  else if (it === 'tracksuits') prevOk.tracksuits++;
}

const slugs = Object.keys(countMap).sort();
console.log('PRODUCTS PER ITEM SLUG:');
for (const s of slugs) {
  const sg = subgroupMap[s] ? ` (subgroup=${subgroupMap[s]})` : '';
  const gr = groupMap[s] || '?';
  console.log(`  [${gr}] ${s}: ${countMap[s]}${sg}`);
}

console.log('\nPREVIOUS CATEGORIES INTACT CHECK:');
console.log('  Basketball Uniforms:', prevOk.basketball, '(should be 12)');
console.log('  Football/Soccer Kits:', prevOk.football, '(should be 12)');
console.log('  Karate Uniform:', prevOk.karate, '(should be 6)');
console.log('  Duffel Bags:', prevOk.duffel, '(should be 6)');
console.log('  Tracksuits:', prevOk.tracksuits, '(should be 12)');

console.log('\nNEW CATEGORIES EXPECTED:');
console.log('  Sweatshirt (sweatshirts):', countMap['sweatshirts'] || 0, '(8)');
console.log('  T-Shirts (t-shirts):', countMap['t-shirts'] || 0, '(12)');
console.log('  Windbreaker (windbreaker):', countMap['windbreaker'] || 0, '(6)');
console.log('  Shorts (shorts):', countMap['shorts'] || 0, '(7)');
console.log('  Polo Shirts (polo-shirts):', countMap['polo-shirts'] || 0, '(6)');
console.log('  Sleeveless Hoodies (sleeveless-hoodies, mens):', countMap['sleeveless-hoodies'] || 0, '(6)');
console.log('  Perf T-Shirts (performance-t-shirts, mens):', countMap['performance-t-shirts'] || 0, '(6)');
console.log('  Compression Shirts (compression-shirts, mens):', countMap['compression-shirts'] || 0, '(6)');
console.log('  Compression Shorts (compression-shorts-men, mens):', countMap['compression-shorts-men'] || 0, '(6)');
console.log('  Sports Bras (sports-bras, womens):', countMap['sports-bras'] || 0, '(6)');
console.log('  Crop Tops (crop-tops, womens):', countMap['crop-tops'] || 0, '(3)');
console.log('  Leggings (leggings, womens):', countMap['leggings'] || 0, '(6)');
console.log('  Training Jackets (training-jackets, womens):', countMap['training-jackets'] || 0, '(6)');

console.log('\nSUBGROUP FIELD CHECK (gymwear only):');
const gymItems = ['sleeveless-hoodies', 'performance-t-shirts', 'compression-shirts', 'compression-shorts-men', 'sports-bras', 'crop-tops', 'leggings', 'training-jackets'];
for (const gi of gymItems) {
  console.log(`  ${gi}: subgroup = "${subgroupMap[gi] || 'MISSING'}"`);
}

console.log('\nTOTAL PRODUCTS (ALL CATEGORIES):', data.length);
console.log('VALIDATION:', Object.values(prevOk).every(v => v > 0) && countMap['sweatshirts'] === 8 ? '✅ PASS' : '⚠ CHECK ISSUES');
