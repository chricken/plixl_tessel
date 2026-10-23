import { createElement } from '../utils/helpers.js';

export function InputCheckbox({ label, checked = false, onChange = () => {} } = {}) {
  const input = createElement('input', { type: 'checkbox', className: 'input-checkbox__control' });
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));

  const element = createElement('label', { className: 'field input-checkbox' }, [
    input,
    createElement('span', { textContent: label }),
  ]);

  return {
    element,
    getValue: () => input.checked,
    setValue: (next) => {
      input.checked = next;
    },
  };
}
