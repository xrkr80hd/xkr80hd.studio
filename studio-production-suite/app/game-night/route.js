import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {NextResponse} from 'next/server';
import {gameIdentity,privateHeaders} from '../../lib/game-night-server';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request){const mode=request.nextUrl.searchParams.get('mode');if(mode!=='player'&&mode!=='stage'){const user=await gameIdentity(request);if(!user){const url=new URL('/game-night/login',request.url);return NextResponse.redirect(url);} }
let html=await readFile(path.join(process.cwd(),'public/game-night-assets/index.html'),'utf8');// Version stamp: a fresh visit always loads this deploy's files, and the page can tell when a newer deploy is live.
const version=(process.env.VERCEL_GIT_COMMIT_SHA||process.env.VERCEL_DEPLOYMENT_ID||'dev').slice(0,12);
html=html.replace('<head>','<head><base href="/game-night-assets/"><script>window.GAME_NIGHT_CLOUD=true;window.GAME_NIGHT_VERSION='+JSON.stringify(version)+';</script>').replace('src="app.js"','src="app.js?v='+version+'"').replace('href="style.css"','href="style.css?v='+version+'"');return new NextResponse(html,{headers:{...privateHeaders,'Content-Type':'text/html; charset=utf-8','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'SAMEORIGIN'}});}
