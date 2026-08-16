const fs = require('fs');
const path = require('path');

const productsFile = path.resolve(__dirname, '..', 'assets', 'js', 'products-data.js');

// Load products data
const text = fs.readFileSync(productsFile, 'utf8');
const match = text.match(/window\.productsData\s*=\s*(\[[\s\S]*\]);?\s*$/);
if (!match) {
  console.error('Could not find window.productsData in products-data.js');
  process.exit(1);
}

let products = JSON.parse(match[1]);

// Function to generate SEO tags
function generateSeo(product) {
  if (product.seo) return; // Already has SEO tags

  const name = product.name || 'Product';
  const brand = 'Fitting Club';
  const group = product.group ? product.group.replace(/-/g, ' ') : 'Sportswear';
  const description = typeof product.description === 'string' ? product.description : '';

  // Generate metaTitle: "{name} | {brand} – Premium {group}"
  const metaTitle = `${name} | ${brand}`;

  // Generate metaDescription: First 150-160 chars of description, trimmed at word boundary
  let metaDescription = description
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !/^(seo title|product description|key features|specifications|image alt text)$/i.test(line))
    .join(' ')
    .substring(0, 160);

  // Trim at word boundary
  const lastSpace = metaDescription.lastIndexOf(' ');
  if (lastSpace > 0 && metaDescription.length === 160) {
    metaDescription = metaDescription.substring(0, lastSpace);
  }
  metaDescription = metaDescription.trim();

  if (!metaDescription) {
    metaDescription = `Premium ${name} - ${group} products manufactured in Sialkot, Pakistan.`;
  }

  // Generate imageAlt: "{product name} - {category} manufactured in Sialkot"
  const imageAlt = `${name} - ${group} manufactured in Sialkot`;

  product.seo = {
    metaTitle,
    metaDescription,
    keywords: [
      name.toLowerCase(),
      product.item || '',
      group.toLowerCase(),
      'fitting club',
      'sialkot'
    ].filter(Boolean),
    imageAlt
  };
}

// Backfill SEO tags (also fix incomplete/placeholder SEO objects)
let updateCount = 0;
products.forEach(product => {
  if (!product) return;
  
  // Check if SEO is missing, incomplete (missing imageAlt), or has placeholder values
  const hasSeo = product.seo && typeof product.seo === 'object';
  const hasAllFields = hasSeo && product.seo.metaTitle && product.seo.metaDescription && product.seo.imageAlt;
  const hasPlaceholders = hasSeo && (
    product.seo.metaTitle === 'SEO Title' || 
    product.seo.metaDescription === 'SEO Description' ||
    (Array.isArray(product.seo.keywords) && product.seo.keywords[0] === 'SEO Keywords')
  );
  
  if (!hasAllFields || hasPlaceholders) {
    generateSeo(product);
    updateCount++;
    if (updateCount <= 5 || product.id.includes('boxing-gloves')) {
      console.log(`Generating SEO for: ${product.id}`);
    }
  }
});
console.log(`\nTotal products regenerated: ${updateCount}`);

// Write back to file
const fileContent = `window.productsData = ${JSON.stringify(products, null, 2)};\n`;
fs.writeFileSync(productsFile, fileContent, 'utf8');

// Verify
const roundTrip = fs.readFileSync(productsFile, 'utf8');
const verifyMatch = roundTrip.match(/window\.productsData\s*=\s*(\[[\s\S]*\]);?\s*$/);
if (!verifyMatch) {
  console.error('Verification failed: Could not find window.productsData after writing');
  process.exit(1);
}

const verified = JSON.parse(verifyMatch[1]);
const stillMissing = verified.filter(p => !p.seo);

console.log('✓ Backfilled SEO tags successfully');
console.log(`  Products processed: ${products.length}`);
console.log(`  Products now with SEO tags: ${products.filter(p => p.seo).length}`);
console.log(`  Products still missing SEO: ${stillMissing.length}`);

if (stillMissing.length > 0) {
  console.log('\n  Still missing SEO tags:');
  stillMissing.slice(0, 5).forEach(p => console.log(`    - ${p.id}`));
}

process.exit(0);
