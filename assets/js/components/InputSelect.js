import { createElement } from '../utils/helpers.js';

export function InputSelect({ label, options = [], value = '', onChange = () => {} } = {}) {
  const select = createElement('select', { className: 'input-select__control' });

  const setOptions = (list) => {
    select.innerHTML = '';
    for (const { value: optionValue, label: optionLabel } of list) {
      select.append(createElement('option', { value: optionValue, textContent: optionLabel }));
    }
  };
  setOptions(options);
  if (value) select.value = value;

  select.addEventListener('change', () => onChange(select.value));

  const element = createElement('label', { className: 'field input-select' }, [
    createElement('span', { className: 'field__label', textContent: label }),
    select,
  ]);

  return {
    element,
    getValue: () => select.value,
    setValue: (next) => {
      select.value = next;
    },
    setOptions,
    setDisabled: (disabled) => {
      select.disabled = disabled;
    },
  };
}
