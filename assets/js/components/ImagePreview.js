import { createElement } from '../utils/helpers.js';

export function ImagePreview({ maxSize = 240, label = 'Preview' } = {}) {
  const children = [];
  if (label) children.push(createElement('div', { className: 'image-preview__label', textContent: label }));
  const canvas = createElement('canvas', { className: 'image-preview__canvas' });
  children.push(canvas);
  const element = createElement('div', { className: 'image-preview' }, children);

  /**
   * Shows the bitmap. With size = { width, height } at exactly that size
   * (for the overlay stack underneath the mosaic), otherwise as a thumbnail
   * (maxSize).
   */
  function show(bitmap, size = null) {
    if (size) {
      canvas.width = Math.max(1, Math.round(size.width));
      canvas.height = Math.max(1, Math.round(size.height));
    } else {
      const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    element.classList.add('image-preview--visible');
  }

  return { element, show };
}
