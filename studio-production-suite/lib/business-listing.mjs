function clean(value) {
  return String(value || '').trim();
}

function compareText(left, right) {
  return clean(left).localeCompare(clean(right), undefined, { sensitivity: 'base' });
}

export function getBusinessCategories(items = []) {
  const categories = new Map();

  for (const item of items) {
    const category = clean(item?.category);
    if (category && !categories.has(category.toLocaleLowerCase())) {
      categories.set(category.toLocaleLowerCase(), category);
    }
  }

  return Array.from(categories.values()).sort(compareText);
}

export function filterAndSortBusinesses(items = [], options = {}) {
  const category = clean(options.category || 'all');
  const sort = ['az', 'za', 'category'].includes(options.sort) ? options.sort : 'az';
  const filtered = category.toLocaleLowerCase() === 'all'
    ? [...items]
    : items.filter((item) => clean(item?.category).localeCompare(category, undefined, { sensitivity: 'base' }) === 0);

  return filtered.sort((left, right) => {
    if (sort === 'category') {
      const byCategory = compareText(left?.category, right?.category);
      return byCategory || compareText(left?.name, right?.name);
    }

    const byName = compareText(left?.name, right?.name);
    return sort === 'za' ? -byName : byName;
  });
}
