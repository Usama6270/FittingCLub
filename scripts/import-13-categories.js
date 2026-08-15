const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..');
const downloadsRoot = 'C:\\Users\\dell\\Downloads';
const outputDataFile = path.join(projectRoot, 'assets', 'js', 'products-data.js');

const CATEGORY_CONFIGS = [
  {
    label: 'Sweatshirt',
    folder: 'Sweatshirt',
    group: 'fashionwear',
    subgroup: null,
    item: 'sweatshirts',
    seoSentence: (title) => `${title} is a premium sweatshirt crafted for everyday wear, layering, and casual athletic style, combining soft fleece fabric, a relaxed tailored fit, and modern streetwear aesthetics.`,
  },
  {
    label: 'Tshirts',
    folder: 'tshirts',
    group: 'fashionwear',
    subgroup: null,
    item: 't-shirts',
    seoSentence: (title) => `${title} is a premium cotton T-shirt built for everyday comfort, team outfitting, and custom branding, combining breathable fabric, a flattering athletic cut, and durable long-lasting construction.`,
  },
  {
    label: 'Windbreaker Suit',
    folder: 'Windbreaker Suit',
    group: 'fashionwear',
    subgroup: null,
    item: 'windbreaker',
    seoSentence: (title) => `${title} is a premium windbreaker engineered for outdoor training, travel, and all-weather casual wear, combining water-resistant fabric, breathable ventilation, and a sleek modern silhouette.`,
  },
  {
    label: 'Shorts',
    folder: 'Shorts',
    group: 'fashionwear',
    subgroup: null,
    item: 'shorts',
    seoSentence: (title) => `${title} is premium fashion shorts designed for casual wear, warm-weather outings, and relaxed athletic style, combining lightweight fabric, a comfortable tailored fit, and versatile modern styling.`,
  },
  {
    label: 'Polo Shirts',
    folder: 'polo shirts',
    group: 'fashionwear',
    subgroup: null,
    item: 'polo-shirts',
    seoSentence: (title) => `${title} is a premium polo shirt crafted for smart-casual wear, team uniforms, and branded apparel, combining soft pique cotton, a classic tailored fit, and polished lasting quality.`,
  },
  {
    label: 'Performance Sleeveless Hoodie',
    folder: 'Performance Sleeveless Hoodie',
    group: 'gymwear',
    subgroup: 'mens-gymwear',
    item: 'sleeveless-hoodies',
    seoSentence: (title) => `${title} is a premium men's sleeveless gym hoodie engineered for strength training, bodybuilding, and intense workouts, combining performance stretch fabric, muscle-friendly mobility, and modern athletic styling.`,
  },
  {
    label: 'Performance T-Shirt',
    folder: 'Performance T-Shirt',
    group: 'gymwear',
    subgroup: 'mens-gymwear',
    item: 'performance-t-shirts',
    seoSentence: (title) => `${title} is a premium men's performance gym T-shirt designed for intense training, lifting, and cardio, combining moisture-wicking fabric, a muscular athletic fit, and breathable lasting comfort.`,
  },
  {
    label: 'Performance Compression Shirt',
    folder: 'Performance Compression Shirt',
    group: 'gymwear',
    subgroup: 'mens-gymwear',
    item: 'compression-shirts',
    seoSentence: (title) => `${title} is a premium men's compression shirt engineered for lifting, training, and recovery, combining graduated compressive fabric, muscle-supporting paneling, and breathable four-way stretch.`,
  },
  {
    label: 'Performance Compression Shorts',
    folder: 'Performance Compression Shorts',
    group: 'gymwear',
    subgroup: 'mens-gymwear',
    item: 'compression-shorts-men',
    seoSentence: (title) => `${title} is premium men's compression gym shorts designed for lifting, sprinting, and cross-training, combining supportive compressive fabric, unrestricted mobility, and moisture-wicking performance.`,
  },
  {
    label: 'Performance Gym Bra',
    folder: 'Performance Gym Bra',
    group: 'gymwear',
    subgroup: 'womens-gymwear',
    item: 'sports-bras',
    seoSentence: (title) => `${title} is a premium women's sports bra engineered for gym workouts, running, and high-impact training, combining medium-to-high support, breathable quick-dry fabric, and a flattering comfort fit.`,
  },
  {
    label: 'Ladies Crop Top',
    folder: 'Ladies crop top',
    group: 'gymwear',
    subgroup: 'womens-gymwear',
    item: 'crop-tops',
    seoSentence: (title) => `${title} is a premium women's gym crop top designed for training, studio classes, and athletic casual wear, combining soft stretch fabric, a flattering cropped fit, and modern activewear styling.`,
  },
  {
    label: 'Ladies gym leggings',
    folder: 'Ladies gym leggings',
    group: 'gymwear',
    subgroup: 'womens-gymwear',
    item: 'leggings',
    seoSentence: (title) => `${title} is premium women's gym leggings engineered for training, yoga, and all-day athletic wear, combining squat-proof compressive fabric, a flattering high-waist fit, and breathable four-way stretch.`,
  },
  {
    label: 'Ladies training jacket',
    folder: 'Ladies training jacket',
    group: 'gymwear',
    subgroup: 'womens-gymwear',
    item: 'training-jackets',
    seoSentence: (title) => `${title} is a premium women's training jacket crafted for warm-ups, gym-to-street wear, and layering, combining lightweight performance fabric, a tailored feminine fit, and sleek modern styling.`,
  },
];

