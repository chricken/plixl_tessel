import { createElement, truncateFileName } from '../utils/helpers.js';

export function InputFile({
  label = 'Images',
  hint = 'Drag images here or click',
  accept = 'image/*',
  multiple = true,
  directory = false,
  onFiles = () => {},
} = {}) {
  let files = [];

  const input = createElement('input', { type: 'file', accept, hidden: true });
  if (multiple) input.multiple = true;
  if (directory) {
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');
  }

  const count = createElement('div', {
    className: 'dropzone__count',
    textContent: 'No images selected yet',
  });

  const zone = createElement('div', { className: 'dropzone', tabindex: '0', role: 'button' }, [
    createElement('div', { className: 'dropzone__label', textContent: label }),
    createElement('div', { className: 'dropzone__hint', textContent: hint }),
    count,
  ]);

  const handleFiles = (fileList) => {
    files = [...fileList].filter((file) => file.type.startsWith('image/'));
    count.textContent =
      files.length === 0
        ? 'No images selected yet'
        : multiple
          ? `${files.length} image(s) selected`
          : truncateFileName(files[0].name);
    onFiles(files);
  };

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      input.click();
    }
  });
  input.addEventListener('change', () => handleFiles(input.files));
  zone.addEventListener('dragover', (event) => {
    event.preventDefault();
    zone.classList.add('dropzone--over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('dropzone--over'));
  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    zone.classList.remove('dropzone--over');
    handleFiles(event.dataTransfer.files);
  });

  const element = createElement('div', { className: 'input-file' }, [zone, input]);

  return { element, getFiles: () => files };
}
