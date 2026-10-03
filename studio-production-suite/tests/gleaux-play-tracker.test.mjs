import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayTracker } from '../lib/gleaux-play-tracker.mjs';
const tick = () => new Promise(resolve => setImmediate(resolve));
test('resume and buffering count once; end/stop replays count again in same browser', async () => {
  const sent = []; let id = 0;
  const tracker = createPlayTracker(async value => sent.push(value), () => String(++id));
  tracker.started(); tracker.started(); tracker.started(); await tick();
  assert.deepEqual(sent, ['1']);
  tracker.reset(); tracker.started(); await tick();
  tracker.reset(); tracker.started(); await tick();
  assert.deepEqual(sent, ['1', '2', '3']);
});
test('retry keeps the event ID and never blocks playback', async () => {
  const sent = [];
  const tracker = createPlayTracker(async value => { sent.push(value); throw new Error('offline'); }, () => 'one-play');
  tracker.started(); await tick();
  assert.deepEqual(sent, ['one-play', 'one-play']);
  tracker.started(); await tick();
  assert.equal(sent.length, 2);
});
