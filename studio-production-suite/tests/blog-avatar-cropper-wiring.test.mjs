import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('routes shared blog avatar selections through the cropper without changing cover uploads', async () => {
  const settingsSource = await readFile(new URL('../components/AdminBlogChannelSettings.jsx', import.meta.url), 'utf8');

  assert.match(settingsSource, /import BlogAvatarCropper from '\.\/BlogAvatarCropper';/);
  assert.match(settingsSource, /setAvatarCropFile\(file\);/);
  assert.match(settingsSource, /<BlogAvatarCropper/);
  assert.match(settingsSource, /handleImageUpload\(croppedFile, 'avatar'\)/);
  assert.match(settingsSource, /handleImageUpload\(file, 'cover'\)/);
});

test('provides labelled square crop controls with zoom, cancel, and upload actions', async () => {
  const cropperSource = await readFile(new URL('../components/BlogAvatarCropper.jsx', import.meta.url), 'utf8');

  assert.match(cropperSource, /role="dialog"/);
  assert.match(cropperSource, /aria-modal="true"/);
  assert.match(cropperSource, /type="range"/);
  assert.match(cropperSource, />Cancel</);
  assert.match(cropperSource, /Crop & Upload/);
});

test('keeps cropped blog avatars isolated from homepage profile settings', async () => {
  const settingsSource = await readFile(new URL('../components/AdminBlogChannelSettings.jsx', import.meta.url), 'utf8');

  assert.match(settingsSource, /fetch\('\/api\/admin\/blog\/channel'/);
  assert.doesNotMatch(settingsSource, /\/api\/admin\/site-profile/);
  assert.match(
    settingsSource,
    /replaceKey:\s*target === 'avatar'\s*\?\s*`images\/blog-channels\/blog-profile-\$\{channelUsername/
  );
});

test('persists a cropped avatar to the blog channel before reporting upload success', async () => {
  const settingsSource = await readFile(new URL('../components/AdminBlogChannelSettings.jsx', import.meta.url), 'utf8');

  assert.match(settingsSource, /async function persistBlogChannelProfile/);
  assert.match(settingsSource, /method:\s*'PUT'/);
  assert.match(
    settingsSource,
    /await persistBlogChannelProfile\(\{[\s\S]*?avatarUrl:\s*cacheBustedUrl,[\s\S]*?\}\)/
  );
  assert.match(settingsSource, /setStatus\('Profile image saved!'\)/);
});

test('closes the crop dialog only after the cropped avatar is persisted', async () => {
  const settingsSource = await readFile(new URL('../components/AdminBlogChannelSettings.jsx', import.meta.url), 'utf8');

  assert.match(
    settingsSource,
    /const persisted = await handleImageUpload\(croppedFile, 'avatar'\);[\s\S]*?if \(persisted\) setAvatarCropFile\(null\);/
  );
});

test('shows avatar upload failures inside the crop dialog while it remains open', async () => {
  const settingsSource = await readFile(new URL('../components/AdminBlogChannelSettings.jsx', import.meta.url), 'utf8');
  const cropperSource = await readFile(new URL('../components/BlogAvatarCropper.jsx', import.meta.url), 'utf8');

  assert.match(settingsSource, /<BlogAvatarCropper[\s\S]*?status=\{status\}/);
  assert.match(cropperSource, /export default function BlogAvatarCropper\(\{[\s\S]*?status/);
  assert.match(cropperSource, /className="meta blog-avatar-crop-status"/);
  assert.match(cropperSource, /\{status\}/);
});

test('returns the same effective cover to the admin profile that the public channel serves', async () => {
  const routeSource = await readFile(new URL('../app/api/admin/blog/channel/route.js', import.meta.url), 'utf8');

  assert.match(routeSource, /function withDefaultChannelImages/);
  assert.match(routeSource, /OWNER_BLOG_CHANNEL_COVER_IMAGE/);
  assert.match(routeSource, /BLOG_CHANNEL_DEFAULT_CARD_IMAGE/);
  assert.match(routeSource, /withDefaultChannelImages\(response\.data \|\| defaultChannelItem\(actingUser\), actingUser\)/);
});
