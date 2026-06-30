function clean(value) {
  return String(value || '').trim();
}

function compareText(left, right) {
  return clean(left).localeCompare(clean(right), undefined, { sensitivity: 'base' });
}

export function getPublicListingCategories(items = [], options = {}) {
  const getCategory = typeof options.getCategory === 'function' ? options.getCategory : (item) => item?.category;
  const categories = new Map();

  for (const item of items) {
    const category = clean(getCategory(item));
    if (category && !categories.has(category.toLocaleLowerCase())) {
      categories.set(category.toLocaleLowerCase(), category);
    }
  }

  return Array.from(categories.values()).sort(compareText);
}

export function filterAndSortPublicListings(items = [], options = {}) {
  const getName = typeof options.getName === 'function' ? options.getName : (item) => item?.name;
  const getCategory = typeof options.getCategory === 'function' ? options.getCategory : (item) => item?.category;
  const sort = ['az', 'za', 'category'].includes(options.sort) ? options.sort : 'az';
  const category = clean(options.category || 'all');
  const filtered = category.toLocaleLowerCase() === 'all'
    ? [...items]
    : items.filter((item) => compareText(getCategory(item), category) === 0);

  return filtered.sort((left, right) => {
    if (sort === 'category') {
      const byCategory = compareText(getCategory(left), getCategory(right));
      if (byCategory !== 0) return byCategory;
    }

    const byName = compareText(getName(left), getName(right));
    return sort === 'za' ? byName * -1 : byName;
  });
}
