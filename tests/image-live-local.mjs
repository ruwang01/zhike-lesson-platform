// Explicit local smoke test: one upstream image request using ignored local credentials.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const a=JSON.parse(await readFile('.admin-access.json','utf8')),base='http://127.0.0.1:5173';
const login=await fetch(base+'/api/account/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({username:a.username,password:a.password})});if(!login.ok)throw Error('本地管理员登录失败：'+login.status);const cookie=login.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
const r=await fetch(base+'/api/media',{method:'POST',headers:{Origin:base,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({kind:'image',text:'画面比例4:3。教材插画，一名学生在公交站查看路线，一辆公交车正在进站，日间，自然友善。不出现文字。'}),signal:AbortSignal.timeout(150000)});
if(!r.ok){const d=await r.json();throw Error(d.error||'图片调用失败：'+r.status)}await mkdir('../image-live-qa',{recursive:true});await writeFile('../image-live-qa/seedream-smoke.png',new Uint8Array(await r.arrayBuffer()));console.log('Live image generation passed:',r.headers.get('content-type'),'model:',decodeURIComponent(r.headers.get('x-media-model')||''));
