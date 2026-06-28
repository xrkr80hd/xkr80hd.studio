import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

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

test('uses the same default avatar shown in the blog profile editor when a channel avatar is empty', async () => {
  const response = await fetch('http://localhost:3000/blog/channel/xrkr80hdblog');
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(
    html,
    /class="blog-channel-profile-image" src="\/assets\/cards\/local-blog\.png" alt="xrkr80hdblog profile"/
  );
});

test('keeps the channel hero minimal without the oversized information panel', async () => {
  const response = await fetch('http://localhost:3000/blog/channel/xrkr80hdblog');
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /class="blog-channel-hero-title"><span class="blog-channel-hero-title-text">xrkr80hdblog<\/span><\/h1>/);
  assert.match(html, /aria-label="Back to Blog Channels"/);
  assert.doesNotMatch(html, />Channel Feed</);
  assert.doesNotMatch(html, /Posts published to this dedicated blog channel\./);
});

test('renders each channel profile image inside the cover hero instead of the top identity bar', async () => {
  const source = await readFile(new URL('../app/blog/channel/[slug]/page.js', import.meta.url), 'utf8');
  const topBarStart = source.indexOf('<section className="card blog-channel-top-bar">');
  const heroStart = source.indexOf('<section className="card hero band-hero blog-channel-hero">');

  assert.notEqual(topBarStart, -1, 'expected the channel top bar');
  assert.notEqual(heroStart, -1, 'expected the channel cover hero');

  const topBar = source.slice(topBarStart, source.indexOf('</section>', topBarStart));
  const hero = source.slice(heroStart, source.indexOf('</section>', heroStart));

  assert.doesNotMatch(topBar, /className="blog-channel-profile-image"/);
  assert.match(hero, /className="blog-channel-profile-image"/);
  assert.match(hero, /src=\{channel\.avatar_url\}/);
});

test('keeps the square profile overlay entirely left of the cover midpoint', async () => {
  const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
  const profileRuleStart = css.indexOf('.blog-channel-profile-image {');
  const profileRule = css.slice(profileRuleStart, css.indexOf('}', profileRuleStart));

  assert.match(profileRule, /position:\s*absolute;/);
  assert.match(profileRule, /left:\s*3%;/);
  assert.match(profileRule, /width:\s*min\(22%, 168px\);/);
  assert.match(profileRule, /aspect-ratio:\s*1;/);
});
