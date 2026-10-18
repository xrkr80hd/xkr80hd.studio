// Stream verified exports instead of buffering one function response above 4.5 MB.
export function byteStream(bytes){let offset=0;return new ReadableStream({pull(controller){if(offset>=bytes.length){controller.close();return}const end=Math.min(offset+65536,bytes.length);controller.enqueue(bytes.subarray(offset,end));offset=end}})}
