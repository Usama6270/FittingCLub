const fs = require('fs');
const path = require('path');

const productsFile = path.resolve(__dirname, '..', 'assets', 'js', 'products-data.js');

// Load products
const text = fs.readFileSync(productsFile, 'utf8');
const match = text.match(/window\.productsData\s*=\s*(\[[\s\S]*\]);?\s*$/);
if (!match) {
  console.error('Could not parse products-data.js');
  process.exit(1);
}

const products = JSON.parse(match[1]);

// Define all categories to test
const categoriesToTest = {
  'basketball-uniforms': 'Basketball',
  'football-soccer-kits': 'Football/Soccer',
  'volleyball-uniforms': 'Volleyball',
  'american-football-uniforms': 'American Football',
  'karate-uniform': 'Karate',
  'boxing-gloves': 'Martial Arts - Boxing Gloves',
  'boxing-shorts': 'Martial Arts - Boxing Shorts',
  'mma-gloves': 'Martial Arts - MMA Gloves',
  'head-guards': 'Martial Arts - Head Guards',
  'hand-wraps': 'Martial Arts - Hand Wraps',
  'focus-mitts': 'Martial Arts - Focus Mitts',
  'shin-guards': 'Martial Arts - Shin Guards',
  'duffel-bags': 'Duffel Bags',
  'tracksuits': 'Fashionwear - Tracksuits',
  't-shirts': 'Fashionwear - T-Shirts',
  'jackets': 'Fashionwear - Jackets',
  'hoodies': 'Fashionwear - Hoodies',
  'sweatshirts': 'Fashionwear - Sweatshirts',
  'windbreaker': 'Fashionwear - Windbreaker',
  'shorts': 'Fashionwear - Shorts',
  'polo-shirts': 'Fashionwear - Polo Shirts',
  'crop-tops': 'Fashionwear - Crop Tops',
  'compression-shirts': 'Gymwear - Compression Shirts',
  'compression-shorts-men': 'Gymwear - Compression Shorts (Men)',
  'sleeveless-hoodies': 'Gymwear - Sleeveless Hoodies',
  'sports-bras': 'Gymwear - Sports Bras',
  'leggings': 'Gymwear - Leggings',
  'training-jackets': 'Gymwear - Training Jackets',
  'performance-t-shirts': 'Gymwear - Performance T-Shirts'
};

// Build product map by category
const productsByCategory = {};
products.forEach(p => {
  if (p.item && categoriesToTest[p.item]) {
    if (!productsByCategory[p.item]) {
      productsByCategory[p.item] = [];
    }
    productsByCategory[p.item].push(p);
  }
});

console.log('═'.repeat(100));
console.log('COMPREHENSIVE IMAGE RULE VERIFICATION');
console.log('═'.repeat(100));

let totalProducts = 0;
let productsWithCompleteImages = 0;
let productsWithMissingImages = [];
let categoriesTested = 0;
let categoriesPass = 0;

// Test each category
Object.entries(categoriesToTest).forEach(([itemSlug, categoryName]) => {
  const prods = productsByCategory[itemSlug] || [];
  
  if (prods.length === 0) {
    console.log(`\n⚠  ${categoryName} (${itemSlug}): NO PRODUCTS FOUND`);
    return;
  }

  categoriesTested++;
  console.log(`\n✓ ${categoryName} (${prods.length} products)`);
  
  let categoryPass = true;

  // Test first 3 products (or all if fewer than 3)
  const toTest = Math.min(3, prods.length);
  for (let i = 0; i < toTest; i++) {
    const product = prods[i];
    totalProducts++;

    const hasImage1 = Array.isArray(product.images) && product.images[0];
    const hasImage2 = Array.isArray(product.images) && product.images[1];
    const hasComplete = hasImage1 && hasImage2;

    if (hasComplete) {
      productsWithCompleteImages++;
      console.log(`  ✓ ${product.name}`);
      console.log(`    - Card image: ${product.images[1].split('/').pop()}`);
      console.log(`    - Detail image: ${product.images[0].split('/').pop()}`);
    } else {
      categoryPass = false;
      console.log(`  ✗ ${product.name}`);
      if (!hasImage1) console.log(`    ⚠  Missing images[0] (image-1)`);
      if (!hasImage2) console.log(`    ⚠  Missing images[1] (image-2)`);
      productsWithMissingImages.push({
        id: product.id,
        name: product.name,
        category: categoryName,
        hasImage1,
        hasImage2,
        totalImages: Array.isArray(product.images) ? product.images.length : 0
      });
    }
  }

  if (categoryPass) {
    categoriesPass++;
  }
});

console.log('\n' + '═'.repeat(100));
console.log('SUMMARY');
console.log('═'.repeat(100));
console.log(`Categories Tested: ${categoriesTested}`);
console.log(`Categories Passing: ${categoriesPass}`);
console.log(`Total Spot-Check Products: ${totalProducts}`);
console.log(`Products with Complete Images (2+): ${productsWithCompleteImages}`);
console.log(`Products with Missing Images: ${productsWithMissingImages.length}`);

if (productsWithMissingImages.length > 0) {
  console.log('\n⚠  PRODUCTS NEEDING IMAGE FIXES:');
  productsWithMissingImages.forEach(p => {
    console.log(`  - ${p.id}`);
    console.log(`    Name: ${p.name}`);
    console.log(`    Category: ${p.category}`);
    console.log(`    Status: has ${p.totalImages} image(s) - needs image-1:${p.hasImage1 ? '✓' : '✗'}, image-2:${p.hasImage2 ? '✓' : '✗'}`);
  });
}

// Check sitewide statistics
const allWithMissingImages = products.filter(p => 
  !Array.isArray(p.images) || p.images.length < 2
);

console.log('\n' + '═'.repeat(100));
console.log('SITEWIDE IMAGE STATISTICS');
console.log('═'.repeat(100));
console.log(`Total Products Sitewide: ${products.length}`);
console.log(`Products with 2+ Images: ${products.length - allWithMissingImages.length}`);
console.log(`Products with < 2 Images: ${allWithMissingImages.length}`);

if (allWithMissingImages.length > 0) {
  console.log('\nAll Products Missing Complete Images:');
  allWithMissingImages.forEach(p => {
    console.log(`  - ${p.id} (${Array.isArray(p.images) ? p.images.length : 0} image(s))`);
  });
}

// Final verdict
const allPass = categoriesPass === categoriesTested && productsWithMissingImages.length === 0;
console.log('\n' + '═'.repeat(100));
if (allPass) {
  console.log('✓ ALL CHECKS PASSED - Image rule implemented correctly across all categories!');
  process.exit(0);
} else {
  if (categoriesPass < categoriesTested) {
    console.log(`✗ Some categories have issues. ${categoriesTested - categoriesPass} categories failed.`);
  }
  if (productsWithMissingImages.length > 0) {
    console.log(`✗ ${productsWithMissingImages.length} products need attention (missing images).`);
  }
  process.exit(1);
}
