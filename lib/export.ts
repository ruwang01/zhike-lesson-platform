import type { Draft } from './lesson';
import {standardNames,checkLesson} from './lesson';
import {groundedBlocks} from './evidence';
export type ExportKind='teacher'|'student'|'evidence';
export async function makeWord(d:Draft,kind:ExportKind='teacher'){
 const {Document,Packer,Paragraph,HeadingLevel,TextRun,Table,TableRow,TableCell,WidthType,ShadingType,AlignmentType,BorderStyle}=await import('docx');
 const font={ascii:'Arial',hAnsi:'Arial',eastAsia:'Hiragino Sans GB'};
 const p=(s:string,indent=true)=>s.split('\n').map(line=>new Paragraph({children:[new TextRun({text:line,font,size:22})],indent:indent?{firstLine:440}:undefined,spacing:{after:120,line:340}}));
 const h=(s:string)=>new Paragraph({text:s,heading:HeadingLevel.HEADING_1,keepNext:true,spacing:{before:240,after:140}});
 const sub=(s:string)=>new Paragraph({text:s,heading:HeadingLevel.HEADING_2,keepNext:true,spacing:{before:200,after:100}});
 const title=(s:string)=>new Paragraph({text:s,heading:HeadingLevel.TITLE});
 const t=(headers:string[],rows:string[][],widths:number[])=>new Table({width:{size:100,type:WidthType.PERCENTAGE},columnWidths:widths,borders:{top:{style:BorderStyle.SINGLE,size:4,color:'CAD3C6'},bottom:{style:BorderStyle.SINGLE,size:4,color:'CAD3C6'},left:{style:BorderStyle.SINGLE,size:4,color:'CAD3C6'},right:{style:BorderStyle.SINGLE,size:4,color:'CAD3C6'},insideHorizontal:{style:BorderStyle.SINGLE,size:4,color:'DCE2D8'},insideVertical:{style:BorderStyle.SINGLE,size:4,color:'DCE2D8'}},rows:[headers,...rows].map((row,i)=>new TableRow({tableHeader:i===0,cantSplit:true,children:row.map((v,n)=>new TableCell({width:{size:widths[n],type:WidthType.DXA},margins:{top:90,bottom:90,left:100,right:100},shading:i===0?{type:ShadingType.CLEAR,fill:'EDF2E8'}:undefined,children:v.split('\n').map(line=>new Paragraph({children:[new TextRun({text:line,font,size:20,bold:i===0})],spacing:{after:70,line:280}}))}))}))});
 const l=d.lesson,blocks=groundedBlocks(d.knowledge),knowledgeName=(ids:string[])=>ids.map(id=>d.knowledge.find(k=>k.id===id)?.name||'未识别知识').join('、');
 const children:(InstanceType<typeof Paragraph>|InstanceType<typeof Table>)[]=[];
 if(kind==='teacher'){
 children.push(title(l.title+' 教师教案'),t(['项目','教学安排'],[['等级与对象',`${standardNames[d.brief.standard]} ${d.brief.level}级　${d.brief.students}人`],['课时与方式',`${d.brief.minutes}分钟　${d.brief.mode}`],['已学内容',d.brief.known||'教师待补充'],['预期学习成果',d.brief.outcome]],[1900,7460]),h('教学目标'),...l.goals.flatMap((g,i)=>p(`${i+1}　${g.text}`)),h('本课知识与重点'));
 if(blocks.length)for(const b of blocks)children.push(sub(b.name+' '+b.role),...p(b.meaning||'图谱未提供释义，讲解前需教师补充核验。'),...b.examples.flatMap((s,i)=>p(`例句${i+1}　${s}`,false)));
 else children.push(...p('本课尚未形成已确认的图谱原文清单。以下仅为设计草稿，不得作为已核验教案使用。'));
 children.push(h('教学过程'),t(['环节','时间','知识内容','教师活动','学生活动','产出与评价'],l.activities.map(a=>[a.title,`${a.minutes}分钟`,knowledgeName(a.knowledgeIds),a.teacher,`${a.grouping}\n${a.students}`,`${a.output}\n评价：${a.assessment}`]),[1050,800,1350,2200,2050,1910]),h('课堂检查与参考答案'));
 for(const [i,e] of l.exercises.entries())children.push(sub(`检查题 ${i+1}`),...p(e.question),...p('参考答案或评分标准：'+e.answer));
 children.push(h('板书设计'),...p(l.board,false),h('课后与分层任务'),...p(l.homework),h('配套材料清单'),...l.materials.flatMap((m,i)=>p(`${i+1}　${m.title}`,false)),h('教师审核记录'),...p(d.reviewed?'教师已确认审核；后续修改应重新审核。':'尚未经教师审核。活动、练习、新编情境和解释须核对后使用。'));
 }else if(kind==='student'){
 children.push(title(l.title+' 学生材料'),...p(`班级：____________　姓名：____________　日期：____________`,false),h('课堂任务'),...p(d.brief.outcome));
 for(const m of l.materials.filter(m=>!/(教师|观察表|评分|参考答案)/.test(m.title)))children.push(h(m.title),...p(m.content,false));
 children.push(h('练习单'));for(const [i,e] of l.exercises.entries())children.push(sub(`练习 ${i+1}`),...p(e.question,false),...p('________________________________________________________________\n________________________________________________________________',false));
 children.push(h('课后任务'),...p(l.homework,false));
 }else{
 children.push(title(l.title+' 知识依据与审核记录'),...p('本附件区分知识图谱原始内容、教师提供的教学要求和模型设计建议。查询成功证明当时取到了节点，不代表数据库本身或所有生成内容绝对无误。'),h('内容来源分类'),t(['内容','来源与处理'],[['释义与例句','下方列出的教师选定图谱原文。模型不改写。'],['学情与预期成果','教师输入，未由图谱核验。'],['活动与角色卡情境','模型或规则模板设计，需教师审核。'],['新编练习与参考答案','生成建议，不属于图谱原题，需核验。']],[2300,7060]),h('已确认知识原文'));
 for(const b of blocks){children.push(sub(`${b.name} ${b.kind}`),...p(`节点：${b.knowledgeId}\n教学分类：${b.role}\n等级体系：${standardNames[b.standard||'']||b.standard||'未知'}\n返回等级：${b.levels.join('、')||'未返回'}\n查询时间：${b.checkedAt}\n来源：${b.source} ${b.url}`,false),...p('本课选定释义：'+(b.meaning||'未提供')), ...b.examples.flatMap((s,i)=>p(`原句${i+1}：${s}`,false)),...p('查询模板：'+(b.query||'未记录'),false),...p('查询参数：'+JSON.stringify(b.parameters||{}),false))}
 if(!blocks.length)children.push(...p('无已确认原文。未匹配条目或导入后未重新核验的条目，不计入图谱依据。'));
 children.push(h('未确认知识'),...(d.knowledge.every(k=>k.role==='排除'||(k.verified&&k.scopeConfirmed))?p('无。'):[]),...d.knowledge.filter(k=>k.role!=='排除'&&(!k.verified||!k.scopeConfirmed)).flatMap(k=>p(`${k.name}　${k.verified?'未确认本课义项':'未通过图谱核验'}`,false)),h('检查结果'),...checkLesson(l,d.brief,d.knowledge).flatMap(x=>p(x.text)),h('生成与修订信息'),...p(`方式：${d.source==='template'?'规则模板':'AI设计'}\n模型：${d.model||'历史记录未提供'}\n提示词版本：${d.promptVersion||'历史版本未记录'}\n生成时间：${d.createdAt}\n审核状态：${d.reviewed?'教师已确认':'待教师审核'}`,false),...p(l.notes));
 }
 return Packer.toBlob(new Document({styles:{default:{document:{run:{font,size:22,color:'202820'},paragraph:{spacing:{line:340}}}},paragraphStyles:[{id:'Title',name:'Title',basedOn:'Normal',next:'Normal',run:{font,size:34,bold:true,color:'000000'},paragraph:{spacing:{after:260}}},{id:'Heading1',name:'Heading 1',basedOn:'Normal',next:'Normal',run:{font,size:27,bold:true,color:'24362F'},paragraph:{keepNext:true}},{id:'Heading2',name:'Heading 2',basedOn:'Normal',next:'Normal',run:{font,size:23,bold:true,color:'354A30'},paragraph:{keepNext:true}}]},sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1134,bottom:1134,left:1134,right:1134}}},children}]}));
}
export async function exportWord(d:Draft,kind:ExportKind='teacher'){download(await makeWord(d,kind),d.lesson.title+{teacher:'-教师教案',student:'-学生材料',evidence:'-知识依据'}[kind]+'.docx')}
export function download(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name.replace(/[\\/:*?"<>|]/g,'-');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
