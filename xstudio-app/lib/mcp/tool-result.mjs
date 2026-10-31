// Keep image delivery and the complete MCP envelope budget shared by all tools.
const imageTools=new Set(['get_character_reference','get_character_cref','get_character_anchor','get_asset_identity','manage_asset_identity']);
export function toolResult(name,result){
 const {images,...structured}=result;
 if(name==='get_character_reference'&&(!images?.length||images.some(i=>!i.image_base64||!i.mime_type)))throw Error('Locked character image was not retrieved');
 const content=[{type:'text',text:JSON.stringify(structured)},...(imageTools.has(name)?(images||[]).map(i=>({type:'image',data:i.image_base64,mimeType:i.mime_type})):[])];
 const envelope={content,structuredContent:structured};
 if(Buffer.byteLength(content[0].text)>1_500_000||Buffer.byteLength(JSON.stringify(envelope))>4_000_000)throw Error('Result too large; request metadata only or retrieve fewer original references');
 return envelope;
}
