const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..');
const outputDataFile = path.join(projectRoot, 'assets', 'js', 'products-data.js');

const CATEGORY_CONFIGS = [
  {
    label: 'Volleyball',
    sourceRoot: 'C:\\Users\\dell\\Documents\\Volleyball\\Volleyball',
    categorySlug: 'volleyball-uniforms',
    group: 'sportswear',
    subgroup: null,
    item: 'volleyball-uniforms',
    seoSentence: (title) => `${title} is a premium volleyball uniform built for clubs, schools, academies, and competitive teams, combining lightweight performance fabric, breathable comfort, and a standout match-ready design.`
  },
  {
    label: 'American Football',
    sourceRoot: 'C:\\Users\\dell\\Downloads\\American Football\\American Football',
    categorySlug: 'american-football-uniforms',
    group: 'sportswear',
    subgroup: null,
    item: 'american-football-uniforms',
    seoSentence: (title) => `${title} is a premium American football uniform engineered for performance, protection, and team identity, combining durable materials, athletic comfort, and a bold on-field look.`
  }
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
  const clean = folderName.trim();
  const kitMatch = clean.match(/^(?:Kit\s*)?(\d+)\s*[–\-—]\s*(.+)$/i);
  if (kitMatch) {
    return { order: Number.parseInt(kitMatch[1], 10), title: kitMatch[2].trim() };
  }

  const numberedMatch = clean.match(/^(.+?)\s*(\d+)$/);
  if (numberedMatch) {
    return { order: Number.parseInt(numberedMatch[2], 10), title: numberedMatch[1].trim() };
  }

  return { order: 0, title: clean };
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function discoverFiles(dirPath) {
  return fs.readdirSync(dirPath, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => entry.name);
}

function extractAfterLabel(line) {
  if (!line) return '';
  return line.replace(/^[^:]+:\s*/i, '').trim();
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
    if (/^seo title$/i.test(line)) continue;
    descriptionLines.push(line);
  }

  const joined = descriptionLines.join(' ').replace(/\s+/g, ' ').trim();
  const base = joined || title;
  const sentences = base.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [base];
  const selected = sentences.slice(0, 4).join(' ').trim();
  const seoSentence = seoSentenceFn ? seoSentenceFn(title) : '';
  const summary = `${selected} ${seoSentence}`.replace(/\s+/g, ' ').trim();
  return summary.length > 780 ? summary.slice(0, 777).trimEnd() + '...' : summary;
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

function buildSeo(title, description, item, group, rawDescription) {
  const rawLines = (rawDescription || '').split('\n').map(line => line.trim()).filter(Boolean);
  const metaTitleRaw = rawLines.find(line => /^(seo title|meta title)/i.test(line));
  const metaDescriptionRaw = rawLines.find(line => /^(seo description|meta description)/i.test(line));
  const imageAltRaw = rawLines.find(line => /^(image alt text|alt text)/i.test(line));
  const keywordsRaw = rawLines.find(line => /^(seo keywords|keywords|focus keyword)/i.test(line));

  const metaTitle = extractAfterLabel(metaTitleRaw) || `${title} | Fitting Club – Sialkot Sports Goods Manufacturer`;
  const metaDescription = extractAfterLabel(metaDescriptionRaw) || `${description.slice(0, 155).trimEnd()}${description.length > 155 ? '...' : ''}`;
  const imageAlt = extractAfterLabel(imageAltRaw) || `${title} - Fitting Club premium ${item.replace(/-/g, ' ')} manufactured in Sialkot`;
  const keywords = extractAfterLabel(keywordsRaw)
    ? extractAfterLabel(keywordsRaw).split(/[,|;]+/).map(v => v.trim()).filter(Boolean)
    : [title.toLowerCase(), item.replace(/-/g, ' '), group, 'Fitting Club'];

  return {
    metaTitle,
    metaDescription,
    imageAlt,
    keywords
  };
}

function parseExistingProducts() {
  if (!fs.existsSync(outputDataFile)) return [];
  const text = fs.readFileSync(outputDataFile, 'utf8');
  const match = text.match(/window\.productsData\s*=\s*(\[.*\]);?\s*$/s);
  if (!match) {
    throw new Error('Existing products-data.js is not in the expected window.productsData format.');
  }
  return JSON.parse(match[1]);
}

async function processCategory(config) {
  const { label, sourceRoot, categorySlug, group, subgroup, item, seoSentence } = config;
  const outputImagesRoot = path.join(projectRoot, 'assets', 'images', 'products', item);

  if (!fs.existsSync(sourceRoot)) {
    throw new Error(`Source folder not found: ${sourceRoot}`);
  }

  const folders = fs.readdirSync(sourceRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .map(folderName => ({ folderName, parsed: parseKitFolderName(folderName) }))
    .filter(entry => entry.parsed)
    .sort((a, b) => a.parsed.order - b.parsed.order);

  const warnings = [];
  const products = [];
  let optimizedImageCount = 0;

  for (const entry of folders) {
    const { folderName, parsed } = entry;
    const kitDir = path.join(sourceRoot, folderName);
    const files = discoverFiles(kitDir);
    const docxFiles = files.filter(file => path.extname(file).toLowerCase() === '.docx');
    const imageFiles = files.filter(file => ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file).toLowerCase()));

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
      } catch (err) {
        warnings.push(`[${label}] ${folderName}: failed to read ${docxName} — ${err.message}`);
      }
    }

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
      try {
        await optimizeImage(inputPath, outputPath);
        optimizedImageCount += 1;
        outputImages.push(path.posix.join('/assets/images/products', item, productSlug, `image-${i + 1}.jpg`));
      } catch (err) {
        warnings.push(`[${label}] ${folderName}: image "${fileName}" failed — ${err.message}`);
      }
    }

    if (outputImages.length === 0) {
      warnings.push(`[${label}] ${folderName}: all images failed optimization, skipping product`);
      continue;
    }

    const thumbnail = outputImages[1] || outputImages[0] || '';
    const seo = buildSeo(parsed.title, description, item, group, rawDescription);

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
      kitNumber: parsed.order
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
    products: products.map(({ kitNumber, ...rest }) => rest)
  };
}

