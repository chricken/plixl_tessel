import { Mosaic } from './components/Mosaic.js';
import { InputRange } from './components/InputRange.js';
import { InputText } from './components/InputText.js';
import { InputSelect } from './components/InputSelect.js';
import { InputCheckbox } from './components/InputCheckbox.js';
import { InputColor } from './components/InputColor.js';
import { InputFile } from './components/InputFile.js';
import { Progress } from './components/Progress.js';
import { ImagePreview } from './components/ImagePreview.js';
import { ImageTileSource } from './utils/tileSource.js';
import { settings } from './settings.js';
import { clamp, createElement, downloadBlob, fitDimensions, formatFileName, truncateFileName } from './utils/helpers.js';

const $ = (id) => document.getElementById(id);

/* ---------- Theme ---------- */

const themeSelect = InputSelect({
  label: 'Theme',
  options: [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'green', label: 'Green' },
    { value: 'red', label: 'Red' },
  ],
  value: document.documentElement.dataset.theme || 'light',
  onChange: (value) => {
    document.documentElement.dataset.theme = value;
  },
});
$('theme-switcher').append(themeSelect.element);

/* ---------- Status ---------- */

function setStatus(message, kind = '') {
  const element = $('status');
  element.textContent = message;
  element.className = `status${kind ? ` status--${kind}` : ''}`;
}

/* ---------- Render progress ---------- */

const renderProgressFill = createElement('div', { className: 'progress__fill' });
const renderProgressBar = createElement('div', { className: 'progress__bar' }, [renderProgressFill]);
const renderProgressLabel = createElement('div', { className: 'progress__label', textContent: '' });
const renderProgress = createElement('div', { className: 'render-progress' }, [renderProgressBar, renderProgressLabel]);
$('render-progress').append(renderProgress);

/* ---------- Mosaic & tile source ---------- */

const tileSource = new ImageTileSource();
const mosaic = Mosaic({
  onStatus: setStatus,
  onProgress: (fraction) => {
    renderProgress.classList.add('render-progress--visible');
    renderProgressFill.style.width = `${Math.round(fraction * 100)}%`;
    renderProgressLabel.textContent = `Rendering … ${Math.round(fraction * 100)}%`;
  },
});
mosaic.setTileSource(tileSource);
mosaic.element.style.display = 'none';
$('output-canvas').append(mosaic.element);

let hasTarget = false;
let targetBitmap = null;
let lastRenderOk = false;
let rendering = false;

function updateLoadedLabel() {
  $('loaded-count').textContent = `Loaded images: ${tileSource.size}`;
}

function updateButtons() {
  $('run-button').disabled = rendering || !(tileSource.size > 0 && hasTarget);
  $('download-button').disabled = !lastRenderOk;
}

/* ---------- Settings (defaults from settings.js) ---------- */

const defaultHeight = Math.round((settings.defaultWidth * 9) / 16);

const fitArCheckbox = InputCheckbox({
  label: 'Adjust resolution to target image aspect ratio',
  checked: true,
});

// Aspect ratio source: the target image if loaded, otherwise the current resolution
function targetAspectRatio(width, height) {
  if (targetBitmap) return targetBitmap.width / targetBitmap.height;
  if (width > 0 && height > 0) return width / height;
  return 1;
}

// Live sync: when the checkbox is set, editing one resolution adapts the other
function syncResolution(changed) {
  if (!fitArCheckbox.getValue()) return;
  const width = parseInt(widthInput.getValue(), 10);
  const height = parseInt(heightInput.getValue(), 10);
  const w = Number.isFinite(width) && width > 0 ? width : null;
  const h = Number.isFinite(height) && height > 0 ? height : null;
  if (changed === 'width' && w) {
    heightInput.setValue(clamp(Math.round(w / targetAspectRatio(w, h || 0)), 16, 8192));
  } else if (changed === 'height' && h) {
    widthInput.setValue(clamp(Math.round(h * targetAspectRatio(w || 0, h)), 16, 8192));
  }
}

