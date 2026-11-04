/** Keep graph reference sheets out of the teacher document without deleting their contents. */
type Material={title:string;content:string};
type KnowledgeText={name:string;detail:string;rawDetail?:string;selectedMeaning?:string;example:string;rawExample?:string;selectedExamples?:string[]};
export function cleanDocumentText(value:unknown):string{
 return (typeof value==='string'?value:'').replace(/机械性\s*[·•・]\s*教师自编/g,'').replace(/依据《[^》]+》\s*\d+\s*篇/g,'').replace(/[ \t]+\n/g,'\n').trim();
}
export function partitionLessonMaterials(materials:Material[],knowledge:KnowledgeText[]=[],additionalReferenceText:string[]=[]){
 const raw=[...additionalReferenceText,...knowledge.flatMap(item=>[item.selectedMeaning||item.rawDetail||item.detail,...(item.selectedExamples||[]),item.rawExample||item.example])].filter(Boolean).map(text=>text.replace(/\s/g,''));
 const teaching:Material[]=[],evidence:Material[]=[];
 for(const item of materials){
  const title=item.title||'',body=(item.content||'').replace(/\s/g,'');
  const explicitSource=/图谱|知识依据|查询记录|笔顺|笔画顺序|字源/.test(title);
  const referenceTitle=/(?:词汇|生词|语法|汉字|成语|文化).{0,8}(?:释义|原文|清单|知识|解析|资料|结构|例句|词表|表)/.test(title)&&!/活动|角色|信息差|任务|练习|情境/.test(title);
  const plainReference=/^(?:核心)?(?:词汇|生词|语法|汉字|成语|文化)(?:表|点|清单)?$/.test(title);
  const rawOnly=body.length>0&&raw.some(text=>body===text);
  (explicitSource||referenceTitle||plainReference||rawOnly?evidence:teaching).push({...item});
 }
 return {teaching,evidence};
}
