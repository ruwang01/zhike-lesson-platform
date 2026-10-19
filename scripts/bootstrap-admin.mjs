// Local setup helper; reads credentials from an ignored file and never prints them.
import {readFile} from 'node:fs/promises';
const data=JSON.parse(await readFile('.admin-access.json','utf8'));
const vars=await readFile('.dev.vars','utf8');
const secret=vars.match(/^ADMIN_SETUP_SECRET=(.*)$/m)?.[1]?.replace(/^['"]|['"]$/g,'');
if(!secret)throw Error('ADMIN_SETUP_SECRET is missing');
const base='http://127.0.0.1:5173';
const r=await fetch(base+'/api/admin/setup',{method:'POST',headers:{Origin:base,'Content-Type':'application/json','X-Setup-Secret':secret},body:JSON.stringify(data)});
if(!r.ok){const d=await r.json();throw Error(d.error||'Setup failed')}
console.log('Administrator initialized; credentials are in the ignored local .admin-access.json file.');
