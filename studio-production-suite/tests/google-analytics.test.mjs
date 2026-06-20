import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldTrackGoogleAnalytics } from '../lib/google-analytics.mjs';

test('tracks public website routes', () => {
  assert.equal(shouldTrackGoogleAnalytics('/'), true);
  assert.equal(shouldTrackGoogleAnalytics('/your-local-business'), true);
  assert.equal(shouldTrackGoogleAnalytics('/blog/example-post'), true);
});

test('does not track admin routes', () => {
  assert.equal(shouldTrackGoogleAnalytics('/admin'), false);
  assert.equal(shouldTrackGoogleAnalytics('/admin/login'), false);
  assert.equal(shouldTrackGoogleAnalytics('/admin/blog/new'), false);
});
