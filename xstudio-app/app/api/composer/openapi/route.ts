import schema from '../../../../integrations/xce-composer/openapi.json';
// Public API contract only. All inventory, reference and composition operations remain authenticated.
export function GET(){return Response.json(schema,{headers:{'Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});}
