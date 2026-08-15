const fs = require('fs');
const path = require('path');

const productsFile = path.resolve(__dirname, '..', 'assets', 'js', 'products-data.js');
const categoriesFile = path.resolve(__dirname, '..', 'assets', 'js', 'categories-data.js');

const pText = fs.readFileSync(productsFile, 'utf8');
const cText = fs.readFileSync(categoriesFile, 'utf8');

// extract and parse both
const pMatch = pText.match(/window\.productsData\s*=\s*(\[.*\]);?\s*$/s);
const products = JSON.parse(pMatch[1]);

// categories-data.js uses JS format (const, comments) NOT strict JSON — use vm
const vm = require('vm');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(cText, sandbox);
const categories = sandbox.window.categoryData || sandbox.categoryData;

// Collect slugs from categories
const categoryGroupSlugs = new Set();
const categoryItemSlugs = new Set();
const categorySubgroupSlugs = new Set();
const itemsByGroup = {};
const itemsBySubgroup = {};

for (const g of categories) {
  categoryGroupSlugs.add(g.slug);
  itemsByGroup[g.slug] = [];
  if (g.items) {
    for (const it of g.items) {
      categoryItemSlugs.add(it.slug);
      itemsByGroup[g.slug].push(it.slug);
    }
  }
  if (g.subGroups) {
    for (const sg of g.subGroups) {
      categorySubgroupSlugs.add(sg.slug);
      itemsBySubgroup[sg.slug] = [];
      if (sg.items) {
        for (const it of sg.items) {
          categoryItemSlugs.add(it.slug);
          itemsBySubgroup[sg.slug].push(it.slug);
        }
      }
    }
  }
}

// Collect from products
const productGroupSlugs = new Set();
const productItemSlugs = new Set();
const productSubgroupSlugs = new Set();
const productCounts = { groups: {}, items: {}, subgroups: {} };

for (const p of products) {
  const g = p.group || '';
  const i = p.item || '';
  const sg = p.subgroup || '';
  productGroupSlugs.add(g);
  productItemSlugs.add(i);
  if (sg) productSubgroupSlugs.add(sg);
  productCounts.groups[g] = (productCounts.groups[g] || 0) + 1;
  productCounts.items[i] = (productCounts.items[i] || 0) + 1;
  if (sg) productCounts.subgroups[sg] = (productCounts.subgroups[sg] || 0) + 1;
}

console.log('=== CATEGORY GROUP SLUGS (canonical source of truth) ===');
for (const s of [...categoryGroupSlugs].sort()) console.log('  ', s);

console.log('\n=== PRODUCT GROUP SLUGS (from products-data.js) ===');
for (const s of [...productGroupSlugs].sort()) console.log('  ', s, `(${productCounts.groups[s]})`);

console.log('\n=== GROUP SLUGS IN PRODUCTS BUT NOT IN CATEGORIES (DRIFT!) ===');
for (const s of [...productGroupSlugs]) if (!categoryGroupSlugs.has(s)) console.log('  ❌ ', s);
console.log('\n=== GROUP SLUGS IN CATEGORIES BUT NOT IN PRODUCTS (orphan filters) ===');
for (const s of [...categoryGroupSlugs]) if (!productGroupSlugs.has(s)) console.log('  ⚠ (no products) ', s);

console.log('\n=== CATEGORY ITEM SLUGS (all groups + nested subgroups) ===');
for (const s of [...categoryItemSlugs].sort()) console.log('  ', s);

console.log('\n=== PRODUCT ITEM SLUGS ===');
for (const s of [...productItemSlugs].sort()) console.log('  ', s, `(${productCounts.items[s]})`);

console.log('\n=== ITEM SLUG MISMATCH (product but not in categories) ===');
for (const s of [...productItemSlugs]) if (!categoryItemSlugs.has(s)) console.log('  ❌ ', s, `(${productCounts.items[s]} products have NO CATEGORY FILTER BUTTON — will return 0 since button uses other slug!!!)`);
console.log('\n=== ITEM SLUG MISMATCH (category has no products) ===');
for (const s of [...categoryItemSlugs]) if (!productItemSlugs.has(s)) console.log('  ⚠ (0 products) ', s);

console.log('\n=== SUBGROUP SLUGS (categories) ===');
for (const s of [...categorySubgroupSlugs].sort()) console.log('  ', s);
console.log('\n=== SUBGROUP SLUGS (products) ===');
for (const s of [...productSubgroupSlugs].sort()) console.log('  ', s, `(${productCounts.subgroups[s]})`);
console.log('\n=== SUBGROUP DRIFT (products not in categories) ===');
for (const s of [...productSubgroupSlugs]) if (!categorySubgroupSlugs.has(s)) console.log('  ❌ ', s);
console.log('\n=== SUBGROUP DRIFT (categories no products) ===');
for (const s of [...categorySubgroupSlugs]) if (!productSubgroupSlugs.has(s)) console.log('  ⚠ (no products) ', s);

// For each product, VERIFY that its group/item/subgroup actually appear in the categoryData structure
console.log('\n=== PER-PRODUCT VALIDATION (check every product against category taxonomy) ===');
let invalid = 0;
for (const p of products) {
  const g = p.group || '';
  const i = p.item || '';
  const sg = p.subgroup || null;
  const group = categories.find(c => c.slug === g);
  if (!group) {
    invalid++;
    console.log(`  ❌ [${p.name}] group="${g}" NOT FOUND in category groups! Product will be INVISIBLE to all filters except ALL!`);
    continue;
  }
  let foundItem = false;
  if (sg) {
    const subgroup = (group.subGroups || []).find(s => s.slug === sg);
    if (!subgroup) {
      invalid++;
      console.log(`  ❌ [${p.name}] subgroup="${sg}" NOT in group "${g}" subgroups!`);
      continue;
    }
    foundItem = (subgroup.items || []).some(it => it.slug === i);
    if (!foundItem) {
      invalid++;
      console.log(`  ❌ [${p.name}] item="${i}" NOT FOUND under group=${g}, subgroup=${sg}!`);
    }
  } else {
    foundItem = (group.items || []).some(it => it.slug === i);
    if (!foundItem) {
      invalid++;
      console.log(`  ❌ [${p.name}] item="${i}" NOT FOUND in group="${g}" items! Group has items: [${(group.items||[]).map(i=>i.slug).join(', ')}]`);
    }
  }
}
console.log(`\n✅ VALID PRODUCTS: ${products.length - invalid}`);
console.log(`❌ INVALID (invisible to filters except ALL): ${invalid}`);
