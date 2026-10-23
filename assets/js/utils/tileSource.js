import { findNearest } from './helpers.js';
import { colorDistance } from './colorUtils.js';

/**
 * Abstract tile source.
 *
 * A tile source provides any number of "tiles" (images, later e.g. characters/
 * ASCII art or emojis), each with a brightness key (`luminance`). The mosaic
 * engine matches target cells against tiles via this key. New material types
 * extend TileSource and implement the same interface — the engine stays
 * unchanged.
 */
export class TileSource {
  constructor() {
    this.tiles = [];
    this.lookup = null;
  }

  get size() {
    return this.tiles.length;
  }

  addTile(tile) {
    this.tiles.push(tile);
    this.lookup = null;
  }

  /** Sorted lookup table by brightness for binary search. */
  buildLookup() {
    this.lookup = this.tiles
      .map((tile, index) => ({ key: tile.luminance, index }))
      .sort((a, b) => a.key - b.key);
  }

  getTile(index) {
    return this.tiles[index];
  }

  /**
   * Random tile. `exclude` (set of tile objects) is avoided when possible;
   * returns null when only excluded tiles would remain.
   */
  randomTile(exclude = null, maxAttempts = 16) {
    if (this.tiles.length === 0) return null;
    if (!exclude || exclude.size === 0) {
      return this.tiles[Math.floor(Math.random() * this.tiles.length)];
    }
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const tile = this.tiles[Math.floor(Math.random() * this.tiles.length)];
      if (!exclude.has(tile)) return tile;
    }
    return this.tiles.find((tile) => !exclude.has(tile)) || null;
  }

  /**
   * Tile with the closest brightness to the target brightness.
   * Excluded tiles (set) are skipped by walking outward from the match
   * to the next allowed brightness.
   */
  findByLuminance(luminance, exclude = null) {
    if (this.tiles.length === 0) return null;
    if (!this.lookup) this.buildLookup();
    const position = findNearest(this.lookup, luminance, (entry) => entry.key);
    if (position < 0) return null;
    if (!exclude || exclude.size === 0) return this.tiles[this.lookup[position].index];
    const startTile = this.tiles[this.lookup[position].index];
    if (!exclude.has(startTile)) return startTile;
    let lo = position - 1;
    let hi = position + 1;
    while (lo >= 0 || hi < this.lookup.length) {
      const distLo = lo >= 0 ? luminance - this.lookup[lo].key : Infinity;
      const distHi = hi < this.lookup.length ? this.lookup[hi].key - luminance : Infinity;
      if (distLo <= distHi) {
        const tile = this.tiles[this.lookup[lo].index];
        if (!exclude.has(tile)) return tile;
        lo--;
      } else {
        const tile = this.tiles[this.lookup[hi].index];
        if (!exclude.has(tile)) return tile;
        hi++;
      }
    }
    return null;
  }

  /** Tile with the smallest RGB distance to the target color (linear scan). */
  findByColor(targetColor, exclude = null) {
    if (this.tiles.length === 0) return null;
    let best = null;
    let bestDistance = Infinity;
    for (const tile of this.tiles) {
      if (exclude && exclude.has(tile)) continue;
      const distance = colorDistance(tile.color, targetColor);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = tile;
      }
    }
    return best;
  }

  /**
   * Tile by combined metric of brightness and color.
   * Both terms are normalized to [0, 1] and equally weighted.
   * Expects target = { luminance, r, g, b }.
   */
  findByLuminanceAndColor(target, exclude = null) {
    if (this.tiles.length === 0) return null;
    let best = null;
    let bestDistance = Infinity;
    for (const tile of this.tiles) {
      if (exclude && exclude.has(tile)) continue;
      const deltaLuminance = Math.abs(tile.luminance - target.luminance) / 255;
      const deltaColor = colorDistance(tile.color, target) / (255 * Math.sqrt(3));
      const distance = deltaLuminance + deltaColor;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = tile;
      }
    }
    return best;
  }
}

/**
 * Tile source for images. Expects tiles of the form
 * { bitmap, width, height, luminance, color, name } — as delivered by the
 * worker `processImages.js`.
 */
export class ImageTileSource extends TileSource {}
