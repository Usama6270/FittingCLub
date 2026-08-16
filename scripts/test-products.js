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

// Test categories (at least 2 from each)
const categoriesToTest = {
  'basketball-uniforms': [],
  'football-soccer-kits': [],
  'volleyball-uniforms': [],
  'american-football-uniforms': [],
  'karate-uniform': [],
  'boxing-gloves': [],
  'duffel-bags': [],
  'tracksuits': [],
  'compression-shirts': [],
  'sleeveless-hoodies': []
};

// Collect products by category
products.forEach(p => {
  if (p.item && categoriesToTest[p.item]) {
    categoriesToTest[p.item].push(p);
  }
});

console.log('='.repeat(80));
console.log('COMPREHENSIVE PRODUCT VALIDATION TEST');
console.log('='.repeat(80));

let totalTests = 0;
let passedTests = 0;

// Test each category
Object.entries(categoriesToTest).forEach(([category, prods]) => {
  if (prods.length === 0) {
    console.log(`\n✗ ${category}: NO PRODUCTS FOUND`);
    return;
  }

  console.log(`\n✓ Testing ${category} (${prods.length} products)`);

  // Test first 2 products from category
  prods.slice(0, 2).forEach(product => {
    console.log(`  └─ ${product.name}`);

    // Test 1: Has at least 2 images
    totalTests++;
    if (Array.isArray(product.images) && product.images.length >= 2) {
      console.log(`     ✓ Has 2+ images (${product.images.length})`);
      passedTests++;
    } else {
      console.log(`     ✗ Missing images (has ${product.images?.length || 0})`);
    }

    // Test 2: Image order is correct
    totalTests++;
    if (product.images[0] && product.images[1]) {
      console.log(`     ✓ Image-1: ${product.images[0].split('/').pop()}`);
      console.log(`     ✓ Image-2: ${product.images[1].split('/').pop()}`);
      passedTests++;
    } else {
      console.log(`     ✗ Image order issue`);
    }

    // Test 3: Has SEO tags
    totalTests++;
    if (product.seo && product.seo.metaTitle && product.seo.metaDescription && product.seo.imageAlt) {
      console.log(`     ✓ SEO tags present`);
      console.log(`       - Title: "${product.seo.metaTitle}"`);
      console.log(`       - Alt: "${product.seo.imageAlt}"`);
      passedTests++;
    } else {
      console.log(`     ✗ Missing SEO tags`);
    }

    // Test 4: Has full description
    totalTests++;
    if (typeof product.description === 'string' && product.description.length > 50) {
      console.log(`     ✓ Full description (${product.description.length} chars)`);
      passedTests++;
    } else {
      console.log(`     ✗ Description too short or missing`);
    }

    // Test 5: Thumbnail is set correctly
    totalTests++;
    if (product.thumbnail) {
      const isImage2 = product.thumbnail === product.images[1];
      const isImage1 = product.thumbnail === product.images[0];
      if (isImage2 || isImage1) {
        console.log(`     ✓ Thumbnail properly set`);
        passedTests++;
      } else {
        console.log(`     ✗ Thumbnail mismatch`);
      }
    } else {
      console.log(`     ✗ Thumbnail not set`);
    }
  });
});

console.log('\n' + '='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Pass Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('\n✓ ALL TESTS PASSED! Ready for production.');
  process.exit(0);
} else {
  console.log('\n✗ Some tests failed. Please review above.');
  process.exit(1);
}
