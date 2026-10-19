import { z } from 'zod';
const text = z.string().min(1).max(3000);
export const briefSchema = z.object({topic:text.max(120), standard:z.enum(['InternationalLevel','HSKLevel','HSK30Level']),level:z.string().min(1).max(20),minutes:z.number().int().min(15).max(180),students:z.number().int().min(1).max(100),mode:z.enum(['线下课堂','线上课堂']),outcome:text.max(600),known:z.string().max(2000),passage:z.string().max(8000),terms:z.string().max(1200)});
export type Brief=z.infer<typeof briefSchema>;
export type Knowledge={id:string;kind:'Word'|'Grammar'|'Character';name:string;role:'核心'|'复习'|'拓展'|'排除';verified:boolean;detail:string;example:string;levels:string[];relations:{type:string;name:string;detail:string}[];query?:string;checkedAt?:string;rawDetail?:string;rawExample?:string;selectedMeaning?:string;selectedExamples?:string[];scopeConfirmed?:boolean;evidence?:{standard:string;parameters:{terms:string[]};queries:string[]};};
export const goalSchema=z.object({id:text.max(30),text,knowledgeIds:z.array(z.string().max(160)).max(25)});
export const activitySchema=z.object({id:text.max(30),title:text.max(100),minutes:z.number().int().min(1).max(180),goalIds:z.array(z.string().max(30)).max(10),knowledgeIds:z.array(z.string().max(160)).max(25),teacher:text,students:text,grouping:text.max(100),output:text,assessment:text});
export const lessonSchema=z.object({title:text.max(150),goals:z.array(goalSchema).min(1).max(8),activities:z.array(activitySchema).min(2).max(12),materials:z.array(z.object({title:text.max(100),content:text})).max(12),exercises:z.array(z.object({question:text,answer:text,goalIds:z.array(z.string().max(30)).max(10),knowledgeIds:z.array(z.string().max(160)).max(25)})).min(1).max(12),board:text,homework:text,notes:z.string().max(3000)});
export type Lesson=z.infer<typeof lessonSchema>;
export type Draft={brief:Brief;knowledge:Knowledge[];lesson:Lesson;source:'template'|'deepseek'|'model';createdAt:string;promptVersion?:string;model?:string;reviewed?:boolean;validationWarnings?:string[];messages?:{role:'user'|'assistant';content:string;at:string}[]};
export const initialBrief:Brief={topic:'比较周末出游方案并提出建议',standard:'InternationalLevel',level:'3',minutes:45,students:20,mode:'线下课堂',outcome:'学生能比较两个出游方案，提出建议，并用至少两条理由说明小组的选择。',known:'时间、地点、价格；因为……所以……',passage:'',terms:'便宜、方便、建议、比较、比'};
export function splitTerms(s:string){return [...new Set(s.split(/[、，,；;\n]+/).map(s=>s.trim()).filter(Boolean))].slice(0,20)}
export function manualKnowledge(brief:Brief):Knowledge[]{return splitTerms(brief.terms).map((name,i)=>({id:`manual-${i}`,kind:'Word',name,role:'核心',verified:false,detail:'教师指定，尚未通过知识图谱核验。',example:'',levels:[],relations:[]}))}
export function templateLesson(b:Brief,k:Knowledge[]):Lesson{
 const ids=k.filter(x=>x.role==='核心').map(x=>x.id), names=k.filter(x=>x.role==='核心').map(x=>x.name).join('、')||'教师确认的目标表达';
 const weights=[5,8,10,15,7];let allocated=0;const times=weights.map((w,i)=>{const t=i===4?b.minutes-allocated:Math.max(1,Math.floor(b.minutes*w/45));allocated+=t;return t});
 const goals=[{id:'g1',text:`在“${b.topic}”情境中理解并尝试使用${names}。`,knowledgeIds:ids},{id:'g2',text:b.outcome,knowledgeIds:ids}];
 const steps=[
 ['复习与情境导入','展示本课情境，询问学生已有经验；用已学内容完成一次示范。','两人互问，记录已知信息和一个需要解决的问题。','两人一组','一份已知信息清单','观察是否能用已学表达回应。',['g1']],
 ['知识呈现与理解','呈现确认过的知识点及例句，标明用法；请学生解释表达的作用。未核验例句由教师补充。','比较例句，在语境中选择恰当表达，并说明理由。','全班与同伴','目标表达及适用情境配对','用一问一答检查理解，及时纠正。',['g1']],
 ['信息差操练','向 A、B 发放不同信息卡，要求通过提问补全信息，不能直接展示卡片。','轮流提问、回答，使用目标表达补全表格。','两人一组','一张双方共同完成的信息表','抽查信息准确性和目标表达使用情况。',['g1','g2']],
 ['合作交际任务','提出与主题相关、需要共同决策的问题。要求小组比较信息、协商并说明理由；巡视提供支架。','分工交流各自信息，协商方案，形成有理由的共同结论。',`${Math.min(4,b.students)}人一组`,'一个小组结论及至少两条理由','观察信息交换、理由是否明确，记录目标表达的使用。',['g2']],
 ['成果展示与反馈','邀请代表汇报，用目标对应的检查题进行评价，并给出一条改进建议。','展示结论，回应同伴问题，完成出口条。','小组汇报与个人反思','汇报和一张个人出口条','按内容完成、表达恰当、理由充分三项反馈。',['g1','g2']]
 ];
 return {title:b.topic,goals,activities:steps.map((s,i)=>({id:`a${i+1}`,title:s[0] as string,minutes:times[i],teacher:s[1] as string,students:s[2] as string,grouping:s[3] as string,output:s[4] as string,assessment:s[5] as string,goalIds:s[6] as string[],knowledgeIds:ids})),materials:[{title:'信息卡 A（模板，教师填充）',content:'情境：'+b.topic+'\n你知道：方案一的费用、时间。\n你不知道：方案二的信息。\n任务：向同伴询问信息；共同作出选择。\n费用、时间及地点等具体信息请教师按主题补充。'},{title:'信息卡 B（模板，教师填充）',content:'你知道：方案二的费用、时间。\n你不知道：方案一的信息。\n任务：回答同伴提问，并提出一个不同意见。'},{title:'课堂观察表',content:'□ 信息交换完整　□ 使用目标表达　□ 给出理由　□ 回应同伴\n记录：学生表现、需要补充的知识、下一课调整。'}],exercises:[{question:'选择本课一个目标表达，在本课情境中说一句话，并说明它表达的意思。',answer:'教师根据已确认的释义和使用条件核验；观察表达是否符合语境。',goalIds:['g1'],knowledgeIds:ids},{question:'结合小组任务说出你的选择，并说明理由。',answer:'开放答案；检查任务完成、理由清晰、目标表达恰当三项。',goalIds:['g2'],knowledgeIds:ids}],board:`主题：${b.topic}\n核心表达：${names}\n任务：交换信息 → 比较 → 协商 → 说明理由`,homework:'用本课目标表达完成一段与主题相关的表达，标出使用的知识点；下次课与同伴交换反馈。',notes:'规则模板草稿，未调用大模型。具体情境、信息卡数据、例句适切性和活动难度需教师补充审核。'};
}
export function checkLesson(l:Lesson,b:Brief,k:Knowledge[]){
 const issues:{severity:'warning'|'error';text:string}[]=[];const add=(text:string,severity:'warning'|'error'='warning')=>issues.push({text,severity});
 const total=l.activities.reduce((s,a)=>s+a.minutes,0);if(total!==b.minutes)add(`环节共 ${total} 分钟，与课时 ${b.minutes} 分钟不一致。`,'error');
 const ks=new Set(k.filter(x=>x.role!=='排除').map(x=>x.id)),gs=new Set(l.goals.map(g=>g.id));
 for(const g of l.goals){if(!l.activities.some(a=>a.goalIds.includes(g.id)))add(`目标「${g.text}」没有活动训练。`,'error');if(!l.exercises.some(e=>e.goalIds.includes(g.id)))add(`目标「${g.text}」没有检查题。`,'error')}
 for(const x of k.filter(x=>x.role==='核心')){if(!l.activities.some(a=>a.knowledgeIds.includes(x.id)))add(`核心知识「${x.name}」未关联活动。`,'error');if(!l.exercises.some(e=>e.knowledgeIds.includes(x.id)))add(`核心知识「${x.name}」未关联练习。`,'error')}
 for(const x of [...l.goals,...l.activities,...l.exercises])for(const id of x.knowledgeIds)if(!ks.has(id))add(`出现未确认或已排除的知识标识：${id}。`,'error');
 for(const x of [...l.activities,...l.exercises])for(const id of x.goalIds)if(!gs.has(id))add(`引用不存在的教学目标：${id}。`,'error');
 const pending=k.filter(x=>!x.verified&&x.role!=='排除');if(pending.length)add(`${pending.length} 个知识点未通过图谱核验，不能作为图谱事实引用。`);
 if(k.filter(x=>x.role==='核心').length>Math.ceil(b.minutes/5))add('本课核心知识量可能偏多，建议按学生基础删减。');
 if(!k.some(x=>x.role==='核心'))add('尚未确认本课核心知识。','error');
 if(l.goals.some((g,i)=>l.goals.findIndex(x=>x.id===g.id)!==i))add('教学目标标识重复。','error');
 if(l.activities.some((a,i)=>l.activities.findIndex(x=>x.id===a.id)!==i))add('课堂环节标识重复。','error');
 for(const x of k.filter(x=>x.verified&&x.role!=='排除'))if(!x.scopeConfirmed)add(`「${x.name}」尚未确认适合本课的义项与例句。`);
 add('结构与引用检查不等于内容准确性认证；AI活动、练习及新编表达必须由教师审核。');return issues;
}
export const standardNames:Record<string,string>={InternationalLevel:'《等级标准》',HSKLevel:'HSK 2.0',HSK30Level:'HSK 3.0'};
