import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), 'utf8');
}

test('blog channels use compact horizontal cards with 16:9 media', async () => {
  const [page, css] = await Promise.all([source('app/blog/page.js'), source('app/globals.css')]);

  assert.match(page, /public-listing-card public-listing-card--wide blog-channel-card/);
  assert.match(page, /className="public-listing-card-media blog-channel-card-media/);
  assert.match(page, /className="public-listing-card-content blog-channel-card-content"/);
  assert.match(css, /\.public-listing-card--wide\s+\.public-listing-card-media\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*9/s);
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
});

test('every public listing title is first in its content area', async () => {
  const pages = await Promise.all([
    source('app/blog/page.js'),
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
