const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..');
const downloadsRoot = 'C:\\Users\\dell\\Downloads';
const outputDataFile = path.join(projectRoot, 'assets', 'js', 'products-data.js');

// ──────────────────────────────────────────────────────────────────────────────
// Category configurations for the 9 new categories
// ──────────────────────────────────────────────────────────────────────────────
const CATEGORY_CONFIGS = [
  {
    label: 'Premium Boxing Gloves',
    folder: 'Premium Boxing Gloves',
    group: 'martial-arts',
    subgroup: null,
    item: 'boxing-gloves',
    seoSentence: (title) =>
      `${title} is a premium pair of boxing gloves engineered for sparring, heavy bag training, and competitive fighting, combining multi-layered foam padding, durable synthetic leather, and an anatomical wrist-support design for maximum protection and performance.`,
  },
  {
    label: 'MMA Gloves',
    folder: 'MMA Gloves',
    group: 'martial-arts',
    subgroup: null,
    item: 'mma-gloves',
    seoSentence: (title) =>
      `${title} is professional MMA gloves designed for mixed martial arts training, grappling, and cage sparring, combining open-finger flexibility, reinforced knuckle padding, and a secure hook-and-loop wrist wrap for unrestricted movement and full-contact protection.`,
  },
  {
    label: 'Shin Guards',
    folder: 'Shin Guards',
    group: 'martial-arts',
    subgroup: null,
    item: 'shin-guards',
    seoSentence: (title) =>
      `${title} is premium martial arts shin guards built for Muay Thai, kickboxing, and sparring, combining high-density impact foam, durable outer shell construction, and a secure strap system for full shin and instep protection during training.`,
  },
  {
    label: 'Fight Pro Head Guard',
    folder: 'Fight Pro Head Guard',
    group: 'martial-arts',
    subgroup: null,
    item: 'head-guards',
    seoSentence: (title) =>
      `${title} is a professional fight head guard engineered for boxing, Muay Thai, and contact sports sparring, combining multi-layer shock-absorbing foam, full cheek and temple protection, and a secure adjustable chin strap for reliable impact defence.`,
  },
  {
    label: 'Hand Wraps',
    folder: 'Hand Wraps',
    group: 'martial-arts',
    subgroup: null,
    item: 'hand-wraps',
    seoSentence: (title) =>
      `${title} is professional hand wraps designed for boxing, kickboxing, and combat sports training, combining elastic stretch fabric, wrist and knuckle support reinforcement, and a hook-and-loop closure for a secure custom fit under gloves.`,
  },
  {
    label: 'Pro Focus Mitts',
    folder: 'Pro Focus Mitts',
    group: 'martial-arts',
    subgroup: null,
    item: 'focus-mitts',
    seoSentence: (title) =>
      `${title} is professional focus mitts engineered for boxing pad work, combination drilling, and coach-assisted training, combining reinforced strike zone padding, a curved ergonomic grip panel, and durable stitched leather construction for precision coaching sessions.`,
  },
  {
    label: 'Pro Boxing Shorts',
    folder: 'Pro Boxing Shorts',
    group: 'boxing',
    subgroup: null,
    item: 'boxing-shorts',
    seoSentence: (title) =>
      `${title} is professional boxing shorts designed for ring competition, sparring sessions, and fight camp training, combining lightweight satin fabric, an elastic waistband with drawstring adjustment, and a wide-leg cut for unrestricted footwork and movement.`,
  },
  {
    label: 'Fashion Wear Jacket',
    folder: 'Fashion Wear Jacket',
    group: 'fashionwear',
    subgroup: null,
    item: 'jackets',
    seoSentence: (title) =>
      `${title} is a premium fashion jacket crafted for streetwear styling, casual outings, and smart layering, combining quality outer fabric, a tailored modern silhouette, and versatile styling details that transition effortlessly from day to evening wear.`,
  },
  {
    label: 'Fashion Hoodies',
    folder: 'Fashion Hoodies',
    group: 'fashionwear',
    subgroup: null,
    item: 'hoodies',
    seoSentence: (title) =>
      `${title} is a premium fashion hoodie engineered for everyday streetwear, casual layering, and relaxed comfort, combining heavyweight fleece fabric, a relaxed contemporary fit, and design-forward details that make it a wardrobe essential for modern style.`,
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Utility functions (reused pattern from import-13-categories.js)
// ──────────────────────────────────────────────────────────────────────────────

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
    .replace(/['']/g, '')
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

  // Pattern 3: "Name with spaces ## " – e.g. "Boxing Gloves 01", "Head Guard 01"
  match = cleanName.match(/^(.+?)\s+(\d+)$/);
  if (match) {
    return { order: parseInt(match[2], 10), title: cleanName.trim() };
  }

  // Pattern 4: "## Name" – e.g. "01 Fashion Hoodie"
  // Use FULL folder name as title to preserve uniqueness (number keeps them distinct)
  match = cleanName.match(/^(\d+)\s+(.+)$/);
  if (match) {
    return { order: parseInt(match[1], 10), title: cleanName.trim() };
  }

  return { order: 0, title: cleanName };
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function readDescription(docxPath) {
  try {
    const stat = fs.statSync(docxPath);
    if (stat.size < 4) return ''; // zero-byte or too small to be valid docx
    const result = await mammoth.extractRawText({ path: docxPath });
    return normalizeText(result.value);
  } catch (err) {
    // Corrupt or unreadable docx — return empty string
    return '';
  }
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

  // Look for inner folder with same (case-insensitive) name, or first non-empty subdir
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

// ──────────────────────────────────────────────────────────────────────────────
// SCAN: Report folder detection before importing
// ──────────────────────────────────────────────────────────────────────────────

function scanFolders() {
  console.log('='.repeat(80));
  console.log('PRE-IMPORT SCAN — Detecting all 9 source folders');
  console.log('='.repeat(80));

  const scanResults = [];

  for (const config of CATEGORY_CONFIGS) {
    const outer = path.join(downloadsRoot, config.folder);
    const exists = fs.existsSync(outer);
    const sourceRoot = exists ? findProductSourceRoot(config.folder) : null;

    let productCount = 0;
    let subfolders = [];
    if (sourceRoot && fs.existsSync(sourceRoot)) {
      subfolders = fs.readdirSync(sourceRoot, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => e.name);
      productCount = subfolders.length;
    }

    const status = exists ? '✓ FOUND' : '✗ MISSING';
    console.log(`\n${status}  ${config.label}`);
    console.log(`  Folder name (exact):  "${config.folder}"`);
    console.log(`  Source root resolved: ${sourceRoot || 'N/A'}`);
    console.log(`  Product folders:      ${productCount}`);
    if (subfolders.length) {
      subfolders.forEach(sf => console.log(`    - ${sf}`));
    }

    scanResults.push({ config, exists, sourceRoot, productCount });
  }

  const missing = scanResults.filter(r => !r.exists);
  console.log('\n' + '─'.repeat(80));
  if (missing.length === 0) {
    console.log('✓ All 9 folders detected. Proceeding with full import...\n');
  } else {
    console.log(`⚠ ${missing.length} folder(s) missing: ${missing.map(r => r.config.folder).join(', ')}`);
    console.log('  Missing folders will be skipped; all others will be imported.\n');
  }

  return scanResults;
}

// ──────────────────────────────────────────────────────────────────────────────
// Category processor
// ──────────────────────────────────────────────────────────────────────────────

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
    const imageFiles = files.filter(file =>
      ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file).toLowerCase())
    );

    if (docxFiles.length !== 1) {
      warnings.push(`[${label}] ${folderName}: expected 1 .docx, found ${docxFiles.length}`);
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
      } catch (docxErr) {
        warnings.push(`[${label}] ${folderName}: failed to read "${docxName}" — ${docxErr.message}`);
      }
    }
    const description = summarizeDescription(rawDescription, parsed.title, seoSentence);

    const sortedImages = imageFiles.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );

    const productSlug = slugify(parsed.title);
    const outputKitDir = path.join(outputImagesRoot, productSlug);
    ensureDir(outputKitDir);

    const outputImages = [];
    for (let i = 0; i < sortedImages.length; i += 1) {
      const fileName = sortedImages[i];
      const inputPath = path.join(kitDir, fileName);
      const outputPath = path.join(outputKitDir, `image-${i + 1}.jpg`);
      try {
        await optimizeImage(inputPath, outputPath);
        optimizedImageCount += 1;
        outputImages.push(
          path.posix.join('/assets/images/products', item, productSlug, `image-${i + 1}.jpg`)
        );
      } catch (imgErr) {
        warnings.push(`[${label}] ${folderName}: image "${fileName}" failed — ${imgErr.message}`);
      }
    }

    if (outputImages.length === 0) {
      warnings.push(`[${label}] ${folderName}: all images failed optimization, skipping product`);
      continue;
    }

    // Thumbnail: use second image if available (index 1), else first
    const thumbnail = outputImages[1] || outputImages[0] || '';

    // Generate SEO metadata from document text
    const rawLines = rawDescription.split('\n').filter(Boolean);
    const metaTitleRaw = rawLines.find(l => /^(seo title|meta title)/i.test(l));
    const metaDescRaw = rawLines.find(l => /^(seo description|meta description)/i.test(l));
    const keywordsRaw = rawLines.find(l => /^(seo keywords|keywords|focus keyword)/i.test(l));

    // Extract values after the label (e.g. "Meta Title: ...")
    const extractAfterColon = (line) =>
      line ? line.replace(/^[^:]+:\s*/i, '').trim() : '';

    // Build SEO metadata — use doc values if found, otherwise generate
    const metaTitle = extractAfterColon(metaTitleRaw) ||
      `${parsed.title} | Premium Combat Sports & Fitness Gear – Fitting Club`;
    const metaDescription = extractAfterColon(metaDescRaw) ||
      description.slice(0, 155).trimEnd() + (description.length > 155 ? '...' : '');
    const rawKeywords = extractAfterColon(keywordsRaw);
    const keywords = rawKeywords
      ? rawKeywords.split(/[,|;]+/).map(k => k.trim()).filter(Boolean)
      : [parsed.title.toLowerCase(), item.replace(/-/g, ' '), group, 'fitting club'];

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
      seo: {
        metaTitle,
        metaDescription,
        keywords,
      },
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

