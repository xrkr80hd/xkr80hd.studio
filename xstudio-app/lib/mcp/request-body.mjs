const fail=(message,status)=>{const error=new Error(message);error.status=status;throw error;};
export async function readToolRequest(request){
 const reader=request.body?.getReader();if(!reader)fail('Invalid JSON',400);
 const chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4_000_000){await reader.cancel();fail('Request too large',413);}chunks.push(Buffer.from(value));}
 let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{fail(size>65536?'Request too large':'Invalid JSON',size>65536?413:400);}
 if(size>65536&&!(body?.method==='tools/call'&&body?.params?.name==='import_asset'))fail('Request too large',413);
 return body;
}
