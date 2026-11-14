import {NextResponse} from 'next/server';
export const runtime='nodejs';export const dynamic='force-dynamic';
// Lets an open Game Night page notice that a newer version has been deployed.
export function GET(){return NextResponse.json({version:(process.env.VERCEL_GIT_COMMIT_SHA||process.env.VERCEL_DEPLOYMENT_ID||'dev').slice(0,12)},{headers:{'Cache-Control':'no-store'}});}
