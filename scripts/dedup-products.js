/**
 * dedup-products.js
 * Removes duplicate product entries from products-data.js.
 * Keeps the LAST occurrence of each product ID (most recently imported wins).
 * Also reports any groups/items impacted.
 */

const fs = require('fs');
const path = require('path');

const outputDataFile = path.join(__dirname, '..', 'assets', 'js', 'products-data.js');

console.log('Reading products-data.js...');
const raw = fs.readFileSync(outputDataFile, 'utf8');
const match = raw.match(/window\.productsData\s*=\s*(\[.*\]);?\s*$/s);
if (!match) {
  console.error('ERROR: Could not find window.productsData in file');
  process.exit(1);
}

const all = JSON.parse(match[1]);
console.log(`Total products before dedup: ${all.length}`);

// Deduplicate: keep the LAST occurrence of each id (later imports win)
const seen = new Map();
for (const product of all) {
  if (product && product.id) {
    seen.set(product.id, product);
  }
}

const deduped = Array.from(seen.values());
const removed = all.length - deduped.length;
console.log(`Duplicates removed: ${removed}`);
console.log(`Total products after dedup: ${deduped.length}`);

if (removed > 0) {
  // Report which IDs were duplicated
  const idCounts = {};
  for (const p of all) {
    if (p && p.id) idCounts[p.id] = (idCounts[p.id] || 0) + 1;
  }
  const dups = Object.entries(idCounts).filter(([, count]) => count > 1);
  console.log('\nDuplicate IDs resolved:');
  dups.forEach(([id, count]) => console.log(`  - "${id}" appeared ${count} times → kept 1`));
}

// Write back
const fileContent = `window.productsData = ${JSON.stringify(deduped, null, 2)};\n`;
fs.writeFileSync(outputDataFile, fileContent, 'utf8');

// Validate
try {
  const roundTrip = fs.readFileSync(outputDataFile, 'utf8');
  const rt = roundTrip.match(/window\.productsData\s*=\s*(\[.*\]);?\s*$/s);
  if (!rt) throw new Error('Missing window.productsData');
  const parsed = JSON.parse(rt[1]);
  
  // Confirm no more duplicates
  const ids = parsed.map(p => p.id).filter(Boolean);
  const idSet = new Set(ids);
  if (idSet.size !== ids.length) {
    console.error('WARNING: Still have duplicate IDs after dedup!');
  } else {
    console.log('\n✓ No duplicate IDs remain');
  }
  console.log('✓ products-data.js syntax valid');
  console.log(`✓ Final product count: ${parsed.length}`);

  // Summary by group
  const groups = {};
  for (const p of parsed) {
    const g = p.group || 'unknown';
    groups[g] = (groups[g] || 0) + 1;
  }
  console.log('\nProducts by group:');
  Object.entries(groups).sort().forEach(([g, c]) => console.log(`  ${g}: ${c}`));

  // Summary by item
  const items = {};
  for (const p of parsed) {
    const key = `${p.group}/${p.item}`;
    items[key] = (items[key] || 0) + 1;
  }
  console.log('\nProducts by item:');
  Object.entries(items).sort().forEach(([k, c]) => console.log(`  ${k}: ${c}`));

} catch (err) {
  console.error('ERROR validating:', err.message);
  process.exit(1);
}

console.log('\n✅ Deduplication complete.');