const widthInput = InputText({
  label: 'Target width (px)',
  type: 'number',
  value: String(settings.defaultWidth),
  onChange: () => syncResolution('width'),
});
const heightInput = InputText({
  label: 'Target height (px)',
  type: 'number',
  value: String(defaultHeight),
  onChange: () => syncResolution('height'),
});
const tileCountInput = InputRange({
  label: 'Number of images',
  min: 10,
  max: 10000,
  step: 10,
  value: settings.defaultNumberOfImages,
  manual: true,
});
const strategySelect = InputSelect({
  label: 'Mosaic strategy',
  options: [
    { value: 'brightness-color', label: 'By brightness and color' },
    { value: 'brightness', label: 'By brightness' },
    { value: 'color', label: 'By color' },
    { value: 'random', label: 'Random' },
  ],
  value: settings.defaultStrategy,
});
const sizeInput = InputRange({
  label: 'Image size (% of total area)',
  min: 0.01,
  max: 20,
  step: 0.001,
  value: 1,
  unit: '%',
});
const layoutSelect = InputSelect({
  label: 'Layout',
  options: [
    { value: 'grid', label: 'Grid' },
    { value: 'stochastic', label: 'Stochastic' },
  ],
  value: settings.defaultLayout,
  onChange: (value) => {
    sizeInput.element.style.display = value === 'stochastic' ? '' : 'none';
  },
});
// The size slider only applies to the stochastic layout
sizeInput.element.style.display = settings.defaultLayout === 'stochastic' ? '' : 'none';

const angleInput = InputRange({ label: 'Angle range (±°)', min: 0, max: 45, step: 1, value: 0, unit: '°' });
const overlapInput = InputRange({ label: 'Overlap', min: 0, max: 100, step: 5, value: 0, unit: '%' });
const arSelect = InputSelect({
  label: 'Preset aspect ratio',
  options: [
    { value: '1', label: '1:1' },
    { value: String(4 / 3), label: '4:3' },
    { value: String(3 / 4), label: '3:4' },
    { value: String(16 / 9), label: '16:9' },
    { value: String(9 / 16), label: '9:16' },
  ],
  value: '1',
});
const keepArCheckbox = InputCheckbox({
  label: 'Keep original aspect ratio',
  checked: settings.defaultKeepAspectRatio,
  onChange: (checked) => arSelect.setDisabled(checked),
});
arSelect.setDisabled(settings.defaultKeepAspectRatio);

const bgColorInput = InputColor({ label: 'Background color', value: '#000000' });
const bgColorCheckbox = InputCheckbox({
  label: 'Custom background color',
  checked: false,
  onChange: (checked) => bgColorInput.setDisabled(!checked),
});
bgColorInput.setDisabled(true);

$('settings').append(
  createElement('div', { className: 'settings__row' }, [widthInput.element, heightInput.element]),
  fitArCheckbox.element,
  tileCountInput.element,
  strategySelect.element,
  layoutSelect.element,
  sizeInput.element,
  angleInput.element,
  overlapInput.element,
  keepArCheckbox.element,
  arSelect.element,
  createElement('div', { className: 'settings__row' }, [bgColorCheckbox.element, bgColorInput.element]),
);

function currentResolution() {
  return {
    width: parseInt(widthInput.getValue(), 10) || settings.defaultWidth,
    height: parseInt(heightInput.getValue(), 10) || defaultHeight,
  };
}

function maxTileSize() {
  const { width, height } = currentResolution();
  const count = Number(tileCountInput.getValue()) || settings.defaultNumberOfImages;
  return Math.max(16, Math.round(Math.sqrt((width * height) / count)));
}

/* ---------- Progress & worker ---------- */

const progress = Progress();
$('source-progress').append(progress.element);

const worker = new Worker('assets/js/workers/processImages.js', { type: 'module' });
let busy = false;
let pending = [];

function pump() {
  if (busy || pending.length === 0) return;
  busy = true;
  const batch = pending;
  pending = [];
  progress.reset();
  progress.setTotal(batch.length);
  worker.postMessage({ type: 'process', files: batch, maxTileSize: maxTileSize() });
}

worker.onmessage = ({ data }) => {
  if (data.type === 'progress') {
    progress.update(data);
  } else if (data.type === 'tile') {
    tileSource.addTile(data);
    updateLoadedLabel();
  } else if (data.type === 'done') {
    busy = false;
    tileSource.buildLookup();
    setStatus(
      `${data.processed} images processed${data.failed ? `, ${data.failed} failed` : ''}.`,
      data.failed ? 'warn' : 'ok',
    );
    updateButtons();
    pump();
  }
};

worker.onerror = (event) => {
  busy = false;
  setStatus(`Worker error: ${event.message}`, 'error');
  pump();
};

function processFiles(files) {
  const list = [...files].filter((file) => file.type.startsWith('image/'));
  if (list.length === 0) {
    setStatus('No image files found.', 'warn');
    return;
  }
  pending.push(...list);
  pump();
}

/* ---------- Source images (drop zone) ---------- */

const sourceInput = InputFile({
  label: 'Source images',
  hint: 'Drag images here or click to select',
  accept: 'image/*',
  multiple: true,
  onFiles: processFiles,
});
$('source-drop').append(sourceInput.element);

/* ---------- Default source images (settings.js: folders + file name template) ---------- */

const defaultImagesButton = createElement('button', {
  type: 'button',
  className: 'btn',
  textContent: 'Load default images',
});
$('default-images').append(defaultImagesButton);

