import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const helperUrl = new URL('../lib/business-listing.mjs', import.meta.url);

test('business directory supports A-Z, Z-A, category ordering, and filtering without mutating data', async () => {
  assert.equal(existsSync(helperUrl), true, 'business listing helper must exist');
  const { filterAndSortBusinesses } = await import(helperUrl.href);
  const items = [
    { name: 'Zulu', category: 'Food' },
    { name: 'Alpha', category: 'Studio' },
    { name: 'Beta', category: 'Food' },
  ];
  const snapshot = structuredClone(items);

  assert.deepEqual(filterAndSortBusinesses(items, { sort: 'az' }).map((item) => item.name), ['Alpha', 'Beta', 'Zulu']);
  assert.deepEqual(filterAndSortBusinesses(items, { sort: 'za' }).map((item) => item.name), ['Zulu', 'Beta', 'Alpha']);
  assert.deepEqual(filterAndSortBusinesses(items, { sort: 'category' }).map((item) => item.name), ['Beta', 'Zulu', 'Alpha']);
  assert.deepEqual(filterAndSortBusinesses(items, { sort: 'az', category: 'Food' }).map((item) => item.name), ['Beta', 'Zulu']);
  assert.deepEqual(items, snapshot);
});

test('business categories are trimmed, deduplicated, and alphabetical', async () => {
  assert.equal(existsSync(helperUrl), true, 'business listing helper must exist');
  const { getBusinessCategories } = await import(helperUrl.href);

  assert.deepEqual(
    getBusinessCategories([{ category: ' Studio ' }, { category: 'Food' }, { category: 'studio' }, { category: '' }]),
    ['Food', 'Studio']
  );
});

test('business page exposes public sort and category controls', async () => {
  const page = await readFile(new URL('../app/your-local-business/page.js', import.meta.url), 'utf8');

  assert.match(page, /filterAndSortBusinesses/);
  assert.match(page, /getBusinessCategories/);
  assert.match(page, /value="az">A-Z/);
  assert.match(page, /value="za">Z-A/);
  assert.match(page, /value="category">Category/);
  assert.match(page, /<option value="all">All categories<\/option>/);
});
