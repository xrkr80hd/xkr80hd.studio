import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeCategory,categorySignature,categoryMediaPaths,hasContent} from '../lib/game-night-categories.mjs';
const clue=(q,a,extra={})=>({question:q,answer:a,accepted:'',value:500,dailyDouble:true,...extra});
test('library copies keep words and media but drop game-only fields',()=>{
 const c=normalizeCategory({id:'abc123def',name:'  Family Lore ',clues:[clue('Who?','Grandma',{media:{storagePath:'alice/0f8fad5b-d9cb-469f-a165-70867728950e.jpg',type:'image/jpeg',data:'https://signed'}})]});
 assert.equal(c.id,'abc123def');assert.equal(c.name,'Family Lore');
 assert.deepEqual(Object.keys(c.clues[0]).sort(),['accepted','answer','hint','media','note','question','source']);
 assert.equal(c.clues[0].media.data,undefined);
 assert.deepEqual(categoryMediaPaths(c),['alice/0f8fad5b-d9cb-469f-a165-70867728950e.jpg']);
});
test('invalid categories and media paths are rejected',()=>{
 assert.throws(()=>normalizeCategory({name:'',clues:[clue('a','b')]}),/name/);
 assert.throws(()=>normalizeCategory({name:'x',clues:[]}),/clues/);
 assert.throws(()=>normalizeCategory({name:'x',clues:[clue('a','b',{media:{storagePath:'alice/../bob/x.jpg'}})]}),/media/);
 assert.match(normalizeCategory({id:'bad id!',name:'x',clues:[clue('a','b')]}).id,/^[0-9a-f-]{36}$/);
});
test('signature ignores case and point values so rescued copies are not duplicated',()=>{
 const a=normalizeCategory({name:'Movies',clues:[clue('Q1','A1')]}),b=normalizeCategory({name:'movies',clues:[{...clue('q1','a1'),value:100}]});
 assert.equal(categorySignature(a),categorySignature(b));
 assert.notEqual(categorySignature(a),categorySignature(normalizeCategory({name:'Movies',clues:[clue('Q2','A1')]})));
 assert.equal(hasContent(normalizeCategory({name:'Empty',clues:[clue('','')]})),false);
});
test('builder has an obvious save button, a shared library and no JSON import/export',()=>{
 const app=readFileSync(new URL('../public/game-night-assets/app.js',import.meta.url),'utf8');
 assert.match(app,/💾 Save category/);assert.match(app,/saveSharedCategory/);assert.match(app,/loadSharedCategories/);
 assert.doesNotMatch(app,/Export backup|Import Game|'import'|exportGame/);
 assert.match(app,/categoriesRescued,\.\.\.\(categoriesRescued\?\{\}:\{catalog:legacyCatalog\}\)/);
});
