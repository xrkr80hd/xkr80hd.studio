import {randomBytes,createHash} from 'node:crypto';
// Local output only. Run in a private terminal, never in a logged CI job.
const projects=process.argv.slice(2);
if(!projects.length||projects.some(p=>!/^[\w-]{1,80}$/.test(p)))throw Error('Usage: node scripts/create-mcp-grant.mjs PROJECT_ID [PROJECT_ID...]');
const token='xmc_'+randomBytes(32).toString('hex');
console.log(JSON.stringify({client_token:token,grant:{type:'api',token_sha256:createHash('sha256').update(token).digest('hex'),projects,expires_at:new Date(Date.now()+30*86400000).toISOString()}},null,2));
