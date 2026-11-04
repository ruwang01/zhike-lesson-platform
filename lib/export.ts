import {characterResourceMaterials} from './character-resources';
import {grammarQuestionMaterials} from './grammar-data';
import {partitionLessonMaterials,cleanDocumentText} from './material-routing';
import type { Draft } from './lesson';
import {lexicalCategories,lexicalSourceLabel} from './lexical';
import {standardNames,checkLesson,placeholderIssues} from './lesson';
import {groundedBlocks,formatTeachingContext} from './evidence';
import {exportToDocx,exportStudentDocx,toEngineCtx,type ApiResponse} from './lib/doc-export';
export type ExportKind='teacher'|'student'|'evidence';
/**
 * 把 Draft 转成引擎认识的 ApiResponse：教案 + 知识 + 教学需求。
 * 展示用的教案必须走标准结构（教学对象/参考教材/课型/课时/教学目标/教学重难点）。
 */
function toApiResponse(d:Draft,includeAnswers=true,includeGraphResources=false):ApiResponse{
 return {lesson:{...d.lesson,materials:includeGraphResources?[...d.lesson.materials,...characterResourceMaterials(d.knowledge),...grammarQuestionMaterials(d.knowledge,includeAnswers)]:partitionLessonMaterials(d.lesson.materials,d.knowledge,(d.culturalEvidence||[]).map(item=>item.sentence)).teaching},knowledge:d.knowledge,culturalEvidence:d.culturalEvidence,brief:{audience:formatTeachingContext(d.brief),referenceMaterial:d.brief.referenceMaterial,minutes:d.brief.minutes,level:d.brief.audience?.level,standard:d.brief.standard,students:d.brief.students,mode:d.brief.mode,courseType:d.brief.courseType},source:d.source,createdAt:d.createdAt,promptVersion:d.promptVersion,model:d.model,reviewed:d.reviewed,validationWarnings:d.validationWarnings};
}