// ──────────────────────────────────────────────────────────────────────────────
// Main entry point
// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  // ── STEP 1: SCAN ────────────────────────────────────────────────────────────
  scanFolders();

  // ── STEP 2: IMPORT ──────────────────────────────────────────────────────────
  const results = [];
  const allWarnings = [];

  console.log('Starting batch import of 9 categories...\n');

  for (const config of CATEGORY_CONFIGS) {
    console.log(
      `→ Processing: ${config.label} (group=${config.group}, subgroup=${config.subgroup}, item=${config.item})`
    );
    const result = await processCategory(config);
    results.push(result);
    allWarnings.push(...result.warnings);
    console.log(
      `  ↳ ${result.processed}/${result.found} products, ` +
      `${result.imagesOptimized} images optimized, ` +
      `${result.warnings.length} warnings`
    );
    if (result.warnings.length) {
      result.warnings.forEach(w => console.log(`    ⚠ ${w}`));
    }
  }

  // ── STEP 3: MERGE into products-data.js ─────────────────────────────────────
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

  // Remove products from item slugs being re-imported (replace, don't duplicate)
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

  // ── STEP 4: VALIDATE ────────────────────────────────────────────────────────
  try {
    const roundTrip = fs.readFileSync(outputDataFile, 'utf8');
    const matchBack = roundTrip.match(/window\.productsData\s*=\s*(\[.*\]);?\s*$/s);
    if (!matchBack) throw new Error('File missing window.productsData assignment');
    const parsed = JSON.parse(matchBack[1]);

    // Check for duplicate IDs
    const ids = parsed.map(p => p.id).filter(Boolean);
    const seen = new Set();
    const duplicates = [];
    ids.forEach(id => {
      if (seen.has(id)) duplicates.push(id);
      seen.add(id);
    });
    if (duplicates.length > 0) {
      console.error(`⚠ WARNING: Duplicate IDs detected: ${duplicates.join(', ')}`);
    } else {
      console.log('✓ No duplicate IDs found');
    }

    console.log('✓ products-data.js syntax validated successfully');
    console.log(`✓ Total products in file: ${parsed.length}`);
  } catch (error) {
    console.error('⚠ ERROR: merged products-data.js is invalid:', error.message);
    process.exit(1);
  }

  // ── STEP 5: FINAL SUMMARY ───────────────────────────────────────────────────
  console.log('\n' + '='.repeat(80));
  console.log('FINAL SUMMARY — 9 CATEGORIES BATCH IMPORT');
  console.log('='.repeat(80));

  let totalProcessed = 0;
  let totalFound = 0;
  let totalImages = 0;
  let totalWarnings = 0;

  for (const result of results) {
    totalProcessed += result.processed;
    totalFound += result.found;
    totalImages += result.imagesOptimized;
    totalWarnings += result.warnings.length;

    const warnTag = result.warnings.length > 0 ? ` [${result.warnings.length} warnings]` : '';
    console.log(
      `${result.label}: ${result.processed}/${result.found} processed, ` +
      `${result.imagesOptimized} images optimized${warnTag}`
    );
  }

  console.log('─'.repeat(80));
  console.log(`TOTAL: ${totalProcessed}/${totalFound} products, ${totalImages} images optimized, ${totalWarnings} total warnings`);

  // Re-read to get final merged count
  try {
    const finalText = fs.readFileSync(outputDataFile, 'utf8');
    const finalMatch = finalText.match(/window\.productsData\s*=\s*(\[.*\]);?\s*$/s);
    if (finalMatch) {
      const finalAll = JSON.parse(finalMatch[1]);
      console.log(`TOTAL products ALL CATEGORIES combined: ${finalAll.length}`);
    }
  } catch {}

  console.log('='.repeat(80));

  if (allWarnings.length) {
    console.log('\nAll Warnings:');
    allWarnings.forEach(w => console.log(`  - ${w}`));
  }

  console.log('\n✅ Import complete. Verify on products.html that all categories appear correctly.');
}

main().catch(error => {
  console.error('\n❌ Batch import FAILED:');
  console.error(error.stack || error.message || error);
  process.exit(1);
});
