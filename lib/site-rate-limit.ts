import {config,AppError} from './server';
export async function limitRequest(req:Request,kind:string,max:number,subject=''){
 const ip=req.headers.get('x-vercel-forwarded-for')||req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
 const hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(kind+':'+ip+':'+subject))).toString('hex');const bucket=Math.floor(Date.now()/60000),key=hash+':'+bucket;
 const row=await config().DB.prepare('INSERT INTO site_request_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,(bucket+2)*60000).first<{count:number}>();
 if((row?.count||0)>max)throw new AppError('操作过于频繁，请一分钟后重试。',429);
}
