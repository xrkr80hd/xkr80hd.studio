import 'server-only';
import {authorize} from '../../../lib/oauth/http.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const GET=request=>authorize(request);
export const POST=request=>authorize(request);
