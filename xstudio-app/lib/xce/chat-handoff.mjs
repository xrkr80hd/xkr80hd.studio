export function chatHandoff({project,name,asset_code}){
 if(!asset_code)throw Error('This asset needs a saved asset code before sending it to ChatGPT.');
 return ['Use the connected XCE — Xstudio Cinematic Engine app.',`Project: ${project}.`,`Asset: ${name||asset_code}.`,`Exact asset code: ${asset_code}.`,'Call XCE resolve_asset_code with this exact code and inspect the returned stored images. This is a private project asset: do not search the web or reconstruct it from its name. If XCE is unavailable, ask me to select or connect the app. Retrieve the asset only; wait for my next instruction before generating or changing anything.'].join('\n');
}