function normalizeText(value) {
  return String(value || '')
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

function summarizeDescription(rawText, title, seoSentenceFn) {
  const lines = String(rawText || '')
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const startIndex = lines.findIndex(line => /^product description$/i.test(line));
  const productBlockStart = startIndex >= 0 ? startIndex + 1 : 0;
  const endMarkers = /^(key features|specifications|image alt text|focus keyword|seo tags|product categories|suggested h1 heading|suggested h2 headings|suggested seo keywords)$/i;

  const descriptionLines = [];
  for (let i = productBlockStart; i < lines.length; i += 1) {
    const line = lines[i];
    if (endMarkers.test(line)) break;
    if (line === title) continue;
    if (/^kit\s*\d+/i.test(line)) continue;
    if (/^\d+\s*[–\-—]\s*.+/.test(line)) continue;
    if (/^seo title$/i.test(line)) continue;
    descriptionLines.push(line);
  }

  const joined = descriptionLines.join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const base = joined || title;

  const sentences = base.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [base];
  const selected = sentences.slice(0, 4).join(' ').trim();

  const seoSentence = seoSentenceFn ? seoSentenceFn(title) : '';
  const summary = (selected + ' ' + seoSentence).replace(/\s+/g, ' ').trim();
  return summary.length > 780 ? summary.slice(0, 777).trimEnd() + '...' : summary;
}

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'product';
}

