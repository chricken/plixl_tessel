import { createElement } from '../utils/helpers.js';

export function InputColor({ label, value = '#000000', onChange = () => {} } = {}) {
  const input = createElement('input', { type: 'color', className: 'input-color__control', value });
  input.addEventListener('input', () => onChange(input.value));

  const element = createElement('label', { className: 'field input-color' }, [
    createElement('span', { className: 'field__label', textContent: label }),
    input,
  ]);

  return {
    element,
    getValue: () => input.value,
    setValue: (next) => {
      input.value = next;
    },
    setDisabled: (disabled) => {
      input.disabled = disabled;
    },
  };
}
