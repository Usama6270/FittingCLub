const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..');
const downloadsRoot = 'C:\\Users\\dell\\Downloads';
const outputDataFile = path.join(projectRoot, 'assets', 'js', 'products-data.js');

const CATEGORY_CONFIGS = [
  {
    label: 'Shorts',
    folder: 'Shorts',
    group: 'fashionwear',
    subgroup: null,
    item: 'shorts',
    imageDir: 'shorts',
    seoCategoryName: 'shorts',
  },
  {
    label: 'Tshirts',
    folder: 'tshirts',
    group: 'fashionwear',
    subgroup: null,
    item: 'tshirts',
    imageDir: 'tshirts',
    seoCategoryName: 't-shirt',
  },
  {
    label: 'Sweatshirt',
    folder: 'Sweatshirt',
    group: 'fashionwear',
    subgroup: null,
    item: 'sweatshirts',
    imageDir: 'sweatshirts',
    seoCategoryName: 'sweatshirt',
  },
  {
    label: 'Polo Shirts',
    folder: 'polo shirts',
    group: 'fashionwear',
    subgroup: null,
    item: 'polo-shirts',
    imageDir: 'polo-shirts',
    seoCategoryName: 'polo shirt',
  },
  {
    label: 'Windbreaker Suit',
    folder: 'Windbreaker Suit',
    group: 'fashionwear',
    subgroup: null,
    item: 'windbreaker-suits',
    imageDir: 'windbreaker-suits',
    seoCategoryName: 'windbreaker suit',
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

function summarizeDescription(rawText, title) {
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
  return selected.length > 780 ? selected.slice(0, 777).trimEnd() + '...' : selected;
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

  let match = cleanName.match(/^(\d+)\.\s*(.+)$/);
  if (match) {
    return { order: parseInt(match[1], 10), title: match[2].trim() };
  }

  match = cleanName.match(/^(?:Kit\s*)?(\d+)\s*[–\-—]\s*(.+)$/i);
  if (match) {
    return { order: parseInt(match[1], 10), title: match[2].trim() };
  }

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

  const outerEntries = fs.readdirSync(outer, { withFileTypes: true });
  const subdirs = outerEntries.filter(e => e.isDirectory()).map(e => e.name);
  const sameNameInner = subdirs.find(d => d.toLowerCase() === categoryFolder.toLowerCase());
  const firstInner = sameNameInner || subdirs.find(d => {
    const innerPath = path.join(outer, d);
    const innerEntries = fs.readdirSync(innerPath, { withFileTypes: true });
    return innerEntries.length > 0 && innerEntries.some(e => e.isDirectory());
  });
  if (firstInner) {
    return path.join(outer, firstInner);
  }
  return outer;
}

function trimToWordBoundary(text, maxLen) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  const trimmed = text.slice(0, maxLen);
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace > maxLen * 0.7) {
    return trimmed.slice(0, lastSpace).trim();
  }
  return trimmed.trim();
}

