import schema from '../../../../../integrations/xce-script/openapi.json';
export function GET(){return Response.json(schema,{headers:{'Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}})}