function parseKitFolderName(folderName) {
  const cleanName = folderName.trim();

  // Pattern 1: "##. Title" (number with dot separator)
  let match = cleanName.match(/^(\d+)\.\s*(.+)$/);
  if (match) {
    return { order: parseInt(match[1], 10), title: match[2].trim() };
  }

  // Pattern 2: "Kit ## – Title" or "## – Title"
  match = cleanName.match(/^(?:Kit\s*)?(\d+)\s*[–\-—]\s*(.+)$/i);
  if (match) {
    return { order: parseInt(match[1], 10), title: match[2].trim() };
  }

  // Pattern 3: "[Name with spaces] ##"
  match = cleanName.match(/^(.+?)\s*(\d+)$/);
  if (match) {
    return { order: parseInt(match[2], 10), title: cleanName.trim() };
  }

  return { order: 0, title: cleanName };
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function readDescription(docxPath) {
  const result = await mammoth.extractRawText({ path: docxPath });
  return normalizeText(result.value);
}

async function optimizeImage(inputPath, outputPath) {
  ensureDir(path.dirname(outputPath));
  await sharp(inputPath)
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(outputPath);
}

function discoverFiles(dirPath) {
  return fs.readdirSync(dirPath, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => entry.name);
}

function findProductSourceRoot(categoryFolder) {
  const outer = path.join(downloadsRoot, categoryFolder);
  if (!fs.existsSync(outer)) return null;

  // Double-nested pattern: Downloads/Folder/Folder/products
  const outerEntries = fs.readdirSync(outer, { withFileTypes: true });
  const subdirs = outerEntries.filter(e => e.isDirectory()).map(e => e.name);
  // Look for inner folder with same (case-insensitive) name as outer folder, or first non-empty subdir
  const sameNameInner = subdirs.find(d => d.toLowerCase() === categoryFolder.toLowerCase());
  const firstInner = sameNameInner || subdirs.find(d => {
    const innerPath = path.join(outer, d);
    const innerEntries = fs.readdirSync(innerPath, { withFileTypes: true });
    return innerEntries.length > 0 && innerEntries.some(e => e.isDirectory());
  });
  if (firstInner) {
    return path.join(outer, firstInner);
  }
  // Fallback: return outer itself
  return outer;
}

async function processCategory(config) {
  const { label, folder, group, subgroup, item, seoSentence } = config;
  const sourceRoot = findProductSourceRoot(folder);
  const outputImagesRoot = path.join(projectRoot, 'assets', 'images', 'products', item);

  const warnings = [];
  if (!sourceRoot || !fs.existsSync(sourceRoot)) {
    warnings.push(`Source root not found for ${label} (expected in Downloads/${folder})`);
    return { label, item, found: 0, processed: 0, imagesOptimized: 0, warnings, products: [] };
  }

  const folders = fs.readdirSync(sourceRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .map(folderName => ({ folderName, parsed: parseKitFolderName(folderName) }))
    .filter(entry => entry.parsed)
    .sort((a, b) => a.parsed.order - b.parsed.order);

  const products = [];
  let optimizedImageCount = 0;

  for (const entry of folders) {
    const { folderName, parsed } = entry;
    const kitDir = path.join(sourceRoot, folderName);
    const files = discoverFiles(kitDir);
    const docxFiles = files.filter(file => path.extname(file).toLowerCase() === '.docx');
    const imageFiles = files.filter(file => ['.jpg', '.jpeg', '.png'].includes(path.extname(file).toLowerCase()));

    if (docxFiles.length !== 1) {
      warnings.push(`[${label}] ${folderName}: expected 1 .docx, found ${docxFiles.length}`);
    }
    if (imageFiles.length < 1) {
      warnings.push(`[${label}] ${folderName}: no images found, skipping`);
      continue;
    }

    const docxName = docxFiles[0];
    const rawDescription = docxName ? await readDescription(path.join(kitDir, docxName)) : '';
    const description = summarizeDescription(rawDescription, parsed.title, seoSentence);
    const sortedImages = imageFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    const productSlug = slugify(parsed.title);
    const outputKitDir = path.join(outputImagesRoot, productSlug);
    ensureDir(outputKitDir);

    const outputImages = [];
    for (let i = 0; i < sortedImages.length; i += 1) {
      const fileName = sortedImages[i];
      const inputPath = path.join(kitDir, fileName);
      const outputPath = path.join(outputKitDir, `image-${i + 1}.jpg`);
      await optimizeImage(inputPath, outputPath);
      optimizedImageCount += 1;
      outputImages.push(path.posix.join('/assets/images/products', item, productSlug, `image-${i + 1}.jpg`));
    }

    // Thumbnail strategy: default = images[1] (like basketball), tracksuits/duffel use images[0]
    const isUseFirstThumb = item === 'tracksuits' || item === 'duffel-bags';
    const isKarateKit = item === 'karate-uniform';
    let thumbnail;
    if (isUseFirstThumb) thumbnail = outputImages[0] || outputImages[1] || '';
    else if (isKarateKit) thumbnail = outputImages[0] || outputImages[1] || '';
    else thumbnail = outputImages[1] || outputImages[0] || '';

    products.push({
      id: productSlug,
      name: parsed.title,
      description,
      group,
      item,
      subgroup,
      images: outputImages,
      thumbnail,
      kitNumber: parsed.order,
    });
  }

  products.sort((a, b) => a.kitNumber - b.kitNumber);
  return {
    label,
    item,
    found: folders.length,
    processed: products.length,
    imagesOptimized: optimizedImageCount,
    warnings,
    products: products.map(({ kitNumber, ...rest }) => rest),
  };
}

async function main() {
  const results = [];
  const allWarnings = [];

  console.log('Starting batch import of 13 categories...\n');

  for (const config of CATEGORY_CONFIGS) {
    console.log(`→ Processing: ${config.label} (group=${config.group}, subgroup=${config.subgroup}, item=${config.item})`);
    const result = await processCategory(config);
    results.push(result);
    allWarnings.push(...result.warnings);
    console.log(`  ↳ ${result.processed}/${result.found} products, ${result.imagesOptimized} images optimized, ${result.warnings.length} warnings`);
  }

  console.log('\nMerging into products-data.js...');

  let existingProducts = [];
  if (fs.existsSync(outputDataFile)) {
    try {
      const existingText = fs.readFileSync(outputDataFile, 'utf8');
      const match = existingText.match(/window\.productsData\s*=\s*(\[.*\]);?\s*$/s);
      if (match) {
        existingProducts = JSON.parse(match[1]);
      }
    } catch (error) {
      console.error('⚠ ERROR reading existing products-data.js:', error.message);
      process.exit(1);
    }
  }

  const importedItemSlugs = results.map(r => r.item);
  let mergedProducts = existingProducts.filter(product => {
    if (!product || !product.item) return true;
    return !importedItemSlugs.includes(product.item);
  });

  for (const result of results) {
    mergedProducts = mergedProducts.concat(result.products);
  }

  const fileContent = `window.productsData = ${JSON.stringify(mergedProducts, null, 2)};\n`;
  ensureDir(path.dirname(outputDataFile));
  fs.writeFileSync(outputDataFile, fileContent, 'utf8');

  // Validation: parse back file to ensure no syntax issues
  try {
    const roundTrip = fs.readFileSync(outputDataFile, 'utf8');
    const matchBack = roundTrip.match(/window\.productsData\s*=\s*(\[.*\]);?\s*$/s);
    if (!matchBack) throw new Error('File missing window.productsData assignment');
    JSON.parse(matchBack[1]);
    console.log('✓ products-data.js syntax validated successfully');
  } catch (error) {
    console.error('⚠ ERROR: merged products-data.js is invalid:', error.message);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(80));
  console.log('FINAL SUMMARY - 13 CATEGORIES BATCH IMPORT');
  console.log('='.repeat(80));
  let totalProcessed = 0;
  let totalFound = 0;
  let totalImages = 0;
  for (const result of results) {
    totalProcessed += result.processed;
    totalFound += result.found;
    totalImages += result.imagesOptimized;
    console.log(`${result.label}: ${result.processed}/${result.found} processed, ${result.imagesOptimized} images optimized, ${result.warnings.length} warnings`);
  }
  console.log('-'.repeat(80));
  console.log(`TOTAL: ${totalProcessed}/${totalFound} products, ${totalImages} images optimized, ${allWarnings.length} total warnings`);
  console.log(`TOTAL products ALL CATEGORIES combined: ${mergedProducts.length}`);
  console.log('='.repeat(80));

  if (allWarnings.length) {
    console.log('\nWarnings:');
    allWarnings.forEach(w => console.log(`  - ${w}`));
  }
}

main().catch(error => {
  console.error('\n❌ Batch import FAILED:');
  console.error(error.stack || error.message || error);
  process.exit(1);
});
