const sharp = require('sharp');

/**
 * Compress a base64 or data URL image string using sharp.
 * - Strips data URL header if present.
 * - Auto-rotates via EXIF.
 * - Resizes to maxWidth (no enlargement) and recompresses to jpeg/webp.
 * - Returns base64 (no data URL prefix by default).
 *
 * @param {string} dataUrlOrBase64 - Base64 string, with or without data URL prefix.
 * @param {object} opts
 * @param {number} [opts.maxWidth=1024]
 * @param {number} [opts.quality=75] - 1..100
 * @param {('jpeg'|'webp')} [opts.format='jpeg']
 * @param {boolean} [opts.returnDataUrl=false]
 * @returns {Promise<{ base64: string, mimetype: string, size: number }|string>} By default returns base64. If returnDataUrl, returns data URL string.
 */
async function compressBase64Image(dataUrlOrBase64, {
  maxWidth = 1024,
  quality = 75,
  format = 'jpeg',
  returnDataUrl = false,
} = {}) {
  if (!dataUrlOrBase64 || typeof dataUrlOrBase64 !== 'string') {
    throw new Error('Invalid image input');
  }
  const headerMatch = dataUrlOrBase64.match(/^data:(.*?);base64,/);
  const inputMime = headerMatch ? headerMatch[1] : null;
  const base64 = dataUrlOrBase64.replace(/^data:.*;base64,/, '');
  const input = Buffer.from(base64, 'base64');

  let pipeline = sharp(input).rotate();
  const meta = await pipeline.metadata();
  if (meta.width && meta.width > maxWidth) {
    pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
  }
  let mimetype;
  if (format === 'webp') {
    pipeline = pipeline.webp({ quality });
    mimetype = 'image/webp';
  } else {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    mimetype = 'image/jpeg';
  }

  const out = await pipeline.toBuffer();
  const outB64 = out.toString('base64');
  if (returnDataUrl) return `data:${mimetype};base64,${outB64}`;
  return { base64: outB64, mimetype, size: out.length };
}

module.exports = { compressBase64Image };