export type DocumentExportOptions={author?:string};
export function teacherExportIssues(d:Draft){return placeholderIssues({...d.lesson,materials:partitionLessonMaterials(d.lesson.materials,d.knowledge,(d.culturalEvidence||[]).map(item=>item.sentence)).teaching})}
export function teacherDocumentContext(d:Draft,options:DocumentExportOptions={}){return toEngineCtx(toApiResponse(d),{author:options.author,courseType:d.brief.courseType})}
export async function makeWord(d:Draft,kind:ExportKind='teacher',options:DocumentExportOptions={}){
 if(kind==='teacher'||kind==='student'){
  // 成品教案不得带占位语：有占位语就不导出，让教师先补写实际内容。
  const issues=kind==='teacher'?teacherExportIssues(d):placeholderIssues(d.lesson);
  if(issues.length)throw new Error(issues[0]);
  // 教师教案与学生任务单统一使用标准结构排版引擎。
  const response=toApiResponse(d,kind==='teacher',kind==='student');
  // 课型写入导出的「三、课型」，不再固定为「综合课」。
  const bytes=kind==='teacher'?exportToDocx(response,{courseType:d.brief.courseType,author:options.author}):exportStudentDocx(response,{courseType:d.brief.courseType,author:options.author});
  return new Blob([bytes as unknown as BlobPart],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
 }
 const {Document,Packer,Paragraph,HeadingLevel,TextRun,Table,TableRow,TableCell,WidthType,AlignmentType,BorderStyle}=await import('docx');
 const font={ascii:'Times New Roman',hAnsi:'Times New Roman',eastAsia:'KaiTi'};
 const p=(s:string,indent=true)=>String(s??'').split('\n').map(line=>new Paragraph({children:[new TextRun({text:line,font,size:24})],indent:indent?{firstLine:440}:undefined,spacing:{after:120,line:360}}));
 const h=(s:string)=>new Paragraph({text:s,heading:HeadingLevel.HEADING_1,keepNext:true,spacing:{before:240,after:140}});
 const sub=(s:string)=>new Paragraph({text:s,heading:HeadingLevel.HEADING_2,keepNext:true,spacing:{before:200,after:100}});
 const title=(s:string)=>new Paragraph({text:s,heading:HeadingLevel.TITLE,alignment:AlignmentType.CENTER});
 const t=(headers:string[],rows:string[][],widths:number[])=>new Table({width:{size:100,type:WidthType.PERCENTAGE},columnWidths:widths,borders:{top:{style:BorderStyle.SINGLE,size:4,color:'000000'},bottom:{style:BorderStyle.SINGLE,size:4,color:'000000'},left:{style:BorderStyle.SINGLE,size:4,color:'000000'},right:{style:BorderStyle.SINGLE,size:4,color:'000000'},insideHorizontal:{style:BorderStyle.SINGLE,size:4,color:'000000'},insideVertical:{style:BorderStyle.SINGLE,size:4,color:'000000'}},rows:[headers,...rows].map((row,i)=>new TableRow({tableHeader:i===0,cantSplit:true,children:row.map((v,n)=>new TableCell({width:{size:widths[n],type:WidthType.DXA},margins:{top:90,bottom:90,left:100,right:100},children:String(v??'').split('\n').map(line=>new Paragraph({children:[new TextRun({text:line,font,size:24,bold:i===0})],spacing:{after:70,line:280}}))}))}))});
 const l=d.lesson,blocks=groundedBlocks(d.knowledge),knowledgeName=(ids:string[])=>ids.map(id=>d.knowledge.find(k=>k.id===id)?.name||'未识别知识').join('、');
 const children:(InstanceType<typeof Paragraph>|InstanceType<typeof Table>)[]=[];
 if(kind==='evidence'){
 children.push(title(l.title+' 知识材料包'),new Paragraph({text:'作者：'+(cleanDocumentText(options.author)||'________'),alignment:AlignmentType.CENTER,children:undefined,style:'Author'}),...p('本附件区分知识图谱原始内容、教师提供的教学要求和模型设计建议。查询成功证明当时取到了节点，不代表数据库本身或所有生成内容绝对无误。'),h('内容来源分类'),t(['内容','来源与处理'],[['释义与例句','下方列出的教师选定图谱原文。模型不改写。'],['学情与预期成果','教师输入，未由图谱核验。'],['活动与角色卡情境','模型或规则模板设计，需教师审核。'],['新编练习与参考答案','生成建议，不属于图谱原题，需核验。']],[2300,7060]),h('已确认知识原文'));
 for(const b of blocks){children.push(sub(`${b.name} ${b.kind}`),...p(`节点：${b.knowledgeId}\n教学分类：${b.role}\n等级体系：${standardNames[b.standard||'']||b.standard||'未知'}\n返回等级：${b.levels.join('、')||'未返回'}\n查询时间：${b.checkedAt}\n来源：${b.source} ${b.url}`,false),...p('本课选定释义：'+(b.meaning||'未提供')),...(b.teacherMeaning?p('教师指定讲解释义（非图谱原文）：'+b.teacherMeaning):[]), ...b.examples.flatMap((s,i)=>p(`原句${i+1}：${s}`,false)),...b.lexicalFeatures.flatMap(f=>p(lexicalCategories[f.category]+'：'+f.value+(f.relationType?'（'+(f.direction==='incoming'?f.value+' → '+b.name:b.name+' → '+f.value)+'；'+f.relationType+'）':'')+(f.detail?'；'+f.detail:'')+(lexicalSourceLabel(f)?'；查询来源：'+lexicalSourceLabel(f):''),false)),...p('查询模板：'+(b.query||'未记录'),false),...p('查询参数：'+JSON.stringify(b.parameters||{}),false))}
 if(!blocks.length)children.push(...p('无已确认原文。未匹配条目或导入后未重新核验的条目，不计入图谱依据。'));
 const selected=d.knowledge.filter(item=>item.verified&&item.scopeConfirmed&&item.role!=='排除');
 const resources=characterResourceMaterials(selected);
 if(resources.length){children.push(h('汉字图谱配套资源'));for(const material of resources)children.push(sub(material.title),...p(material.content,false))}
 const questions=grammarQuestionMaterials(selected,true);
 if(questions.length){children.push(h('图谱关联练习'));questions.forEach((material,index)=>children.push(sub(`练习 ${index+1}`),...p(material.content,false)))}
 if(d.culturalEvidence?.length){children.push(h('文化图谱材料'));for(const item of d.culturalEvidence)children.push(sub(item.name),...p([item.sentence,item.source&&'来源：'+item.source,item.stage&&'文化阶段：'+item.stage,item.level1&&'一级项目：'+item.level1,item.level2&&'二级项目：'+item.level2,'节点：'+item.id].filter(Boolean).join('\n'),false))}
 const moved=partitionLessonMaterials(d.lesson.materials,d.knowledge,(d.culturalEvidence||[]).map(item=>item.sentence)).evidence;
 if(moved.length){children.push(h('草稿中的其他知识资料'),...p('以下资料按草稿原记录保留，使用前请核对来源。'));for(const material of moved)children.push(sub(material.title),...p(material.content,false))}

 children.push(h('未确认知识'),...(d.knowledge.every(k=>k.role==='排除'||(k.verified&&k.scopeConfirmed))?p('无。'):[]),...d.knowledge.filter(k=>k.role!=='排除'&&(!k.verified||!k.scopeConfirmed)).flatMap(k=>p(`${k.name}　${k.verified?'未确认本课义项':'未通过图谱核验'}`,false)),h('检查结果'),...checkLesson(l,d.brief,d.knowledge).flatMap(x=>p(x.text)),h('生成与修订信息'),...p(`方式：${d.source==='template'?'规则模板':'AI设计'}\n模型：${d.model||'历史记录未提供'}\n提示词版本：${d.promptVersion||'历史版本未记录'}\n生成时间：${d.createdAt}\n审核状态：${d.reviewed?'教师已确认':'待教师审核'}`,false),...p(l.notes));
 }
 return Packer.toBlob(new Document({styles:{default:{document:{run:{font,size:24,color:'000000'},paragraph:{spacing:{line:360}}}},paragraphStyles:[{id:'Author',name:'Author',basedOn:'Normal',next:'Normal',run:{font,size:28,color:'000000'},paragraph:{spacing:{after:260}}},{id:'Title',name:'Title',basedOn:'Normal',next:'Normal',run:{font,size:44,bold:true,color:'000000'},paragraph:{spacing:{after:260}}},{id:'Heading1',name:'Heading 1',basedOn:'Normal',next:'Normal',run:{font,size:28,bold:true,color:'000000'},paragraph:{keepNext:true}},{id:'Heading2',name:'Heading 2',basedOn:'Normal',next:'Normal',run:{font,size:24,bold:true,color:'000000'},paragraph:{keepNext:true}}]},sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1440,bottom:1440,left:1803,right:1803}}},children}]}));
}
export async function exportWord(d:Draft,kind:ExportKind='teacher',options:DocumentExportOptions={}){download(await makeWord(d,kind,options),d.lesson.title+{teacher:'-教师教案',student:'-学生材料',evidence:'-知识材料包'}[kind]+'.docx')}
export function download(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name.replace(/[\\/:*?"<>|]/g,'-');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
