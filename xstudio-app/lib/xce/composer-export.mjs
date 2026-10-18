import {zipSync,strToU8} from 'fflate';
import {createHash} from 'node:crypto';
import {OUTPUT_SCHEMA,SOURCE_DIRECTIVE} from './composer.mjs';
import {validate} from './tools.mjs';
export function compositionBundle(output,images){
 validate(OUTPUT_SCHEMA,output);if(!output.final_cinematic_prompt.startsWith(SOURCE_DIRECTIVE))throw Error('Mandatory source directive missing');
 const expected=output.reference_validation.references,files={},paths={};if(images.length!==expected.length)throw Error('Reference bundle count mismatch');
 for(const i of images){const ref=expected.find(r=>r.reference_id===i.reference_id);if(!ref||ref.sha256!==createHash('sha256').update(i.bytes).digest('hex'))throw Error('Export image verification mismatch');const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[i.mime_type];if(!ext)throw Error('Unsupported image type');const path='images/'+i.reference_id.replace(/[^\w-]/g,'_')+'.'+ext;if(files[path])throw Error('Reference export path collision');files[path]=i.bytes;paths[i.reference_id]=path;}
 files['composition.json']=strToU8(JSON.stringify(output,null,2));files['prompt.txt']=strToU8(output.final_cinematic_prompt);files['reference-map.json']=strToU8(JSON.stringify(paths,null,2));files['README.txt']=strToU8('XCE_COMPOSER: Upload the supplied images using reference-map.json when executing prompt.txt. The JSON contains authenticated resource URLs that require your XSTUDIO session. This package does not generate images or establish visual fidelity.');return zipSync(files,{level:0});
}
