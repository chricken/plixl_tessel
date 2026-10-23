import { createElement } from '../utils/helpers.js';

export function InputText({ label, value = '', type = 'text', placeholder = '', onChange = () => {} } = {}) {
  const input = createElement('input', { type, className: 'input-text__control', value, placeholder });
  input.addEventListener('input', () => onChange(input.value));

  const element = createElement('label', { className: 'field input-text' }, [
    createElement('span', { className: 'field__label', textContent: label }),
    input,
  ]);

  return {
    element,
    getValue: () => input.value,
    setValue: (next) => {
      input.value = next;
    },
  };
}
