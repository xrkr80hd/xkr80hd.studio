import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), 'utf8');
}

test('blog listing keeps its dedicated layout while adding public controls', async () => {
  const page = await source('app/blog/page.js');

  assert.match(page, /className="blog-channel-card"/);
  assert.doesNotMatch(page, /public-listing-card/);
  assert.match(page, /PublicDirectoryControls/);
});

test('blog channel cards use a large 16:9 media lane without capped dead space', async () => {
  const css = await source('app/globals.css');
  const gridRuleIndex = css.indexOf('.blog-channel-grid {');
  const cardRuleIndex = css.indexOf('.blog-channel-card {', gridRuleIndex);
  const mobileRuleIndex = css.indexOf('@media (max-width: 760px)', cardRuleIndex);
  const imageRuleIndex = css.indexOf('.blog-channel-card-image {', cardRuleIndex);
  const gridRule = css.slice(gridRuleIndex, css.indexOf('}', gridRuleIndex) + 1);
  const cardRule = css.slice(cardRuleIndex, css.indexOf('}', cardRuleIndex) + 1);
  const mobileRule = css.slice(mobileRuleIndex, css.indexOf('}', css.indexOf('.blog-channel-card .actions .button', mobileRuleIndex)) + 1);
  const imageRule = css.slice(imageRuleIndex, css.indexOf('}', imageRuleIndex) + 1);

  assert.match(gridRule, /width:\s*100%/);
  assert.match(cardRule, /grid-template-columns:\s*minmax\(300px,\s*44%\)\s+minmax\(0,\s*1fr\)/);
  assert.match(imageRule, /grid-area:\s*media/);
  assert.match(imageRule, /aspect-ratio:\s*16\s*\/\s*9/);
  assert.match(cardRule, /grid-template-rows:\s*min-content\s+min-content\s+min-content/);
  assert.match(imageRule, /max-width:\s*none/);
  assert.match(mobileRule, /grid-template-columns:\s*clamp\(112px,\s*34vw,\s*150px\)\s+minmax\(0,\s*1fr\)/);
  assert.match(mobileRule, /grid-template-areas:\s*"media title"\s*"media meta"\s*"media actions"/);
  assert.match(mobileRule, /max-width:\s*150px/);
  assert.match(mobileRule, /font-size:\s*0\.58rem/);
});

test('owner-managed public listings share compact horizontal cards with 1:1 media', async () => {
  const [bands, artists, podcasts, business, css] = await Promise.all([
    source('components/BandGridPage.jsx'),
    source('app/your-local-artists/page.js'),
    source('app/podcast/page.js'),
    source('app/your-local-business/page.js'),
    source('app/globals.css'),
  ]);

  for (const page of [bands, artists, podcasts, business]) {
    assert.match(page, /public-listing-card public-listing-card--square/);
    assert.match(page, /public-listing-card-media/);
    assert.match(page, /public-listing-card-content/);
  }

  assert.match(css, /\.public-listing-card--square\s+\.public-listing-card-media\s*\{[^}]*aspect-ratio:\s*1/s);
  assert.match(css, /\.public-listing-card\s*\{[^}]*display:\s*grid[^}]*overflow:\s*hidden/s);
  assert.match(css, /@media\s*\(max-width:\s*620px\)[\s\S]*\.public-listing-card[\s\S]{0,260}grid-template-columns:\s*auto\s+minmax\(0,\s*1fr\)/);
  assert.match(css, /@media\s*\(max-width:\s*620px\)[\s\S]*\.public-listing-card[\s\S]{0,320}height:\s*clamp\(104px,\s*31vw,\s*124px\)/);
});

