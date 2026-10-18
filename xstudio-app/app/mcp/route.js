import 'server-only';
import {gateway} from '../../lib/mcp/server.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
export const POST=request=>gateway(request);
export const GET=request=>gateway(request);
export const DELETE=request=>gateway(request);
export const OPTIONS=request=>gateway(request);
