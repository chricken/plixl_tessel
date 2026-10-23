import { createElement, clamp } from '../utils/helpers.js';

export function InputRange({
  label,
  min = 0,
  max = 100,
  step = 1,
  value = 50,
  unit = '',
  manual = false,
  onChange = () => {},
} = {}) {
  const output = createElement('output', {
    className: 'input-range__value',
    textContent: `${value}${unit}`,
  });
  const range = createElement('input', {
    type: 'range',
    className: 'input-range__control',
    min,
    max,
    step,
    value,
  });

  let numberInput = null;

  range.addEventListener('input', () => {
    if (numberInput) numberInput.value = range.value;
    output.textContent = `${range.value}${unit}`;
    onChange(Number(range.value));
  });

  // Optional number field for values beyond the slider range
  if (manual) {
    numberInput = createElement('input', {
      type: 'number',
      className: 'input-range__number',
      min,
      step,
      value,
    });
    numberInput.addEventListener('input', () => {
      if (numberInput.value === '') return;
      const parsed = Number(numberInput.value);
      if (!Number.isFinite(parsed)) return;
      range.value = clamp(parsed, min, max);
      output.textContent = `${numberInput.value}${unit}`;
      onChange(parsed);
    });
  }

  const rowChildren = [range];
  if (numberInput) rowChildren.push(numberInput);
  rowChildren.push(output);

  const element = createElement('div', { className: 'field input-range' }, [
    createElement('span', { className: 'field__label', textContent: label }),
    createElement('div', { className: 'input-range__row' }, rowChildren),
  ]);

  return {
    element,
    getValue: () => (numberInput && numberInput.value !== '' ? Number(numberInput.value) : Number(range.value)),
    setValue: (next) => {
      range.value = clamp(next, min, max);
      if (numberInput) numberInput.value = next;
      output.textContent = `${next}${unit}`;
    },
  };
}