function fetchTemplateImage(folder, index) {
  const name = formatFileName(settings.fileNameTemplate, index);
  return fetch(`images/source/${folder}/${name}`)
    .then((response) => {
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`${name} (HTTP ${response.status})`);
      return response.blob();
    })
    .then((blob) => (blob ? new File([blob], name, { type: blob.type || 'image/jpeg' }) : null));
}

// Loads img_0001, img_0002, … sequentially and stops at the first 404
function loadFolderSequential(folder) {
  const files = [];
  const next = (index) =>
    fetchTemplateImage(folder, index).then((file) => {
      if (!file || index > 9999) return files;
      files.push(file);
      return next(index + 1);
    });
  return next(1);
}

defaultImagesButton.addEventListener('click', () => {
  const folders = settings.defaultSourceFolders;
  if (!Array.isArray(folders) || folders.length === 0) {
    setStatus('No default source folders configured in settings.js.', 'warn');
    return;
  }
  setStatus(`Loading default images from ${folders.length} folder(s) …`);
  Promise.all(folders.map(loadFolderSequential))
    .then((results) => {
      const all = results.flat();
      if (all.length === 0) {
        setStatus('No default images found — check images/source/ and settings.js (see README).', 'warn');
        return;
      }
      processFiles(all);
    })
    .catch((error) =>
      setStatus(`Default images could not be loaded (start a local server, see README): ${error.message}`, 'error'),
    );
});

/* ---------- Target image ---------- */

const targetPreview = ImagePreview({ label: '' });
$('target-preview').append(targetPreview.element);

function updateTargetPreview(width, height) {
  if (targetBitmap) targetPreview.show(targetBitmap, { width, height });
}

const targetInput = InputFile({
  label: 'Target image',
  hint: 'Drag an image here or click to select',
  accept: 'image/*',
  multiple: false,
  onFiles: (files) => {
    const file = files[0];
    if (!file) return;
    createImageBitmap(file)
      .then((bitmap) => {
        targetBitmap = bitmap;
        mosaic.setTargetImage(bitmap);
        const { width, height } = currentResolution();
        // Adapt the target resolution to the image's aspect ratio (pixel count ~ preserved)
        if (fitArCheckbox.getValue()) {
          const fitted = fitDimensions(width * height, bitmap.width / bitmap.height);
          if (fitted) {
            widthInput.setValue(fitted.width);
            heightInput.setValue(fitted.height);
            updateTargetPreview(fitted.width, fitted.height);
          } else {
            updateTargetPreview(width, height);
          }
        } else {
          updateTargetPreview(width, height);
        }
        hasTarget = true;
        setStatus(`Target image loaded: ${truncateFileName(file.name)}`, 'ok');
        updateButtons();
      })
      .catch(() => setStatus('Target image could not be loaded.', 'error'));
  },
});
$('target-drop').append(targetInput.element);

/* ---------- Mosaic opacity ---------- */

const opacityInput = InputRange({
  label: 'Mosaic opacity',
  min: 0,
  max: 100,
  step: 1,
  value: 100,
  unit: '%',
  onChange: (value) => {
    mosaic.element.style.opacity = String(value / 100);
  },
});
$('opacity-control').append(opacityInput.element);

/* ---------- Create & export ---------- */

$('run-button').addEventListener('click', () => {
  const { width, height } = currentResolution();
  rendering = true;
  $('run-button').disabled = true;
  renderProgressFill.style.width = '0';
  mosaic
    .render({
      width,
      height,
      tileCount: Number(tileCountInput.getValue()) || settings.defaultNumberOfImages,
      strategy: strategySelect.getValue(),
      layout: layoutSelect.getValue(),
      stochasticSizePercent: Number(sizeInput.getValue()) || 1,
      angleRange: Number(angleInput.getValue()) || 0,
      overlap: Number(overlapInput.getValue()) || 0,
      keepAspectRatio: keepArCheckbox.getValue(),
      aspectRatio: parseFloat(arSelect.getValue()) || 1,
      backgroundColor: bgColorCheckbox.getValue() ? bgColorInput.getValue() : null,
    })
    .then((ok) => {
      lastRenderOk = ok;
      if (ok) {
        mosaic.element.style.display = '';
        updateTargetPreview(mosaic.element.width, mosaic.element.height);
      }
    })
    .finally(() => {
      rendering = false;
      renderProgress.classList.remove('render-progress--visible');
      updateButtons();
    });
});

$('download-button').addEventListener('click', () => {
  const { width, height } = mosaic.element;
  mosaic
    .exportImage({ filename: `mosaic-${width}x${height}.png` })
    .then(({ blob, filename }) => downloadBlob(blob, filename))
    .catch((error) => setStatus(error.message, 'error'));
});
