import type { Knowledge } from './lesson';
import { kg,AppError } from './server';
const levels=['InternationalLevel','HSKLevel','HSK30Level'];
const relationNames:Record<string,string>={NEAR_SYNONYMOUS_WITH:'同近义',ANTITHESIS_WITH:'反义',CO_OCCURS_WITH:'共现',CULTURAL_CORRELATION:'文化关联',QUESTION_GRAMMAR:'关联试题',DEPENDS_ON:'汉字学习依赖'};
export async function searchGraph(token:string,terms:string[],standard:string):Promise<Knowledge[]>{
 if(!levels.includes(standard)||terms.length>20||terms.some(t=>!t||t.length>80))throw new AppError('查询条件无效。');
 // All labels, properties and relationship names come from the supplied Schema. No model-generated Cypher is executed.
 const query=`MATCH (n) WHERE (n:Word OR n:Grammar OR n:Character) AND n.name IN $terms RETURN n LIMIT 60`;
 const d=await kg('intelligent/execute-cypher',{cypher:query,parameters:{terms},limit:60},token);
 const rows=d.records;if(!Array.isArray(rows))throw new AppError('图谱查询结果结构异常。',502);
 
 const result:Knowledge[]=rows.map((r:any):Knowledge=>{const node=r.n||{};const p=node.properties||node;const kind=(node.labels||[]).find((s:string)=>['Word','Grammar','Character'].includes(s))||'Word';return {id:`${kind}:${p.id||p.name}`,kind,name:String(p.name||''),role:'核心',verified:true,detail:String(p.meaning||p.content||p.definition||'').slice(0,10000),rawDetail:String(p.meaning||p.content||p.definition||'').slice(0,10000),example:String(p.sentence||'').slice(0,10000),rawExample:String(p.sentence||'').slice(0,10000),selectedMeaning:'',selectedExamples:[],scopeConfirmed:false,evidence:{standard,parameters:{terms},queries:[query]},levels:[],relations:[],query,checkedAt:new Date().toISOString()}}).filter((k:Knowledge)=>!!k.name);
 const levelQuery=`MATCH (n)-[r:FROM_LEVEL]->(m:${standard}) WHERE (n:Word OR n:Grammar OR n:Character) AND n.name IN $terms RETURN n, r, m LIMIT 100`;
 const ld=await kg('intelligent/execute-cypher',{cypher:levelQuery,parameters:{terms},limit:100},token);
 for(const row of ld.records||[]){const p=row.n?.properties||row.n||{},m=row.m?.properties||row.m||{};for(const item of result.filter(x=>x.name===p.name&&(!row.n?.labels||row.n.labels.includes(x.kind))))if(m.name&&!item.levels.includes(String(m.name)))item.levels.push(String(m.name))}
 const related=await Promise.all(Object.keys(relationNames).map(async type=>{
 const relQuery=`MATCH (n)-[:${type}]${type==='DEPENDS_ON'?'->':'-'}(m) WHERE (n:Word OR n:Grammar OR n:Character) AND n.name IN $terms RETURN n, m LIMIT 30`;
 const rd=await kg('intelligent/execute-cypher',{cypher:relQuery,parameters:{terms},limit:30},token);
 return {type,rows:rd.records||[]};
 }));
 for(const {type,rows} of related)for(const row of rows){const node=row.n||{},p=node.properties||node,m=row.m?.properties||row.m||{};const kind=(node.labels||[]).find((s:string)=>['Word','Grammar','Character'].includes(s));for(const item of result.filter(x=>x.name===p.name&&(!kind||x.kind===kind)&&x.relations.length<8)){const name=String(m.name||m.content||m.stem||'').slice(0,300);if(name&&!item.relations.some(x=>x.type===relationNames[type]&&x.name===name))item.relations.push({type:relationNames[type],name,detail:String(m.sentence||m.desc||'').slice(0,700)})}}
 for(const item of result)item.evidence!.queries.push(levelQuery);
 return result;
}
