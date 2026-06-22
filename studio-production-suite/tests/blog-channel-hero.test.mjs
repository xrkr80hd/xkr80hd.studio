import test from 'node:test';
import assert from 'node:assert/strict';

test('uses the dedicated XRKR80HDBLOG cover in the owner channel hero', async () => {
  const response = await fetch('http://localhost:3000/blog/channel/xrkr80hdblog');
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(
    html,
    /class="blog-channel-hero-image" src="\/assets\/blog\/xrkr80hdblog\.png"/
  );
  assert.doesNotMatch(
    html,
    /class="blog-channel-hero-image" src="\/assets\/cards\/local-blog\.png"/
  );
});

test('keeps the channel hero minimal without the oversized information panel', async () => {
  const response = await fetch('http://localhost:3000/blog/channel/xrkr80hdblog');
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /class="blog-channel-hero-title">xrkr80hdblog<\/h1>/);
  assert.match(html, /class="button blog-back-button"/);
  assert.doesNotMatch(html, />Channel Feed</);
  assert.doesNotMatch(html, /Posts published to this dedicated blog channel\./);
  assert.doesNotMatch(html, /aria-label="Breadcrumb"/);
});
