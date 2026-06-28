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
  assert.match(settingsSource, /replaceKey: target === 'avatar' \? `blog-profile-\$\{channelUsername/);
});
