import test from 'node:test';
import assert from 'node:assert/strict';
import {assetPreviewReference} from '../lib/xce/asset-preview.mjs';
test('structured assets use attached image instead of their record ID',()=>{assert.equal(assetPreviewReference({id:'character-1',reference_ids:['portrait']},{portrait:{}}),'portrait')});
test('missing stale output falls through to a real attached image',()=>{assert.equal(assetPreviewReference({output_reference_id:'missing',reference_ids:['missing-too','real']},{real:{}}),'real')});
test('approved output wins and raw references still preview themselves',()=>{assert.equal(assetPreviewReference({id:'asset',output_reference_id:'approved',reference_ids:['source']},{approved:{},source:{}}),'approved');assert.equal(assetPreviewReference({id:'upload'},{upload:{}}),'upload')});
test('unattached or foreign references never produce guessed image URLs',()=>{assert.equal(assetPreviewReference({id:'character',reference_ids:['foreign']},{}),null)});
