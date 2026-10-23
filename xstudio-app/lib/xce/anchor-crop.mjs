// Crop coordinates are image fractions, independent of responsive preview size.
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function initialCrop(width,height){const side=Math.min(width,height)*0.8;return {x:(width-side)/2/width,y:(height-side)/2/height,w:side/width,h:side/height};}
export function adjustCrop(start,handle,dx,dy,width,height,square=false){
 const minX=Math.min(24/width,0.1),minY=Math.min(24/height,0.1);
 if(handle==='move')return {...start,x:clamp(start.x+dx,0,1-start.w),y:clamp(start.y+dy,0,1-start.h)};
 let left=start.x,top=start.y,right=start.x+start.w,bottom=start.y+start.h;
 if(handle.includes('w'))left=clamp(left+dx,0,right-minX);
 if(handle.includes('e'))right=clamp(right+dx,left+minX,1);
 if(handle.includes('n'))top=clamp(top+dy,0,bottom-minY);
 if(handle.includes('s'))bottom=clamp(bottom+dy,top+minY,1);
 if(square){
  const horizontal=handle.includes('e')||handle.includes('w');
  let side=horizontal?(right-left)*width:(bottom-top)*height;
  const ax=handle.includes('w')?start.x+start.w:start.x,ay=handle.includes('n')?start.y+start.h:start.y;
  side=Math.min(side,(handle.includes('w')?ax:1-ax)*width,(handle.includes('n')?ay:1-ay)*height);
  left=handle.includes('w')?ax-side/width:ax;right=left+side/width;
  top=handle.includes('n')?ay-side/height:ay;bottom=top+side/height;
 }
 return {x:left,y:top,w:right-left,h:bottom-top};
}
export function cropPixels(crop,width,height){const x=clamp(Math.round(crop.x*width),0,width-1),y=clamp(Math.round(crop.y*height),0,height-1);return {x,y,width:clamp(Math.round(crop.w*width),1,width-x),height:clamp(Math.round(crop.h*height),1,height-y)};}
