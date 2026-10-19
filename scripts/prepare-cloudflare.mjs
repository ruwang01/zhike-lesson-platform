// Generate a standalone Workers config beside the compiled server entry.
import {readFile,writeFile} from 'node:fs/promises';
const account=process.env.CF_ACCOUNT_ID,db=process.env.CF_D1_DATABASE_ID,origin=process.env.CF_PUBLIC_URL;
if(!/^[a-f0-9]{32}$/i.test(account||''))throw Error('Set CF_ACCOUNT_ID to your Cloudflare account ID.');
if(!/^[a-f0-9-]{36}$/i.test(db||''))throw Error('Set CF_D1_DATABASE_ID to the production D1 database ID.');
let u;try{u=new URL(origin);if(u.protocol!=='https:'||u.pathname!=='/'||u.search||u.hash||u.username||u.password)throw Error()}catch{throw Error('Set CF_PUBLIC_URL to the production HTTPS origin.');}
const c=JSON.parse(await readFile('dist/server/wrangler.json','utf8'));c.name='zhike-lesson-platform';c.keep_vars=true;c.account_id=account;c.d1_databases=[{binding:'DB',database_name:'zhike-lessons',database_id:db,migrations_dir:'../../drizzle'}];c.vars={...(c.vars||{}),AUTH_BASE_URL:u.origin};c.observability={enabled:true,logs:{enabled:false}};
await writeFile('dist/server/wrangler.public.json',JSON.stringify(c,null,2)+'\n');console.log('Standalone Workers deployment configuration prepared.');