function makeUniqueSlug(baseSlug, order, usedSlugs) {
  let slug = baseSlug;
  if (!usedSlugs.has(slug)) {
    usedSlugs.add(slug);
    return slug;
  }
  const orderSuffix = String(order).padStart(2, '0');
  slug = `${baseSlug}-${orderSuffix}`;
  if (!usedSlugs.has(slug)) {
    usedSlugs.add(slug);
    return slug;
  }
  let counter = 1;
  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${orderSuffix}-${counter}`;
    counter += 1;
  }
  usedSlugs.add(slug);
  return slug;
}

function buildSeo(productName, description, seoCategoryName, itemSlug, productSlug) {
  const metaTitle = `${productName} | Fitting Club – Sialkot Sports Goods Manufacturer`;
  const metaDescription = trimToWordBoundary(description, 158) || `${productName} - premium ${seoCategoryName} manufactured in Sialkot by Fitting Club.`;
  const imageAlt = `${productName} - Fitting Club premium ${seoCategoryName} manufactured in Sialkot`;
  const keywords = [
    productSlug.replace(/-/g, ' '),
    itemSlug,
    'fashionwear',
    'fitting club',
    'sialkot',
  ];
  return { metaTitle, metaDescription, imageAlt, keywords };
}

async function processCategory(config) {
  const { label, folder, group, subgroup, item, imageDir, seoCategoryName } = config;
  const sourceRoot = findProductSourceRoot(folder);
  const outputImagesRoot = path.join(projectRoot, 'assets', 'images', 'products', imageDir);

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

  const usedSlugs = new Set();
  const products = [];
  let optimizedImageCount = 0;

  for (const entry of folders) {
    const { folderName, parsed } = entry;
    const kitDir = path.join(sourceRoot, folderName);
    let files;
    try {
      files = discoverFiles(kitDir);
    } catch (err) {
      warnings.push(`[${label}] ${folderName}: cannot read folder - ${err.message}`);
      continue;
    }

    const docxFiles = files.filter(file => path.extname(file).toLowerCase() === '.docx');
    const imageFiles = files.filter(file => ['.jpg', '.jpeg', '.png'].includes(path.extname(file).toLowerCase()));

    if (docxFiles.length === 0) {
      warnings.push(`[${label}] ${folderName}: no .docx description file found`);
    }
    if (imageFiles.length < 2) {
      warnings.push(`[${label}] ${folderName}: expected 2+ images, found ${imageFiles.length}`);
    }
    if (imageFiles.length < 1) {
      warnings.push(`[${label}] ${folderName}: no images found, skipping`);
      continue;
    }

    const docxName = docxFiles[0];
    let rawDescription = '';
    if (docxName) {
      try {
        rawDescription = await readDescription(path.join(kitDir, docxName));
      } catch (err) {
        warnings.push(`[${label}] ${folderName}: failed to read docx - ${err.message}`);
      }
    }
    const description = summarizeDescription(rawDescription, parsed.title);

    const sortedImages = imageFiles.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );

    const baseSlug = slugify(parsed.title);
    const productSlug = makeUniqueSlug(baseSlug, parsed.order, usedSlugs);

    const outputKitDir = path.join(outputImagesRoot, productSlug);
    ensureDir(outputKitDir);

    const outputImages = [];
    const processedCount = Math.min(sortedImages.length, 2);
    for (let i = 0; i < processedCount; i += 1) {
      const fileName = sortedImages[i];
      const inputPath = path.join(kitDir, fileName);
      const outputPath = path.join(outputKitDir, `image-${i + 1}.jpg`);
      try {
        await optimizeImage(inputPath, outputPath);
        optimizedImageCount += 1;
        outputImages.push(path.posix.join('/assets/images/products', imageDir, productSlug, `image-${i + 1}.jpg`));
      } catch (err) {
        warnings.push(`[${label}] ${folderName}: failed to optimize ${fileName} - ${err.message}`);
      }
    }

    if (outputImages.length === 0) {
      warnings.push(`[${label}] ${folderName}: no images could be processed, skipping product`);
      continue;
    }

    const thumbnail = outputImages[1] || outputImages[0] || '';
    const seo = buildSeo(parsed.title, description, seoCategoryName, item, productSlug);

    products.push({
      id: productSlug,
      name: parsed.title,
      description,
      group,
      item,
      subgroup,
      images: outputImages,
      thumbnail,
      seo,
    });
  }

  return {
    label,
    item,
    found: folders.length,
    processed: products.length,
    imagesOptimized: optimizedImageCount,
    warnings,
    products,
  };
}

function loadExistingProducts() {
  if (!fs.existsSync(outputDataFile)) return [];
  const existingText = fs.readFileSync(outputDataFile, 'utf8');
  const match = existingText.match(/window\.productsData\s*=\s*(\[.*\]);?\s*$/s);
  if (!match) {
    console.error('ERROR: Cannot parse window.productsData from existing file');
    process.exit(1);
  }
  try {
    return JSON.parse(match[1]);
  } catch (err) {
    console.error('ERROR: JSON parse failed for existing products-data.js:', err.message);
    process.exit(1);
  }
}

function mergeProducts(existingProducts, categoryResults) {
  const importedItemSlugs = categoryResults.map(r => r.item);
  const legacyItemSlugsMap = {
    'tshirts': 't-shirts',
    'windbreaker-suits': 'windbreaker',
  };

  let filtered = existingProducts.filter(product => {
    if (!product || !product.item) return true;
    if (importedItemSlugs.includes(product.item)) return false;
    for (const newSlug of importedItemSlugs) {
      const legacy = legacyItemSlugsMap[newSlug];
      if (legacy && product.item === legacy) return false;
    }
    return true;
  });

  const allNewProducts = [];
  for (const result of categoryResults) {
    allNewProducts.push(...result.products);
  }

  const newProductIds = new Set(allNewProducts.map(p => p.id));
  filtered = filtered.filter(p => !newProductIds.has(p.id));

  return filtered.concat(allNewProducts);
}

async function main() {
  console.log('========================================');
  console.log('WORKSPACE SCAN');
  console.log('----------------------------------------');
  const preScan = [];
  for (const config of CATEGORY_CONFIGS) {
    const sourceRoot = findProductSourceRoot(config.folder);
    let count = 0;
    if (sourceRoot && fs.existsSync(sourceRoot)) {
      count = fs.readdirSync(sourceRoot, { withFileTypes: true })
        .filter(e => e.isDirectory()).length;
    }
    preScan.push({ label: config.label, count });
    console.log(`${config.label}: ${count} product folders`);
  }

  console.log('\nStarting Fashionwear 5-categories import...\n');

  const results = [];
  const allWarnings = [];

  for (const config of CATEGORY_CONFIGS) {
    console.log(`→ Processing: ${config.label} (item=${config.item})`);
    const result = await processCategory(config);
    results.push(result);
    allWarnings.push(...result.warnings);
    console.log(`  ↳ ${result.processed}/${result.found} products, ${result.imagesOptimized} images optimized, ${result.warnings.length} warnings`);
  }

  console.log('\nMerging into products-data.js (preserving existing categories)...');

  const existingProducts = loadExistingProducts();
  console.log(`Existing products loaded: ${existingProducts.length}`);

  const mergedProducts = mergeProducts(existingProducts, results);
  console.log(`Merged total: ${mergedProducts.length} products`);

  const fileContent = `window.productsData = ${JSON.stringify(mergedProducts, null, 2)};\n`;
  ensureDir(path.dirname(outputDataFile));
  fs.writeFileSync(outputDataFile, fileContent, 'utf8');

  try {
    const roundTrip = fs.readFileSync(outputDataFile, 'utf8');
    const matchBack = roundTrip.match(/window\.productsData\s*=\s*(\[.*\]);?\s*$/s);
    if (!matchBack) throw new Error('File missing window.productsData assignment');
    const parsed = JSON.parse(matchBack[1]);

    const ids = new Set();
    let dupIds = 0;
    for (const p of parsed) {
      if (ids.has(p.id)) dupIds += 1;
      ids.add(p.id);
    }
    console.log(`✓ products-data.js syntax validated. Products: ${parsed.length}, Duplicate IDs: ${dupIds}`);
  } catch (error) {
    console.error('ERROR: merged products-data.js is invalid:', error.message);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(80));
  console.log('WORKSPACE SCAN');
  console.log('-'.repeat(80));
  for (const s of preScan) {
    console.log(`${s.label}: ${s.count} product folders`);
  }
  console.log('\nIMPORT RESULTS');
  console.log('-'.repeat(80));
  let totalProcessed = 0;
  let totalFound = 0;
  let totalImages = 0;
  for (const result of results) {
    totalProcessed += result.processed;
    totalFound += result.found;
    totalImages += result.imagesOptimized;
    console.log(`${result.label}: ${result.processed}/${result.found} products processed, ${result.imagesOptimized} images optimized, ${result.warnings.length} warnings`);
  }
  console.log('\nTOTAL');
  console.log('-'.repeat(80));
  console.log(`Products processed: ${totalProcessed}/${totalFound}`);
  console.log(`Images optimized: ${totalImages}`);
  console.log(`Warnings: ${allWarnings.length}`);
  console.log(`TOTAL PRODUCTS ACROSS ALL CATEGORIES: ${mergedProducts.length}`);
  console.log('='.repeat(80));

  if (allWarnings.length) {
    console.log('\nWarnings:');
    allWarnings.forEach(w => console.log(`  - ${w}`));
  }
}

main().catch(error => {
  console.error('\n❌ Fashionwear import FAILED:');
  console.error(error.stack || error.message || error);
  process.exit(1);
});
