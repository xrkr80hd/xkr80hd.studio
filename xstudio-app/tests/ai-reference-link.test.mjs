import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AI_REFERENCE_LINK_SECONDS, SIGNED_URL_SECONDS, isAiReferenceEligible } from '../lib/xstudio-validation.mjs';

const ready = { status: 'ready', storage_path: 'owner/object', mime_type: 'image/png' };

test('only ready, stored, supported images can get an AI reference link', () => {
  assert.equal(isAiReferenceEligible(ready), true);
  for (const mime_type of ['image/jpeg', 'image/webp', 'image/gif', 'IMAGE/PNG']) assert.equal(isAiReferenceEligible({ ...ready, mime_type }), true);
  for (const mime_type of ['video/mp4', 'audio/mpeg', 'application/pdf', 'image/svg+xml', '', undefined]) assert.equal(isAiReferenceEligible({ ...ready, mime_type }), false);
  assert.equal(isAiReferenceEligible({ ...ready, status: 'pending' }), false);
  assert.equal(isAiReferenceEligible({ ...ready, storage_path: '' }), false);
  assert.equal(isAiReferenceEligible(null), false);
});

test('AI reference links expire, and live longer than the 60-second open link', () => {
  assert.equal(AI_REFERENCE_LINK_SECONDS, 3600);
  assert.ok(AI_REFERENCE_LINK_SECONDS > SIGNED_URL_SECONDS);
});

test('reference-link route stays owner-only, origin-checked, scoped to the owner row, inline and read-only', () => {
  const src = readFileSync(new URL('../app/api/assets/[id]/reference-link/route.js', import.meta.url), 'utf8');
  assert.match(src, /export async function POST/);
  assert.doesNotMatch(src, /export async function (GET|PUT|PATCH|DELETE)/);
  assert.match(src, /isTrustedOrigin\(request\)/);
  assert.match(src, /requireOwner\(\)/);
  assert.match(src, /\.eq\('owner_id', context\.user\.id\)/);
  assert.match(src, /createSignedUrl\(found\.data\.storage_path, AI_REFERENCE_LINK_SECONDS\)/);
  assert.doesNotMatch(src, /download:\s*true|service_role|SERVICE_ROLE|\.upload\(|\.remove\(|\.update\(|\.insert\(/);
});
