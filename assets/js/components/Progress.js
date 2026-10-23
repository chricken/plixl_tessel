import { createElement, truncateFileName } from '../utils/helpers.js';

const STATUS_LABELS = {
  pending: 'waiting',
  processing: 'loading …',
  done: 'done',
  error: 'error',
};

export function Progress({ maxListHeight = 180 } = {}) {
  const fill = createElement('div', { className: 'progress__fill' });
  const bar = createElement('div', { className: 'progress__bar' }, [fill]);
  const label = createElement('div', { className: 'progress__label', textContent: '0 / 0' });
  const list = createElement('ul', { className: 'progress__list' });
  list.style.maxHeight = `${maxListHeight}px`;

  const items = new Map();
  let total = 0;

  function setTotal(value) {
    total = value;
    label.textContent = `0 / ${total}`;
  }

  function update({ index = 0, name = '', status = 'pending' } = {}) {
    let item = items.get(index);
    if (!item) {
      const dot = createElement('span', { className: `badge badge--${status}` });
      const text = createElement('span', { className: 'progress__name', textContent: truncateFileName(name) });
      text.title = name;
      const state = createElement('span', {
        className: 'progress__state',
        textContent: STATUS_LABELS[status] || status,
      });
      item = { dot, state, element: createElement('li', { className: 'progress__item' }, [dot, text, state]) };
      items.set(index, item);
      list.append(item.element);
      list.scrollTop = list.scrollHeight;
    } else {
      item.dot.className = `badge badge--${status}`;
      item.state.textContent = STATUS_LABELS[status] || status;
    }
    fill.style.width = `${Math.round(((index + 1) / Math.max(1, total)) * 100)}%`;
    label.textContent = `${Math.min(index + 1, total)} / ${total}`;
  }

  function finish({ processed = 0, failed = 0, total: doneTotal = total } = {}) {
    fill.style.width = '100%';
    label.textContent = `${processed} / ${doneTotal}${failed ? ` (${failed} failed)` : ''}`;
  }

  function reset() {
    items.clear();
    list.innerHTML = '';
    fill.style.width = '0';
    label.textContent = '0 / 0';
    total = 0;
  }

  const element = createElement('div', { className: 'progress' }, [bar, label, list]);

  return { element, setTotal, update, finish, reset };
}
