const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..');
const categorySlug = process.argv[3] || 'basketball-uniforms';
const productGroup = process.argv[4] || (categorySlug === 'karate-uniform' ? 'karate' : 'sportswear');
const sourceRoot = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join('C:\\Users\\dell\\Downloads\\Basketball\\Basketball');
const outputDataFile = path.join(projectRoot, 'assets', 'js', 'products-data.js');
const outputImagesRoot = path.join(projectRoot, 'assets', 'images', 'products', categorySlug);

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
    if (/^seo title$/i.test(line)) continue;
    descriptionLines.push(line);
  }

  const joined = descriptionLines.join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!joined) return title;

  const sentences = joined.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [joined];
  const selected = sentences.slice(0, 4).join(' ').trim();

  let seoSentence;
  if (categorySlug === 'football-soccer-kits') {
    seoSentence = `${title} is a premium football kit built for clubs, academies, schools, and competitive teams, combining performance polyester, breathable mesh comfort, and a professional custom teamwear finish.`;
  } else if (categorySlug === 'karate-uniform') {
    seoSentence = `${title} is a premium martial arts uniform crafted for dojos, academies, competitions, and training, combining durable reinforced fabric, comfortable fit, and a traditional professional design.`;
  } else if (categorySlug === 'duffel-bags') {
    seoSentence = `${title} is a premium sports duffel bag engineered for athletes, teams, gym-goers, and travel, combining durable materials, smart storage compartments, and a sleek professional finish.`;
  } else if (categorySlug === 'tracksuits') {
    seoSentence = `${title} is a premium tracksuit designed for training, casual wear, and team outfitting, combining soft performance fabric, a flattering athletic fit, and versatile modern styling.`;
  } else {
    seoSentence = `${title} is a premium sportswear item built for clubs, academies, athletes, and teams, combining high-quality materials, performance features, and a professional custom finish.`;
  }

  const summary = `${selected} ${seoSentence}`.replace(/\s+/g, ' ').trim();
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

function titleCaseFromSlug(value) {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function parseKitFolderName(folderName) {
  const cleanName = folderName.trim();

  // Pattern 1: "Kit ## – Title" or "## – Title"
  let match = cleanName.match(/^(?:Kit\s*)?(\d+)\s*[–\-—]\s*(.+)$/i);
  if (match) {
    return {
      order: parseInt(match[1], 10),
      title: match[2].trim(),
    };
  }

  // Pattern 2: "[Name with spaces] ##" (e.g., "Premium Duffle Bag 01")
  match = cleanName.match(/^(.+?)\s*(\d+)$/);
  if (match) {
    return {
      order: parseInt(match[2], 10),
      title: `${match[1].trim()} ${match[2].trim()}`,
    };
  }

  // Fallback: use whole name with order 0
  return {
    order: 0,
    title: cleanName,
  };
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

async function main() {
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
    const imageFiles = files.filter(file => ['.jpg', '.jpeg', '.png'].includes(path.extname(file).toLowerCase()));

    if (docxFiles.length !== 1) {
      warnings.push(`${folderName}: expected exactly 1 .docx, found ${docxFiles.length}`);
    }
    if (imageFiles.length < 1) {
      warnings.push(`${folderName}: no images found`);
    }

    const docxName = docxFiles[0];
    const rawDescription = docxName ? await readDescription(path.join(kitDir, docxName)) : '';
    const description = summarizeDescription(rawDescription, parsed.title);
    const sortedImages = imageFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    const slug = slugify(parsed.title);
    const outputKitDir = path.join(outputImagesRoot, slug);
    ensureDir(outputKitDir);

    const outputImages = [];
    for (let i = 0; i < sortedImages.length; i += 1) {
      const fileName = sortedImages[i];
      const inputPath = path.join(kitDir, fileName);
      const outputPath = path.join(outputKitDir, `image-${i + 1}.jpg`);
      await optimizeImage(inputPath, outputPath);
      optimizedImageCount += 1;
      outputImages.push(path.posix.join('/assets/images/products', categorySlug, slug, `image-${i + 1}.jpg`));
    }

    products.push({
      id: slug,
      name: parsed.title,
      description,
      group: productGroup,
      item: categorySlug,
      subgroup: null,
      images: outputImages,
      thumbnail: categorySlug === 'karate-uniform'
        ? (outputImages[0] || outputImages[1] || '')
        : (outputImages[1] || outputImages[0] || ''),
      kitNumber: parsed.order,
    });
  }

  products.sort((a, b) => a.kitNumber - b.kitNumber);

  let existingProducts = [];
  if (fs.existsSync(outputDataFile)) {
    try {
      const existingText = fs.readFileSync(outputDataFile, 'utf8');
      const match = existingText.match(/window\.productsData\s*=\s*(\[.*\]);?\s*$/s);
      if (match) {
        existingProducts = JSON.parse(match[1]);
      }
    } catch (error) {
      warnings.push(`Could not read existing products-data.js: ${error.message}`);
    }
  }

  const mergedProducts = existingProducts
    .filter(product => product && product.item !== categorySlug)
    .concat(products.map(({ kitNumber, ...rest }) => rest));

  const fileContent = `window.productsData = ${JSON.stringify(mergedProducts, null, 2)};\n`;
  ensureDir(path.dirname(outputDataFile));
  fs.writeFileSync(outputDataFile, fileContent, 'utf8');

  const summaryLabel = categorySlug === 'football-soccer-kits'
    ? 'Football/Soccer'
    : categorySlug === 'karate-uniform'
      ? 'Karate'
      : categorySlug === 'duffel-bags'
        ? 'Duffel Bags'
        : categorySlug === 'tracksuits'
          ? 'Tracksuits'
          : 'Basketball';
  const totalFound = folders.length;
  const unitLabel = categorySlug === 'duffel-bags' ? 'products' : categorySlug === 'tracksuits' ? 'tracksuits' : 'kits';
  const summary = `${summaryLabel}: ${products.length}/${totalFound} ${unitLabel} processed successfully, ${optimizedImageCount} images optimized, ${warnings.length} warnings`;
  console.log(summary);
  if (warnings.length) {
    console.log('Warnings:');
    warnings.forEach(warning => console.log(`- ${warning}`));
  }
}

main().catch(error => {
  console.error(`Import failed for ${categorySlug}:`);
  console.error(error.stack || error.message || error);
  process.exit(1);
});
