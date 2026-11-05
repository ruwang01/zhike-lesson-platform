import 'server-only';
import {kg,AppError,type Session} from './server';
let cached:Session|undefined;let pending:Promise<Session>|undefined;
export async function sharedGraphSession():Promise<Session>{
 if(cached&&cached.exp>Date.now()+60000)return cached;
 if(pending)return pending;
 const username=process.env.KG_SERVICE_USERNAME,password=process.env.KG_SERVICE_PASSWORD;
 if(!username||!password)throw new AppError('知识图谱服务尚未配置，请联系管理员。',503);
 pending=(async()=>{const data=await kg('auth/login',{username,password});if(typeof data.access_token!=='string'||!data.user?.id)throw new AppError('图谱认证返回不完整，请联系管理员。',502);cached={token:data.access_token,id:String(data.user.id),name:'共享知识图谱',exp:Date.now()+Math.min(Number(data.expires_in)||3600,86400)*1000};return cached})();
 try{return await pending}finally{pending=undefined}
}

export function invalidateSharedGraph(){cached=undefined}
