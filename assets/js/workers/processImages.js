import { rgbToLuminance } from '../utils/colorUtils.js';

const post = (message, transfer = []) => self.postMessage(message, transfer);

/**
 * Scales a bitmap proportionally so its longest side is `maxSize` px
 * (only down, never up). The aspect ratio is preserved; the mosaic engine
 * draws it to fit later.
 */
function scaleToFit(bitmap, maxSize) {
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, maxSize / longest);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas.transferToImageBitmap();
}

/**
 * Determines average color and brightness by rendering the image to 1×1 px —
 * much faster than a manual pixel loop.
 */
function analyzeColor(bitmap) {
  const probe = new OffscreenCanvas(1, 1);
  const ctx = probe.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, 1, 1);
  const { data } = ctx.getImageData(0, 0, 1, 1);
  return {
    color: { r: data[0], g: data[1], b: data[2] },
    luminance: rgbToLuminance(data[0], data[1], data[2]),
  };
}

async function processAll(files, maxTileSize) {
  const total = files.length;
  let processed = 0;
  let failed = 0;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    const name = file.name || `Image ${i + 1}`;
    post({ type: 'progress', index: i, total, name, status: 'processing' });
    try {
      const source = await createImageBitmap(file);
      const bitmap = scaleToFit(source, maxTileSize);
      source.close();
      const { color, luminance } = analyzeColor(bitmap);
      post(
        {
          type: 'tile',
          index: i,
          total,
          name,
          bitmap,
          width: bitmap.width,
          height: bitmap.height,
          color,
          luminance,
        },
        [bitmap],
      );
      processed++;
      post({ type: 'progress', index: i, total, name, status: 'done' });
    } catch (error) {
      failed++;
      post({
        type: 'progress',
        index: i,
        total,
        name,
        status: 'error',
        error: String((error && error.message) || error),
      });
    }
  }

  post({ type: 'done', processed, failed, total });
}

self.onmessage = ({ data }) => {
  if (data && data.type === 'process') {
    processAll(data.files || [], data.maxTileSize || 128);
  }
};
