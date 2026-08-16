const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const rootDir = path.resolve(__dirname, '..');
const productsFile = path.join(rootDir, 'assets', 'js', 'products-data.js');

function loadProductsData() {
  const text = fs.readFileSync(productsFile, 'utf8');
  const match = text.match(/window\.productsData\s*=\s*(\[[\s\S]*\]);?\s*$/);
  if (!match) {
    throw new Error('Could not find window.productsData assignment in products-data.js');
  }
  return JSON.parse(match[1]);
}

function normalizeImagePath(product, candidate) {
  if (!candidate) return '';
  if (/^(https?:)?\/\//i.test(candidate)) return candidate;
  if (candidate.startsWith('/')) return candidate;
  return candidate.replace(/^\.\//, '');
}

function resolveLocalImagePath(candidate) {
  if (!candidate) return null;
  if (/^(https?:)?\/\//i.test(candidate)) return null;
  const clean = candidate.replace(/^\//, '');
  const absolute = path.join(rootDir, clean.replace(/^assets\//, 'assets/'));
  return fs.existsSync(absolute) ? absolute : null;
}

function readRatio(filePath) {
  try {
    const meta = sharp(filePath).metadataSync();
    if (!meta.width || !meta.height) return null;
    return meta.width / meta.height;
  } catch (error) {
    return null;
  }
}

function chooseCropAndFull(images) {
  const realImages = images.filter(Boolean).map((imagePath) => {
    const normalized = normalizeImagePath(null, imagePath);
    const resolved = resolveLocalImagePath(normalized || imagePath);
    const ratio = resolved ? readRatio(resolved) : null;
    return {
      imagePath,
      normalized,
      resolved,
      ratio
    };
  }).filter(item => item.imagePath && item.normalized);

  if (realImages.length < 2) {
    return {
      cropImage: realImages[0]?.imagePath || '',
      fullImage: realImages[0]?.imagePath || ''
    };
  }

  const valid = realImages.filter(item => typeof item.ratio === 'number' && Number.isFinite(item.ratio));
  if (valid.length >= 2) {
    valid.sort((a, b) => b.ratio - a.ratio);
    const crop = valid[0].imagePath;
    const full = valid[valid.length - 1].imagePath;
    return { cropImage: crop, fullImage: full };
  }

  return { cropImage: realImages[0].imagePath, fullImage: realImages[1]?.imagePath || realImages[0].imagePath };
}

function main() {
  const products = loadProductsData();
  let updated = 0;
  let skipped = 0;
  const ambiguous = [];

  for (const product of products) {
    if (!product || !Array.isArray(product.images) || product.images.length === 0) {
      skipped++;
      continue;
    }

    const { cropImage, fullImage } = chooseCropAndFull(product.images);
    if (cropImage && fullImage) {
      product.cropImage = cropImage;
      product.fullImage = fullImage;
      product.thumbnail = cropImage;
      updated++;
    } else {
      skipped++;
    }

    const hasRatioMismatch = product.images.length >= 2 && product.cropImage && product.fullImage && product.cropImage === product.fullImage;
    if (hasRatioMismatch) {
      ambiguous.push(product.name || product.id || 'unknown');
    }
  }

  const output = `window.productsData = ${JSON.stringify(products, null, 2)};\n`;
  fs.writeFileSync(productsFile, output, 'utf8');

  console.log(`Updated ${updated} product records with cropImage/fullImage metadata.`);
  console.log(`Skipped ${skipped} products without valid image pairs.`);
  if (ambiguous.length) {
    console.log('Ambiguous products that need a manual review pass:', ambiguous.slice(0, 10));
  }
}

main();
