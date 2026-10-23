import { clamp, areNeighbors } from '../utils/helpers.js';
import { rgbToLuminance } from '../utils/colorUtils.js';

const MIN_CANVAS_SIZE = 16;
const MAX_CANVAS_SIZE = 8192;
const MAX_TILES = 100000;

export function Mosaic({ canvas = document.createElement('canvas'), onStatus = () => {}, onProgress = () => {} } = {}) {
  const ctx = canvas.getContext('2d');
  let targetBitmap = null;
  let targetAverage = { r: 128, g: 128, b: 128 };
  let tileSource = null;

  function setTileSource(source) {
    tileSource = source;
  }

  function setTargetImage(bitmap) {
    targetBitmap = bitmap;
    // Average color of the target image via a 1×1 px render (canvas background)
    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    const probeCtx = probe.getContext('2d', { willReadFrequently: true });
    probeCtx.drawImage(bitmap, 0, 0, 1, 1);
    const { data } = probeCtx.getImageData(0, 0, 1, 1);
    targetAverage = { r: data[0], g: data[1], b: data[2] };
  }

  /**
   * Renders the target image down to cols×rows pixels — afterwards one pixel
   * corresponds to exactly one cell and carries its average color.
   */
  function analyzeCells(cols, rows) {
    const probe = document.createElement('canvas');
    probe.width = cols;
    probe.height = rows;
    const probeCtx = probe.getContext('2d', { willReadFrequently: true });
    probeCtx.drawImage(targetBitmap, 0, 0, cols, rows);
    const { data } = probeCtx.getImageData(0, 0, cols, rows);
    const cells = [];
    for (let i = 0; i < cols * rows; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      cells.push({ r, g, b, luminance: rgbToLuminance(r, g, b) });
    }
    return cells;
  }

  function gridGeometry(width, height, count) {
    const cols = Math.max(1, Math.round(Math.sqrt((count * width) / height)));
    const rows = Math.max(1, Math.round(count / cols));
    return { cols, rows, cellWidth: width / cols, cellHeight: height / rows };
  }

  function pickTile(cell, strategy, exclude = null) {
    const find = (excluded) => {
      switch (strategy) {
        case 'random':
          return tileSource.randomTile(excluded);
        case 'color':
          return tileSource.findByColor(cell, excluded);
        case 'brightness-color':
          return tileSource.findByLuminanceAndColor(cell, excluded);
        case 'brightness':
        default:
          return tileSource.findByLuminance(cell.luminance, excluded);
      }
    };
    // Fallback without exclusion, so no gaps appear in the mosaic
    return find(exclude) || find(null);
  }

  function drawTileAt(tile, x, y, boxWidth, boxHeight, options) {
    const { angleRange, overlap, keepAspectRatio, aspectRatio } = options;
    const scale = 1 + clamp(overlap, 0, 100) / 100;
    let drawWidth = boxWidth * scale;
    let drawHeight = boxHeight * scale;
    if (keepAspectRatio && tile.width > 0 && tile.height > 0) {
      // Original AR: fit tile into the box (contain), centered
      const tileRatio = tile.width / tile.height;
      const boxRatio = boxWidth / boxHeight;
      if (tileRatio > boxRatio) {
        drawHeight = drawWidth / tileRatio;
      } else {
        drawWidth = drawHeight * tileRatio;
      }
    } else if (!keepAspectRatio && aspectRatio > 0) {
      drawHeight = drawWidth / aspectRatio;
    }
    const angle = ((Math.random() * 2 - 1) * clamp(angleRange, 0, 180) * Math.PI) / 180;
    ctx.save();
    ctx.translate(x + boxWidth / 2, y + boxHeight / 2);
    ctx.rotate(angle);
    ctx.drawImage(tile.bitmap, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
  }

  async function render({
    width = 1280,
    height = 720,
    tileCount = 200,
    strategy = 'brightness-color',
    layout = 'grid',
    stochasticSizePercent = 1,
    angleRange = 0,
    overlap = 0,
    keepAspectRatio = false,
    aspectRatio = 1,
    backgroundColor = null,
  } = {}) {
    if (!tileSource || tileSource.size === 0) {
      onStatus('No source images loaded — please load images first.', 'error');
      return false;
    }
    if (!targetBitmap) {
      onStatus('Please select a target image first.', 'error');
      return false;
    }

    canvas.width = clamp(Math.round(width), MIN_CANVAS_SIZE, MAX_CANVAS_SIZE);
    canvas.height = clamp(Math.round(height), MIN_CANVAS_SIZE, MAX_CANVAS_SIZE);

    // Background: custom color if set, otherwise the target's average color (no visible gaps)
    ctx.fillStyle = backgroundColor || `rgb(${targetAverage.r}, ${targetAverage.g}, ${targetAverage.b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const options = { angleRange, overlap, keepAspectRatio, aspectRatio };
    const count = clamp(Math.round(tileCount), 1, MAX_TILES);
    let cells;
    let placements;

    if (layout === 'grid') {
      const { cols, rows, cellWidth, cellHeight } = gridGeometry(canvas.width, canvas.height, count);
      cells = analyzeCells(cols, rows);
      placements = [];
      const placedTiles = new Array(cols * rows).fill(null);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // Avoid showing the same image directly next to itself (4-neighborhood;
          // right/bottom are covered when those cells are placed)
          const exclude = new Set();
          if (col > 0) exclude.add(placedTiles[row * cols + col - 1]);
          if (row > 0) exclude.add(placedTiles[(row - 1) * cols + col]);
          const tile = pickTile(cells[row * cols + col], strategy, exclude);
          placedTiles[row * cols + col] = tile;
          placements.push({ x: col * cellWidth, y: row * cellHeight, boxWidth: cellWidth, boxHeight: cellHeight, tile });
        }
      }
    } else {
      // Stochastic: tile size is set as a percentage of the total canvas area
      const area = (canvas.width * canvas.height * clamp(stochasticSizePercent, 0.01, 100)) / 100;
      const boxWidth = keepAspectRatio ? Math.sqrt(area) : Math.sqrt(area * aspectRatio);
      const boxHeight = keepAspectRatio ? boxWidth : boxWidth / aspectRatio;
      const cellCols = clamp(Math.round(Math.sqrt((count * canvas.width) / canvas.height)), 4, 256);
      const cellRows = Math.max(1, Math.round(count / cellCols));
      cells = analyzeCells(cellCols, cellRows);
      placements = Array.from({ length: count }, () => ({
        x: Math.random() * Math.max(0, canvas.width - boxWidth),
        y: Math.random() * Math.max(0, canvas.height - boxHeight),
        boxWidth,
        boxHeight,
      }));
      // Shuffle draw order so overlaps are distributed fairly
      for (let i = placements.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [placements[i], placements[j]] = [placements[j], placements[i]];
      }
      // Spatial neighborhood: touching/overlapping rectangles must not show the same image
      const placedRects = [];
      const neighborThreshold = Math.max(boxWidth, boxHeight) / 2;
      placements.forEach((placement, index) => {
        const exclude = new Set();
        for (const rect of placedRects) {
          if (areNeighbors(rect, placement, neighborThreshold)) exclude.add(rect.tile);
        }
        const tile = pickTile(cells[index % cells.length], strategy, exclude);
        placement.tile = tile;
        placedRects.push({
          tile,
          x: placement.x,
          y: placement.y,
          boxWidth: placement.boxWidth,
          boxHeight: placement.boxHeight,
        });
      });
    }

    // Draw in chunks and yield to the UI thread, so the progress display stays live
    const total = placements.length;
    const chunkSize = 500;
    for (let start = 0; start < total; start += chunkSize) {
      const end = Math.min(start + chunkSize, total);
      for (let i = start; i < end; i++) {
        const placement = placements[i];
        if (placement.tile) {
          drawTileAt(placement.tile, placement.x, placement.y, placement.boxWidth, placement.boxHeight, options);
        }
      }
      onProgress(end / total);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    onStatus(`Mosaic created: ${total} images drawn.`, 'ok');
    return true;
  }

  function exportImage({ type = 'image/png', quality, filename = 'mosaic.png' } = {}) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve({ blob, filename }) : reject(new Error('Export failed'))),
        type,
        quality,
      );
    });
  }

  function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  return { element: canvas, setTileSource, setTargetImage, render, exportImage, clear };
}
