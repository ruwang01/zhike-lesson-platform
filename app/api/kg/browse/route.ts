import {z} from 'zod';
import {body,json,failure,session,kg,AppError} from '@/lib/server';
import {independentQuery,searchLabels,type SearchKind,type GraphResult} from '@/lib/independent-search';
export const maxDuration=120;
const input=z.object({kind:z.enum(['characters','vocabulary','grammar','culture']),keyword:z.string().trim().min(1,'请输入检索关键词。').max(80),page:z.number().int().min(0).max(10000).default(0)});
const props=(node:any)=>node?.properties||node?.data||node||{};
export async function POST(request:Request){try{
 const parsed=input.safeParse(await body(request));if(!parsed.success)throw new AppError('请输入 1–80 个字符的关键词。');
 const {kind,keyword,page}=parsed.data,user=(await session())!;
 const data=await kg('intelligent/execute-cypher',{cypher:independentQuery(kind),parameters:{keyword,skip:page*20},limit:21},user.token);
 if(!Array.isArray(data.records))throw new AppError('图谱返回格式异常，请重试。',502);
 const results:GraphResult[]=data.records.slice(0,20).map((row:any)=>{const node=row.n||row.node||row,p=props(node),labels=node.labels||row.labels||[];const label=searchLabels[kind].find(x=>labels.includes(x));if(!label||typeof p.name!=='string')throw new AppError('图谱节点格式无法识别，请联系管理员。',502);const text=(...keys:string[])=>String(keys.map(k=>p[k]).find(v=>v!==undefined&&v!==null)||'').slice(0,10000);return {id:String(p.nodeId??p.id??node.id??`${label}:${p.name}`),kind:label,name:p.name,detail:text('meaning','content','definition','allusion'),example:text('sentence'),relations:[]}});
 // Query only relationships visible to this account, without teaching or model filters.
 if(results.length){const relations=await kg('intelligent/execute-cypher',{cypher:`MATCH (n)-[r]-(m) WHERE (${searchLabels[kind as SearchKind].map(x=>`n:${x}`).join(' OR ')}) AND n.name IN $names RETURN n, m, type(r) AS relationType LIMIT 400`,parameters:{names:results.map(r=>r.name)},limit:400},user.token);if(!Array.isArray(relations.records))throw new AppError('知识关系返回格式异常，请重试。',502);for(const row of relations.records){const n=props(row.n),m=props(row.m);for(const item of results.filter(x=>x.name===n.name)){if(typeof m.name==='string')item.relations.push({type:String(row.relationType||'关联'),name:m.name,detail:String(m.meaning||m.content||m.sentence||'').slice(0,1000)})}}}
 return json({results,hasMore:data.records.length>20});
}catch(error){return failure(error)}}