async function main() {
  const allResults = [];
  const allWarnings = [];

  const existingProducts = parseExistingProducts();
  const mergedProducts = existingProducts.filter(product => {
    if (!product || !product.item) return true;
    return product.item !== 'volleyball-uniforms' && product.item !== 'american-football-uniforms';
  });

  for (const config of CATEGORY_CONFIGS) {
    console.log(`\n▶ Processing ${config.label} (${config.item})`);
    const result = await processCategory(config);
    allResults.push(result);
    allWarnings.push(...result.warnings);
    console.log(`  ${result.processed}/${result.found} products processed, ${result.imagesOptimized} images optimized, ${result.warnings.length} warnings`);

    mergedProducts.push(...result.products);
  }

  const finalContent = `window.productsData = ${JSON.stringify(mergedProducts, null, 2)};\n`;
  ensureDir(path.dirname(outputDataFile));
  fs.writeFileSync(outputDataFile, finalContent, 'utf8');

  try {
    const roundTrip = fs.readFileSync(outputDataFile, 'utf8');
    const match = roundTrip.match(/window\.productsData\s*=\s*(\[.*\]);?\s*$/s);
    if (!match) throw new Error('Missing window.productsData assignment');
    JSON.parse(match[1]);
    console.log('\n✓ products-data.js syntax validation passed');
  } catch (err) {
    console.error('\n✖ products-data.js validation failed:', err.message);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(80));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(80));
  let totalProducts = 0;
  let totalImages = 0;
  let totalWarnings = 0;

  for (const result of allResults) {
    totalProducts += result.processed;
    totalImages += result.imagesOptimized;
    totalWarnings += result.warnings.length;
    console.log(`${result.label}: ${result.processed}/${result.found} products processed, ${result.imagesOptimized} images optimized, ${result.warnings.length} warnings`);
  }

  console.log('-'.repeat(80));
  console.log(`TOTAL NEW PRODUCTS: ${totalProducts}`);
  console.log(`TOTAL IMAGES OPTIMIZED: ${totalImages}`);
  console.log(`TOTAL WARNINGS: ${totalWarnings}`);
  console.log(`COMBINED TOTAL PRODUCT COUNT: ${mergedProducts.length}`);
  console.log('='.repeat(80));

  if (allWarnings.length) {
    console.log('\nWarnings:');
    allWarnings.forEach(w => console.log(`  - ${w}`));
  }
}

main().catch(error => {
  console.error('\n❌ Import failed:');
  console.error(error.stack || error.message || error);
  process.exit(1);
});