test('public listing grid is authoritatively one full-width horizontal card per row', async () => {
  const css = await source('app/globals.css');
  const legacyGridIndex = css.lastIndexOf('.band-grid {');
  const sharedGridIndex = css.lastIndexOf('.band-grid.public-listing-grid {');
  const sharedCardIndex = css.lastIndexOf('.public-listing-card.band-card');
  const sharedGridRule = css.slice(sharedGridIndex, css.indexOf('}', sharedGridIndex) + 1);
  const sharedCardRule = css.slice(sharedCardIndex, css.indexOf('}', sharedCardIndex) + 1);

  assert.ok(sharedGridIndex > legacyGridIndex, 'shared one-column grid must follow the legacy auto-fill grid');
  assert.match(sharedGridRule, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(sharedGridRule, /width:\s*100%/);
  assert.match(sharedCardRule, /display:\s*grid/);
  assert.match(sharedCardRule, /grid-template-columns:\s*auto\s+minmax\(0,\s*1fr\)/);
  assert.match(sharedCardRule, /width:\s*100%/);
});

test('every public listing title is first in its content area', async () => {
  const pages = await Promise.all([
    source('components/BandGridPage.jsx'),
    source('app/your-local-artists/page.js'),
    source('app/podcast/page.js'),
    source('app/your-local-business/page.js'),
  ]);

  for (const page of pages) {
    assert.match(page, /public-listing-card-content[^>]*>\s*<h3/s);
  }
});

test('podcast cards include a short what-it-is-about description', async () => {
  const page = await source('app/podcast/page.js');

  assert.match(page, /podcast\.description/);
  assert.match(page, /podcast\.summary/);
  assert.match(page, /public-listing-card-description/);
});

test('admin upload guidance matches the 1:1 public card artwork contract', async () => {
  const [guide, input, bandForm] = await Promise.all([
    source('components/AdminMediaGuide.jsx'),
    source('components/MediaUrlInput.jsx'),
    source('components/AdminBandCrudForm.jsx'),
  ]);

  assert.match(guide, /slot: 'Band Card Image', ratio: '1:1', size: '1200x1200'/);
  assert.match(guide, /slot: 'Podcast Cover Image', ratio: '1:1', size: '1200x1200'/);
  assert.match(input, /key\.includes\('band-image'\).*Recommended 1:1 at 1200x1200/);
  assert.match(input, /key\.includes\('podcast'\).*Recommended 1:1 at 1200x1200/);
  assert.match(bandForm, /Card 1200x1200 \(1:1\)/);
});

test('public sharing pages expose business-style sort and category controls below their heroes', async () => {
  const [legends, scene, artists, blog, podcast, bandGrid] = await Promise.all([
    source('app/local-legends-archive/page.js'),
    source('app/your-local-scene/page.js'),
    source('app/your-local-artists/page.js'),
    source('app/blog/page.js'),
    source('app/podcast/page.js'),
    source('components/BandGridPage.jsx'),
  ]);

  for (const page of [legends, scene, artists, blog, podcast, bandGrid]) {
    assert.match(page, /searchParams/);
  }

  for (const page of [artists, blog, podcast, bandGrid]) {
    assert.match(page, /PublicDirectoryControls/);
    assert.match(page, /filterAndSortPublicListings/);
    assert.match(page, /getPublicListingCategories/);
  }
});

test('shared public directory sorting supports A-Z, Z-A, category order, and category filters', async () => {
  const helper = await import(new URL('../lib/public-directory-listing.mjs', import.meta.url).href);
  const items = [
    { name: 'Zulu', genre: 'Rock' },
    { name: 'Alpha', genre: 'Metal' },
    { name: 'Beta', genre: 'Rock' },
  ];
  const snapshot = structuredClone(items);
  const options = {
    getName: (item) => item.name,
    getCategory: (item) => item.genre,
  };

  assert.deepEqual(helper.filterAndSortPublicListings(items, { ...options, sort: 'az' }).map((item) => item.name), ['Alpha', 'Beta', 'Zulu']);
  assert.deepEqual(helper.filterAndSortPublicListings(items, { ...options, sort: 'za' }).map((item) => item.name), ['Zulu', 'Beta', 'Alpha']);
  assert.deepEqual(helper.filterAndSortPublicListings(items, { ...options, sort: 'category' }).map((item) => item.name), ['Alpha', 'Beta', 'Zulu']);
  assert.deepEqual(helper.filterAndSortPublicListings(items, { ...options, category: 'Rock' }).map((item) => item.name), ['Beta', 'Zulu']);
  assert.deepEqual(helper.getPublicListingCategories(items, options), ['Metal', 'Rock']);
  assert.deepEqual(items, snapshot);
});
