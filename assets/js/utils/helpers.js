export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function debounce(fn, delay = 200) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function createElement(tag, props = {}, children = []) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;
    if (key === 'className') element.className = value;
    else if (key === 'textContent') element.textContent = value;
    else if (key === 'style' && typeof value === 'object') Object.assign(element.style, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else element.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child instanceof Node) element.append(child);
    else if (child != null) element.append(String(child));
  }
  return element;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Shortens a file name to maxLength characters (including the ellipsis). */
export function truncateFileName(name, maxLength = 30) {
  if (name.length <= maxLength) return name;
  return `${name.slice(0, Math.max(1, maxLength - 1))}…`;
}

/**
 * Formats a file name from a template: the first run of '#' characters is
 * replaced by the zero-padded index (#### = four digits).
 * formatFileName('img_####.jpg', 7) → 'img_0007.jpg'
 */
export function formatFileName(template, index) {
  return template.replace(/#+/, (hashes) => String(index).padStart(hashes.length, '0'));
}

/**
 * Computes width/height for an aspect ratio so the pixel count stays roughly
 * `pixelCount`. Returns null for invalid input.
 */
export function fitDimensions(pixelCount, aspectRatio) {
  if (!(pixelCount > 0) || !(aspectRatio > 0)) return null;
  const height = Math.sqrt(pixelCount / aspectRatio);
  return {
    width: Math.max(1, Math.round(height * aspectRatio)),
    height: Math.max(1, Math.round(height)),
  };
}

/**
 * Binary search for the nearest entry in an ascending sorted array
 * (lookup table). Returns the index of the nearest value.
 */
export function findNearest(sorted, target, key = (entry) => entry) {
  if (sorted.length === 0) return -1;
  if (target <= key(sorted[0])) return 0;
  const last = sorted.length - 1;
  if (target >= key(sorted[last])) return last;
  let lo = 0;
  let hi = last;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (key(sorted[mid]) < target) lo = mid;
    else hi = mid;
  }
  return target - key(sorted[lo]) <= key(sorted[hi]) - target ? lo : hi;
}

/** Distance between two 1D intervals; 0 when touching or overlapping. */
export function axisGap(aStart, aSize, bStart, bSize) {
  return Math.max(aStart - (bStart + bSize), bStart - (aStart + aSize), 0);
}

/**
 * Rectangles ({ x, y, boxWidth, boxHeight }) count as neighbors when they touch
 * or overlap, or gap by at most `threshold` on both axes.
 */
export function areNeighbors(a, b, threshold) {
  return (
    axisGap(a.x, a.boxWidth, b.x, b.boxWidth) < threshold &&
    axisGap(a.y, a.boxHeight, b.y, b.boxHeight) < threshold
  );
}
