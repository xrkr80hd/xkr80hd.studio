import 'server-only';
import {publicEndpoint} from '../../../lib/oauth/http.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const POST=request=>publicEndpoint(request,'revoke');
